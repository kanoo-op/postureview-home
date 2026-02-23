// SelectionService.js - Unified selection state, hit list, layer filtering
//
// Consumer version: no mapping mode, no context panel.
// All click/hover events flow through here.
// Controls.js passes raw intersects → this module filters, enriches,
// shows hit list for overlapping meshes, and notifies listeners.

import { getRegion, getTissueName, getMeshRegionKey } from '../anatomy/Regions.js';
import {
    selectMesh, deselectCurrentMesh, getSelectedMesh,
    setHoverHighlight, clearHoverHighlight,
    currentRenderMode,
} from '../anatomy/Highlights.js';

// ═══ Tissue group prefixes (for layer filtering) ═══
const BONE_PREFIXES = ['Bone', 'Suture', 'Teeth'];

// ═══ State ═══
let hitList = [];
let hitIndex = 0;

const listeners = { select: [], deselect: [], hover: [] };

// ═══ Public API ═══

export function handleClick(allIntersects, event) {
    const hits = enrichHits(filterHits(allIntersects));

    if (hits.length === 0) {
        performDeselect();
        hideHitListUI();
        return;
    }

    // Toggle: re-clicking same mesh deselects
    const currentSel = getSelectedMesh();
    if (hits.length === 1 && currentSel === hits[0].mesh) {
        performDeselect();
        hideHitListUI();
        return;
    }

    if (hits.length === 1) {
        hitList = hits;
        hitIndex = 0;
        hideHitListUI();
        selectHit(hits[0]);
        return;
    }

    // Multiple hits → show hit list, select first
    hitList = hits;
    hitIndex = 0;
    selectHit(hits[0]);
    showHitListUI();
}

export function handleHover(allIntersects, event) {
    const hits = filterHits(allIntersects);

    if (hits.length > 0) {
        const hit = hits[0];
        setHoverHighlight(hit.object);

        const region = getRegion(hit.object);
        const tissue = getTissueName(hit.object.userData.tissueType);

        notifyListeners('hover', {
            mesh: hit.object,
            info: {
                tissue,
                region: region.regionLabel,
                side: region.side,
                source: region.source,
                x: event.clientX,
                y: event.clientY,
            },
        });
    } else {
        clearHoverHighlight();
        notifyListeners('hover', { mesh: null, info: null });
    }
}

export function handleRightClick(allIntersects) {
    // No-op in consumer app (no mapping mode)
}

export function cycleHit(direction = 1) {
    if (hitList.length < 2) return;
    hitIndex = (hitIndex + direction + hitList.length) % hitList.length;
    selectHit(hitList[hitIndex]);
    updateHitListUI();
}

export function select(mesh, info) {
    hitList = [];
    hitIndex = 0;
    hideHitListUI();

    deselectCurrentMesh();
    selectMesh(mesh);
    notifyListeners('select', { mesh, regionId: null, info });
}

export function deselect() {
    performDeselect();
    hideHitListUI();
}

export function getActiveMesh() {
    return getSelectedMesh();
}

export function getHitList() {
    return hitList;
}

export function onSelect(callback) { listeners.select.push(callback); }
export function onDeselect(callback) { listeners.deselect.push(callback); }
export function onHover(callback) { listeners.hover.push(callback); }

export function initSelectionKeyboard() {
    document.addEventListener('keydown', (e) => {
        const panel = document.getElementById('hit-list-panel');
        if (!panel) return;

        if (e.key === 'Tab' && panel.style.display !== 'none') {
            e.preventDefault();
            cycleHit(e.shiftKey ? -1 : 1);
            return;
        }

        if (e.key === 'Escape' && panel.style.display !== 'none') {
            hideHitListUI();
        }
    });
}

// ═══ Internal helpers ═══

function filterHits(intersects) {
    return intersects.filter(hit => {
        if (!hit.object.isMesh || !hit.object.visible) return false;
        return passesLayerFilter(hit.object);
    });
}

function passesLayerFilter(mesh) {
    const mode = currentRenderMode;
    if (mode === 'skeleton') {
        const tissue = mesh.userData.tissueType || '';
        return BONE_PREFIXES.some(p => tissue.startsWith(p));
    }
    return true;
}

function enrichHits(filteredIntersects) {
    return filteredIntersects.map(hit => {
        const mesh = hit.object;
        const region = getRegion(mesh);
        const tissue = getTissueName(mesh.userData.tissueType);
        const regionKey = getMeshRegionKey(mesh.name);
        return {
            mesh, region, tissue, regionKey,
            meshId: mesh.name || mesh.uuid,
            info: {
                tissue,
                region: region.regionLabel,
                side: region.side,
                source: region.source,
                meshId: mesh.name || mesh.uuid,
                regionKey,
                point: hit.point ? { x: hit.point.x, y: hit.point.y, z: hit.point.z } : null,
            },
        };
    });
}

function selectHit(hit) {
    deselectCurrentMesh();
    selectMesh(hit.mesh);
    notifyListeners('select', {
        mesh: hit.mesh,
        regionId: hit.region?.regionId || null,
        info: hit.info,
    });
}

function performDeselect() {
    hitList = [];
    hitIndex = 0;
    deselectCurrentMesh();
    notifyListeners('deselect', {});
}

function notifyListeners(event, data) {
    for (const cb of listeners[event]) {
        try { cb(data); } catch (e) { console.error('SelectionService listener error:', e); }
    }
}

// ═══ Hit List UI ═══

function showHitListUI() {
    const panel = document.getElementById('hit-list-panel');
    if (!panel) return;
    panel.style.display = '';
    updateHitListUI();
}

function hideHitListUI() {
    const panel = document.getElementById('hit-list-panel');
    if (!panel) return;
    panel.style.display = 'none';
}

function updateHitListUI() {
    const container = document.getElementById('hit-list-items');
    if (!container) return;

    container.innerHTML = hitList.map((hit, idx) => {
        const active = idx === hitIndex ? ' active' : '';
        const side = hit.region?.side === 'l' ? '좌' : hit.region?.side === 'r' ? '우' : '';
        const sideLabel = side ? ` (${side})` : '';
        return `
            <div class="hit-list-item${active}" data-hit-idx="${idx}">
                <span class="hit-list-item-idx">${idx + 1}</span>
                <span>${hit.tissue}${sideLabel}</span>
                <span class="hit-list-item-region">${hit.region?.regionLabel || ''}</span>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.hit-list-item').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.hitIdx, 10);
            if (!isNaN(idx) && idx >= 0 && idx < hitList.length) {
                hitIndex = idx;
                selectHit(hitList[idx]);
                updateHitListUI();
            }
        });
    });
}
