// SceneManager.js - Three.js scene, camera, renderer, lighting, render loop
// viewer.js 전반부에서 분리

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { viewMode, renderMultiView, handleMultiViewResize, updateMultiViewControls } from './MultiView.js';

export let scene, camera, renderer;
export let envMap = null;
let animationId;
let isContextLost = false;

/**
 * Create a clean, warm-neutral background that matches the app theme
 */
function createGradientBackground() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    if (isDark) {
        gradient.addColorStop(0, '#1e2024');
        gradient.addColorStop(0.4, '#1a1b1f');
        gradient.addColorStop(1, '#16171a');
    } else {
        gradient.addColorStop(0, '#F0EDE8');
        gradient.addColorStop(0.4, '#EBE8E2');
        gradient.addColorStop(1, '#E5E1DA');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
}

/** Update scene background when theme changes */
export function updateSceneBackground() {
    if (scene) scene.background = createGradientBackground();
}

/**
 * Initialize the Three.js scene
 */
export function initScene(canvas) {
    // Scene
    scene = new THREE.Scene();
    scene.background = createGradientBackground();

    // Camera
    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1000);
    camera.position.set(0, 1.0, 3.0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    // Environment map (subtle studio reflections)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment(renderer);
    envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envMap;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // --- Clean studio lighting (warm-neutral, matches app theme) ---

    // Warm ambient base
    const ambientLight = new THREE.AmbientLight(0xf5efe6, 0.6);
    scene.add(ambientLight);

    // Hemisphere: warm sky, soft ground
    const hemiLight = new THREE.HemisphereLight(0xfff8f0, 0xe8e0d4, 0.55);
    scene.add(hemiLight);

    // Key light (main, with shadows) - warm white
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 1.4);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.001;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);

    // Fill light (soft warm from opposite side)
    const fillLight = new THREE.DirectionalLight(0xe8ddd0, 0.6);
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    // Rim light (subtle teal accent for edge definition)
    const rimLight = new THREE.DirectionalLight(0x8ac4b8, 0.35);
    rimLight.position.set(0, 2, -5);
    scene.add(rimLight);

    // Subtle bottom bounce (warm)
    const bounceLight = new THREE.DirectionalLight(0xd4c8b8, 0.25);
    bounceLight.position.set(0, -3, 1);
    scene.add(bounceLight);

    // WebGL context loss/restore handling
    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        isContextLost = true;
        console.warn('WebGL context lost');
    });
    canvas.addEventListener('webglcontextrestored', () => {
        isContextLost = false;
        console.log('WebGL context restored');
        // Force material recompilation after context restore
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.needsUpdate = true;
            }
        });
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        handleMultiViewResize(width, height);
    });
    resizeObserver.observe(canvas.parentElement);

    return { scene, camera, renderer };
}

/**
 * Start the render loop
 */
export function startRenderLoop() {
    function animate() {
        animationId = requestAnimationFrame(animate);
        if (isContextLost) return;
        updateMultiViewControls();
        try {
            if (viewMode !== 'single') {
                renderMultiView(renderer, scene);
            } else {
                // 다중 뷰에서 돌아올 때 뷰포트를 전체 캔버스로 리셋
                const cw = renderer.domElement.clientWidth;
                const ch = renderer.domElement.clientHeight;
                renderer.setViewport(0, 0, cw, ch);
                renderer.setScissor(0, 0, cw, ch);
                renderer.setScissorTest(false);
                renderer.render(scene, camera);
            }
        } catch (e) {
            console.warn('Render error:', e.message);
        }
    }
    animate();
}

/**
 * Stop the render loop
 */
export function stopRenderLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

/**
 * Capture a screenshot of the current 3D view
 * @returns {string|null} data URL of the screenshot
 */
export function captureScreenshot() {
    if (!renderer) return null;
    // Force a render to ensure the latest frame
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
}

/**
 * Capture a quad-view screenshot (front/back/left/right)
 * @returns {string|null} data URL of the quad screenshot
 */
export function captureQuadScreenshot() {
    if (!renderer || !scene) return null;

    // 현재 렌더러 크기 저장
    const prevSize = new THREE.Vector2();
    renderer.getSize(prevSize);

    // 고정 크기로 강제 설정 (캔버스 가시성과 무관하게 동작)
    const W = 1024;
    const H = 768;
    renderer.setSize(W, H, false);

    // Model center
    const center = new THREE.Vector3(0, 0.85, 0);
    const dist = 2.5;
    const yOff = 0.3;

    const views = [
        [0, yOff, dist],       // Front
        [0, yOff, -dist],      // Back
        [-dist, yOff, 0],      // Left
        [dist, yOff, 0],       // Right
    ];

    const rects = [
        { x: 0, y: 0, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ];

    const tempCam = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);

    renderer.setScissorTest(true);
    renderer.autoClear = false;
    renderer.setViewport(0, 0, W, H);
    renderer.setScissor(0, 0, W, H);
    renderer.clear();

    for (let i = 0; i < 4; i++) {
        const r = rects[i];
        const pos = views[i];
        tempCam.position.set(center.x + pos[0], center.y + pos[1], center.z + pos[2]);
        tempCam.lookAt(center);
        tempCam.aspect = (r.w * W) / (r.h * H);
        tempCam.updateProjectionMatrix();

        const x = r.x * W;
        const y = (1 - r.y - r.h) * H;
        const w = r.w * W;
        const h = r.h * H;

        renderer.setViewport(x, y, w, h);
        renderer.setScissor(x, y, w, h);
        renderer.render(scene, tempCam);
    }

    renderer.setScissorTest(false);
    renderer.autoClear = true;

    const dataUrl = renderer.domElement.toDataURL('image/png');

    // 원래 렌더러 크기 복원
    renderer.setSize(prevSize.x, prevSize.y, false);

    return dataUrl;
}
