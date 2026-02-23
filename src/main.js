// main.js - PostureView Home entry point (v2: restructured navigation)

import './styles/main.css';

import { initScene, startRenderLoop, updateSceneBackground } from './core/SceneManager.js';
import { loadModel } from './core/ModelLoader.js';
import { scene, camera } from './core/SceneManager.js';
import { initControls } from './core/Controls.js';
import { onHover, initSelectionKeyboard } from './core/SelectionService.js';
import { setRenderMode } from './anatomy/Highlights.js';
import { loadMapping } from './anatomy/Regions.js';
import { initMultiView } from './core/MultiView.js';
import { initRouter, navigate, registerScreen, registerScreenCleanup } from './app/Router.js';
import { initTodayScreen } from './screens/TodayScreen.js';
import { initPainScreen, cleanupPainScreen } from './screens/PainScreen.js';
import { initLibraryScreen } from './screens/LibraryScreen.js';
import { initProgramScreen } from './screens/ProgramScreen.js';
import { initProgressScreen } from './screens/ProgressScreen.js';
import { checkOnboarding } from './app/Onboarding.js';
import { checkAchievements } from './utils/gamification.js';
import { getAppData, migrateV1Plans } from './services/Storage.js';

// Toast + Video Modal (self-registering on window)
import './ui/Toast.js';
import './ui/VideoModal.js';

// DOM references
const loadingOverlay = document.getElementById('loading-overlay');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercent = document.getElementById('progress-percent');
const progressText = document.getElementById('progress-text');
const app = document.getElementById('app');
const tooltip = document.getElementById('tooltip');
const tooltipTissue = document.getElementById('tooltip-tissue');
const tooltipRegion = document.getElementById('tooltip-region');
const canvas = document.getElementById('three-canvas');

// --- Initialize Three.js ---
initScene(canvas);

// --- Load Model ---
loadModel(
    // onProgress
    (percent, mbLoaded, mbTotal) => {
        progressBarFill.style.width = percent + '%';
        progressPercent.textContent = Math.round(percent) + '%';
        progressText.textContent = `모델 로딩 중 (${mbLoaded} / ${mbTotal} MB)`;
    },
    // onComplete
    async (modelRoot, bounds) => {
        // Fade out loading
        loadingOverlay.classList.add('fade-out');
        app.style.display = 'flex';

        // Start render loop
        startRenderLoop();

        // Initialize controls
        initControls(canvas, { modelCenter: bounds.center });

        // Initialize MultiView (default to single view for consumers)
        initMultiView(canvas, scene, camera, bounds.center);

        // Load mapping file
        try {
            const resp = await fetch('/mapping_Final.json');
            if (resp.ok) {
                const mappingJson = await resp.json();
                loadMapping(mappingJson);
            }
        } catch (e) {
            console.warn('매핑 파일 로드 실패:', e);
        }

        // Selection service: keyboard + hover tooltip
        initSelectionKeyboard();
        onHover(({ mesh, info }) => handleMeshHover(mesh, info));

        // Initialize pain screen (needs 3D model)
        initPainScreen();

        // Initialize router and navigation
        initRouter();

        // Register screen init functions
        registerScreen('today', () => initTodayScreen());
        registerScreen('program', () => initProgramScreen());
        registerScreen('pain', () => {
            const viewer = document.getElementById('viewer-container');
            if (viewer) viewer.style.display = '';
        });
        registerScreen('library', () => initLibraryScreen());
        registerScreen('progress', () => initProgressScreen());

        // Cleanup: 화면 전환 시 정리
        registerScreenCleanup('pain', cleanupPainScreen);

        // Init UI features
        initRenderModeToggle();
        initThemeToggle();
        initScreenTabs();

        // Global navigation helper
        window._navigate = navigate;

        // Personalized greeting
        try {
            const profile = await getAppData('profile');
            if (profile && profile.name) {
                const greeting = document.getElementById('today-greeting');
                if (greeting) greeting.textContent = `${profile.name}님, 오늘도 파이팅!`;
            }
        } catch (e) { /* ignore */ }

        // Migrate v1 plans to v2 programs
        migrateV1Plans().catch(() => {});

        // Navigate to today screen
        navigate('today');

        // Remove loading overlay after animation
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 700);

        // Check onboarding (first run)
        setTimeout(() => checkOnboarding(), 1000);

        // Check achievements in background
        setTimeout(() => checkAchievements(), 2000);
    },
    // onError
    (error) => {
        progressText.textContent = '모델 로딩 오류. 페이지를 새로고침해 주세요.';
        progressPercent.textContent = '';
        progressBarFill.style.width = '0%';
        progressBarFill.style.background = '#C45B4A';
    }
);

// --- Hover Tooltip ---

function handleMeshHover(mesh, info) {
    if (mesh && info) {
        tooltip.style.display = 'block';
        tooltip.style.left = (info.x + 16) + 'px';
        tooltip.style.top = (info.y + 16) + 'px';
        tooltipTissue.textContent = info.tissue;
        tooltipRegion.textContent = `${info.region} (${info.side})`;

        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            tooltip.style.left = (info.x - rect.width - 16) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            tooltip.style.top = (info.y - rect.height - 16) + 'px';
        }
    } else {
        tooltip.style.display = 'none';
    }
}

// --- Render Mode Toggle ---

function initRenderModeToggle() {
    document.querySelectorAll('.render-mode-btn[data-render-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            setRenderMode(btn.dataset.renderMode);
            document.querySelectorAll('.render-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// --- Theme Toggle ---

function initThemeToggle() {
    const saved = localStorage.getItem('postureview_theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    updateThemeLabel();

    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('postureview_theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('postureview_theme', 'dark');
            }
            updateThemeLabel();
            updateSceneBackground();
        });
    }
}

function updateThemeLabel() {
    const label = document.querySelector('.theme-label-text');
    if (label) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        label.textContent = isDark ? '라이트모드' : '다크모드';
    }
}

// --- Screen Tabs ---

function initScreenTabs() {
    document.querySelectorAll('.screen-tab[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            const parent = tab.closest('.screen-content');
            if (!parent) return;

            parent.querySelectorAll('.screen-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.dataset.tab;
            parent.querySelectorAll('.tab-content').forEach(c => {
                c.style.display = c.id === target ? '' : 'none';
            });
        });
    });
}
