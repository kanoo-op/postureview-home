// PostureScreen.js - 환자용 자세 분석 화면
// PoseDetector / PoseOverlay 재사용, 환자 친화적 UI

import { analyzePosture, initPoseLandmarker } from '../pose/PoseDetector.js';
import { drawLandmarks } from '../pose/PoseOverlay.js';
import { getAnatomyInfo } from '../anatomy/BodyData.js';
import { addPostureCheck, getAllPostureChecks, savePhoto, getPhoto, deletePostureCheck, deletePhoto } from '../services/Storage.js';
import { navigate } from '../app/Router.js';

let webcamStream = null;
let lastAnalysisResult = null;
let lastPhotoBase64 = null;

const SEV_LABELS = { normal: '양호', mild: '주의 필요', moderate: '관리 권장', severe: '전문가 상담 권장' };
const SEV_COLORS = {
    normal: '#2E7D32', mild: '#F9A825',
    moderate: '#E65100', severe: '#C62828'
};

const METRIC_LABELS = {
    forwardHeadAngle: '거북목 경향',
    shoulderLevelDiff: '어깨 높이 차이',
    pelvicTilt: '골반 기울기',
    trunkLateralTilt: '몸통 기울기',
    upperBackKyphosis: '등 굽음',
};

export function initPostureScreen() {
    loadHistory();

    // 파일 업로드
    const fileInput = document.getElementById('posture-file-input');
    const dropzone = document.getElementById('posture-dropzone');
    const browseBtn = document.getElementById('posture-browse-btn');

    if (browseBtn && !browseBtn._bound) {
        browseBtn._bound = true;
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }
    if (dropzone && !dropzone._bound) {
        dropzone._bound = true;
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) handleImageFile(file);
        });
    }
    if (fileInput && !fileInput._bound) {
        fileInput._bound = true;
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImageFile(file);
            fileInput.value = '';
        });
    }

    // 웹캠 버튼
    const webcamStartBtn = document.getElementById('posture-webcam-start');
    const webcamCaptureBtn = document.getElementById('posture-webcam-capture');
    const webcamStopBtn = document.getElementById('posture-webcam-stop');

    if (webcamStartBtn && !webcamStartBtn._bound) {
        webcamStartBtn._bound = true;
        webcamStartBtn.addEventListener('click', startWebcam);
    }
    if (webcamCaptureBtn && !webcamCaptureBtn._bound) {
        webcamCaptureBtn._bound = true;
        webcamCaptureBtn.addEventListener('click', captureWebcam);
    }
    if (webcamStopBtn && !webcamStopBtn._bound) {
        webcamStopBtn._bound = true;
        webcamStopBtn.addEventListener('click', stopWebcam);
    }

    // MediaPipe 프리로드
    initPoseLandmarker().catch((err) => {
        console.warn('MediaPipe preload failed:', err);
    });
}

export function cleanupPostureScreen() {
    stopWebcam();
}

// ═══ 사진 처리 ═══

async function handleImageFile(file) {
    showLoading('이미지 분석 중...');
    const reader = new FileReader();
    reader.onload = async (evt) => {
        lastPhotoBase64 = evt.target.result;
        const img = new Image();
        img.onload = async () => await runAnalysis(img);
        img.onerror = () => showError('이미지를 로드할 수 없습니다.');
        img.src = lastPhotoBase64;
    };
    reader.readAsDataURL(file);
}

async function startWebcam() {
    const video = document.getElementById('posture-webcam-video');
    const webcamArea = document.getElementById('posture-webcam-area');
    const startBtn = document.getElementById('posture-webcam-start');
    const captureBtn = document.getElementById('posture-webcam-capture');
    const stopBtn = document.getElementById('posture-webcam-stop');

    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        video.srcObject = webcamStream;
        await video.play();
        webcamArea.style.display = 'block';
        startBtn.style.display = 'none';
        captureBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'inline-flex';
    } catch (err) {
        showError('카메라에 접근할 수 없습니다: ' + err.message);
    }
}

async function captureWebcam() {
    const video = document.getElementById('posture-webcam-video');
    if (!video.srcObject) return;

    showLoading('캡처 이미지 분석 중...');
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext('2d').drawImage(video, 0, 0);
    lastPhotoBase64 = tempCanvas.toDataURL('image/jpeg', 0.8);

    const img = new Image();
    img.onload = async () => await runAnalysis(img);
    img.src = lastPhotoBase64;
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
        webcamStream = null;
    }
    const video = document.getElementById('posture-webcam-video');
    const webcamArea = document.getElementById('posture-webcam-area');
    const startBtn = document.getElementById('posture-webcam-start');
    const captureBtn = document.getElementById('posture-webcam-capture');
    const stopBtn = document.getElementById('posture-webcam-stop');

    if (video) video.srcObject = null;
    if (webcamArea) webcamArea.style.display = 'none';
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (captureBtn) captureBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'none';
}

// ═══ 분석 ═══

async function runAnalysis(imageElement) {
    try {
        const result = await analyzePosture(imageElement);
        if (!result) {
            showError('포즈를 감지할 수 없습니다. 전신이 보이는 사진을 사용해주세요.');
            return;
        }
        lastAnalysisResult = result;
        renderImageWithOverlay(imageElement, result);
        renderResults(result);
        hideLoading();
    } catch (err) {
        showError('분석 중 오류 발생: ' + err.message);
        console.error('Posture analysis error:', err);
    }
}

function renderImageWithOverlay(imageElement, result) {
    const container = document.getElementById('posture-preview-area');
    const imageCanvas = document.getElementById('posture-image-canvas');
    const overlayCanvas = document.getElementById('posture-overlay-canvas');
    if (!container || !imageCanvas || !overlayCanvas) return;

    container.style.display = 'block';
    const maxW = container.clientWidth || 560;
    const ratio = imageElement.width / imageElement.height;
    const displayW = Math.min(maxW, imageElement.width);
    const displayH = displayW / ratio;

    imageCanvas.width = displayW;
    imageCanvas.height = displayH;
    overlayCanvas.width = displayW;
    overlayCanvas.height = displayH;

    imageCanvas.getContext('2d').drawImage(imageElement, 0, 0, displayW, displayH);
    drawLandmarks(overlayCanvas.getContext('2d'), result.landmarks, displayW, displayH, result.metrics);
}

// ═══ 결과 렌더링 ═══

function renderResults(result) {
    const panel = document.getElementById('posture-results');
    if (!panel) return;
    panel.style.display = 'block';

    const { metrics, regionMapping, confidence } = result;
    const severities = regionMapping.map(r => r.severity);
    const worstSev = getWorstSeverity(severities);
    const summaryColor = SEV_COLORS[worstSev] || SEV_COLORS.normal;
    const viewLabel = metrics._viewType === 'lateral' ? '측면' : '정면';

    const confidenceHtml = renderConfidence(confidence);
    const metricsHtml = renderMetricsList(metrics);
    const affectedHtml = renderAffectedRegions(regionMapping);

    panel.innerHTML = `
        <div class="posture-results-header">
            <h3>분석 결과</h3>
            <div class="posture-overall-badge" style="background:${summaryColor};">${SEV_LABELS[worstSev] || '양호'}</div>
        </div>
        ${confidenceHtml}
        <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:8px;">촬영 방향: <strong style="color:var(--text-secondary);">${viewLabel}</strong></div>
        <div class="posture-metrics-section">
            <div class="posture-section-label">자세 지표</div>
            ${metricsHtml}
        </div>
        <div class="posture-affected-section">
            <div class="posture-section-label">영향 부위 (${regionMapping.length}개)</div>
            ${affectedHtml}
        </div>
        <div class="posture-save-section">
            <button id="posture-save-btn" class="btn-primary" style="width:100%;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                분석 결과 저장
            </button>
        </div>
    `;

    // 영향 부위 → 운동 보기 클릭
    panel.querySelectorAll('.posture-exercise-link').forEach(btn => {
        btn.addEventListener('click', () => {
            navigate('library');
        });
    });

    // 저장 버튼
    document.getElementById('posture-save-btn')?.addEventListener('click', saveAnalysis);
}

function renderConfidence(confidence) {
    if (confidence === undefined || confidence === null) return '';
    const pct = Math.round(confidence * 100);
    const color = pct >= 70 ? '#2E7D32' : pct >= 40 ? '#E65100' : '#C62828';
    const warning = pct < 50 ? `
        <div class="posture-confidence-warning">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            신뢰도가 낮습니다. 전신이 잘 보이는 사진으로 다시 시도해주세요.
        </div>` : '';

    return `
        <div class="posture-confidence-section">
            <div class="posture-confidence-header">
                <span>분석 신뢰도</span>
                <span style="font-weight:600;color:${color};">${pct}%</span>
            </div>
            <div class="posture-confidence-bar">
                <div class="posture-confidence-fill" style="width:${pct}%;background:${color};"></div>
            </div>
            ${warning}
        </div>`;
}

function renderMetricsList(metrics) {
    const items = [
        metrics.forwardHeadAngle,
        metrics.shoulderLevelDiff,
        metrics.pelvicTilt,
        metrics.trunkLateralTilt,
        {
            label: '무릎 정렬 (좌)',
            value: metrics.kneeAlignment.left.type === 'normal' ? '정상' : metrics.kneeAlignment.left.type,
            unit: '', severity: metrics.kneeAlignment.left.severity,
        },
        {
            label: '무릎 정렬 (우)',
            value: metrics.kneeAlignment.right.type === 'normal' ? '정상' : metrics.kneeAlignment.right.type,
            unit: '', severity: metrics.kneeAlignment.right.severity,
        },
        metrics.upperBackKyphosis,
    ];

    const filtered = items.filter(item => !item.skipped);
    if (filtered.length === 0) return '<p class="posture-no-issues">분석 가능한 지표가 없습니다.</p>';

    return filtered.map(item => {
        const sevColor = SEV_COLORS[item.severity] || SEV_COLORS.normal;
        const friendlyLabel = METRIC_LABELS[item.key] || item.label;
        const displayValue = typeof item.value === 'number' ? `${item.value}${item.unit}` : item.value;

        return `
            <div class="posture-metric-item">
                <div class="posture-metric-info">
                    <span class="posture-metric-label">${friendlyLabel}</span>
                    <span class="posture-metric-value">${displayValue}</span>
                </div>
                <div class="posture-metric-bar-track">
                    <div class="posture-metric-bar-fill" style="width:${severityToPercent(item.severity)}%;background:${sevColor};"></div>
                </div>
                <span class="posture-metric-sev" style="color:${sevColor};">${SEV_LABELS[item.severity]}</span>
            </div>`;
    }).join('');
}

function renderAffectedRegions(regionMapping) {
    if (regionMapping.length === 0) return '<p class="posture-no-issues">모든 지표가 양호합니다!</p>';

    const regionMap = dedupeRegions(regionMapping);
    return [...regionMap.values()].map(r => {
        const sevColor = SEV_COLORS[r.severity] || SEV_COLORS.normal;
        const info = getAnatomyInfo(r.regionKey);
        const exerciseName = info?.exercises?.[0]?.name || '';

        return `
            <div class="posture-affected-item">
                <span class="posture-affected-dot" style="background:${sevColor};"></span>
                <div class="posture-affected-content">
                    <span class="posture-affected-name">${r.regionKey}</span>
                    <span class="posture-affected-reason">${r.reason}</span>
                    ${exerciseName ? `<button class="posture-exercise-link">이 부위 운동 보기</button>` : ''}
                </div>
                <span class="posture-affected-sev" style="color:${sevColor};">${SEV_LABELS[r.severity]}</span>
            </div>`;
    }).join('');
}

// ═══ 저장 ═══

async function saveAnalysis() {
    if (!lastAnalysisResult) return;

    const { metrics, regionMapping, confidence } = lastAnalysisResult;
    const worstSev = getWorstSeverity(regionMapping.map(r => r.severity));

    const check = await addPostureCheck({
        overallSeverity: worstSev,
        confidence: confidence,
        metrics: summarizeMetrics(metrics),
        affectedRegions: [...dedupeRegions(regionMapping).keys()],
        viewType: metrics._viewType,
    });

    // 사진 저장
    if (lastPhotoBase64) {
        const blob = await (await fetch(lastPhotoBase64)).blob();
        await savePhoto(check.id, blob);
    }

    if (window.showToast) window.showToast('분석 결과가 저장되었습니다.', 'success');
    loadHistory();
}

// ═══ 기록 목록 ═══

async function loadHistory() {
    const list = document.getElementById('posture-history-list');
    if (!list) return;

    const checks = await getAllPostureChecks();
    if (!checks || checks.length === 0) {
        list.innerHTML = '<p class="empty-state">아직 분석 기록이 없습니다.</p>';
        return;
    }

    // 최신순 정렬
    checks.sort((a, b) => new Date(b.date) - new Date(a.date));

    list.innerHTML = checks.slice(0, 20).map(c => {
        const date = new Date(c.date);
        const dateStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
        const timeStr = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
        const sevColor = SEV_COLORS[c.overallSeverity] || SEV_COLORS.normal;
        const sevLabel = SEV_LABELS[c.overallSeverity] || '양호';
        const regions = c.affectedRegions?.join(', ') || '-';

        return `
            <div class="posture-history-item" data-id="${c.id}">
                <div class="posture-history-thumb" id="thumb-${c.id}"></div>
                <div class="posture-history-info">
                    <div class="posture-history-date">${dateStr} ${timeStr}</div>
                    <div class="posture-history-regions">${regions}</div>
                </div>
                <div class="posture-history-sev" style="color:${sevColor};">${sevLabel}</div>
                <button class="posture-history-delete" data-id="${c.id}" title="삭제">&times;</button>
            </div>`;
    }).join('');

    // 썸네일 로드
    for (const c of checks.slice(0, 20)) {
        const thumbEl = document.getElementById(`thumb-${c.id}`);
        if (!thumbEl) continue;
        try {
            const photo = await getPhoto(c.id);
            if (photo && photo.blob) {
                const url = URL.createObjectURL(photo.blob);
                thumbEl.style.backgroundImage = `url(${url})`;
            }
        } catch { /* ignore */ }
    }

    // 삭제 버튼
    list.querySelectorAll('.posture-history-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            await deletePostureCheck(id);
            await deletePhoto(id);
            loadHistory();
            if (window.showToast) window.showToast('기록이 삭제되었습니다.', 'info');
        });
    });
}

// ═══ 유틸 ═══

function dedupeRegions(regionMapping) {
    const map = new Map();
    for (const r of regionMapping) {
        const existing = map.get(r.regionKey);
        if (!existing || severityRank(r.severity) > severityRank(existing.severity)) {
            map.set(r.regionKey, r);
        }
    }
    return map;
}

function summarizeMetrics(metrics) {
    return {
        forwardHead: { value: metrics.forwardHeadAngle.value, severity: metrics.forwardHeadAngle.severity },
        shoulderDiff: { value: metrics.shoulderLevelDiff.value, severity: metrics.shoulderLevelDiff.severity },
        pelvicTilt: { value: metrics.pelvicTilt.value, severity: metrics.pelvicTilt.severity },
        trunkTilt: { value: metrics.trunkLateralTilt.value, severity: metrics.trunkLateralTilt.severity },
        kneeLeft: { type: metrics.kneeAlignment.left.type, severity: metrics.kneeAlignment.left.severity },
        kneeRight: { type: metrics.kneeAlignment.right.type, severity: metrics.kneeAlignment.right.severity },
        kyphosis: { severity: metrics.upperBackKyphosis.severity },
    };
}

function severityRank(sev) {
    return { normal: 0, mild: 1, moderate: 2, severe: 3 }[sev] || 0;
}

function getWorstSeverity(severities) {
    let worst = 'normal';
    for (const s of severities) {
        if (severityRank(s) > severityRank(worst)) worst = s;
    }
    return worst;
}

function severityToPercent(sev) {
    return { normal: 15, mild: 40, moderate: 70, severe: 100 }[sev] || 15;
}

function showLoading(msg) {
    const el = document.getElementById('posture-loading');
    if (el) { el.style.display = 'flex'; el.querySelector('.posture-loading-text').textContent = msg || '분석 중...'; }
    const err = document.getElementById('posture-error');
    if (err) err.style.display = 'none';
}

function hideLoading() {
    const el = document.getElementById('posture-loading');
    if (el) el.style.display = 'none';
}

function showError(msg) {
    hideLoading();
    const el = document.getElementById('posture-error');
    if (el) { el.style.display = 'block'; el.textContent = msg; }
}
