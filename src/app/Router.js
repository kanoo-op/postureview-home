// Router.js - 5-screen router (v2: restructured navigation)

const SCREENS = ['today', 'program', 'pain', 'posture', 'search', 'library', 'progress', 'settings'];
let currentScreen = null;
let screenInitFns = {};
let screenCleanupFns = {};

export function registerScreen(id, initFn) {
    screenInitFns[id] = initFn;
}

export function registerScreenCleanup(id, cleanupFn) {
    screenCleanupFns[id] = cleanupFn;
}

export function navigate(screenId) {
    if (!SCREENS.includes(screenId)) return;

    // Cleanup previous screen
    if (currentScreen && screenCleanupFns[currentScreen]) {
        screenCleanupFns[currentScreen]();
    }

    // Hide all screens
    for (const id of SCREENS) {
        const el = document.getElementById(`screen-${id}`);
        if (el) el.style.display = 'none';
    }

    // Show target screen
    const target = document.getElementById(`screen-${screenId}`);
    if (target) target.style.display = '';

    // 3D viewer: only shown on pain management screen
    const viewer = document.getElementById('viewer-container');
    if (viewer) {
        viewer.style.display = screenId === 'pain' ? '' : 'none';
    }

    // Call init function if registered
    if (screenInitFns[screenId]) {
        screenInitFns[screenId]();
    }

    currentScreen = screenId;
    updateNavHighlight(screenId);
}

export function getCurrentScreen() {
    return currentScreen;
}

function updateNavHighlight(screenId) {
    document.querySelectorAll('.bottom-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.screen === screenId);
    });
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.screen === screenId);
    });
}

export function initRouter() {
    document.querySelectorAll('.bottom-tab').forEach(tab => {
        tab.addEventListener('click', () => navigate(tab.dataset.screen));
    });
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', () => navigate(item.dataset.screen));
    });
}
