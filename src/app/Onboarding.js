// Onboarding.js - 향상된 온보딩 위저드 (5단계)

import { getAppData, setAppData, addProgram } from '../services/Storage.js';
import { generateProgram } from '../services/ProgramEngine.js';

const GOALS = [
    { id: 'lower_back', label: '허리', icon: '🦴' },
    { id: 'shoulder',   label: '어깨', icon: '💪' },
    { id: 'knee',       label: '무릎', icon: '🦵' },
    { id: 'neck',       label: '목',   icon: '🧣' },
    { id: 'posture',    label: '자세', icon: '🧍' },
    { id: 'fitness',    label: '체력', icon: '🏃' },
];

const RESTRICTIONS = [
    '쪼그려 앉기 힘듦',
    '팔을 위로 들기 어려움',
    '오래 서있기 힘듦',
    '오래 앉아있기 힘듦',
    '계단 오르기 어려움',
    '무거운 것 들기 어려움',
];

export async function checkOnboarding() {
    const profile = await getAppData('profile');
    if (profile && profile.onboardingDone) return false;
    showOnboarding();
    return true;
}

// 프로그램 화면에서 호출
export function showOnboardingForProgram() {
    showOnboarding();
}

function showOnboarding() {
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.innerHTML = `
        <div class="onboarding-card">
            <div class="onboarding-progress">
                <div class="onboarding-progress-fill" id="onboarding-progress-fill" style="width:20%"></div>
            </div>

            <!-- Step 1: 목표 -->
            <div class="onboarding-step" data-step="1">
                <h2>어떤 목표가 있으세요?</h2>
                <p>하나 이상 선택해주세요</p>
                <div class="onboarding-goals">
                    ${GOALS.map(g => `
                        <label class="onboarding-goal-item" data-goal="${g.id}">
                            <input type="checkbox" value="${g.id}">
                            <span class="goal-icon">${g.icon}</span>
                            <span>${g.label}</span>
                        </label>
                    `).join('')}
                </div>
                <button class="btn-primary onboarding-next" data-next="2">다음</button>
            </div>

            <!-- Step 2: 현재 상태 -->
            <div class="onboarding-step" data-step="2" style="display:none;">
                <h2>현재 불편한 곳이 있나요?</h2>
                <p>해당하는 곳을 터치하고 강도를 설정하세요 (선택)</p>
                <div class="onboarding-pain-regions" id="onboarding-pain-regions">
                    <div class="onboarding-region-buttons">
                        <button class="onboarding-region-btn" data-region="neck_l">목</button>
                        <button class="onboarding-region-btn" data-region="shoulder_l">어깨</button>
                        <button class="onboarding-region-btn" data-region="upper_back_l">등</button>
                        <button class="onboarding-region-btn" data-region="lower_back_l">허리</button>
                        <button class="onboarding-region-btn" data-region="hip_l">골반</button>
                        <button class="onboarding-region-btn" data-region="thigh_l">허벅지</button>
                        <button class="onboarding-region-btn" data-region="shin_l">무릎/종아리</button>
                        <button class="onboarding-region-btn" data-region="foot_l">발</button>
                    </div>
                    <div id="onboarding-pain-detail" style="display:none;">
                        <div class="onboarding-pain-selected" id="onboarding-pain-selected-label"></div>
                        <label>통증 강도 (0~10)</label>
                        <input type="range" id="onboarding-pain-intensity" class="pain-slider" min="0" max="10" value="5">
                        <span id="onboarding-pain-intensity-val">5</span>
                        <div class="onboarding-restrictions">
                            <label>제한사항 (선택)</label>
                            ${RESTRICTIONS.map(r => `
                                <label class="onboarding-restriction-item">
                                    <input type="checkbox" value="${r}"> ${r}
                                </label>
                            `).join('')}
                        </div>
                        <button class="btn-secondary" id="btn-add-pain-region">이 부위 추가</button>
                    </div>
                    <div id="onboarding-added-regions"></div>
                </div>
                <button class="btn-primary onboarding-next" data-next="3">다음</button>
            </div>

            <!-- Step 3: 선호 설정 -->
            <div class="onboarding-step" data-step="3" style="display:none;">
                <h2>운동 선호 설정</h2>
                <div class="onboarding-pref">
                    <label>하루 운동 시간</label>
                    <div class="onboarding-pref-chips">
                        <button class="pref-chip" data-time="10">10분</button>
                        <button class="pref-chip active" data-time="15">15분</button>
                        <button class="pref-chip" data-time="20">20분</button>
                        <button class="pref-chip" data-time="25">25분</button>
                    </div>
                </div>
                <div class="onboarding-pref">
                    <label>사용 가능한 도구</label>
                    <div class="onboarding-equip-chips">
                        <label class="equip-chip-label"><input type="checkbox" value="none" checked> 맨몸</label>
                        <label class="equip-chip-label"><input type="checkbox" value="band"> 밴드</label>
                        <label class="equip-chip-label"><input type="checkbox" value="foam_roller"> 폼롤러</label>
                        <label class="equip-chip-label"><input type="checkbox" value="ball"> 짐볼</label>
                    </div>
                </div>
                <div class="onboarding-pref">
                    <label>주당 운동 횟수</label>
                    <div class="onboarding-pref-chips">
                        <button class="days-chip active" data-days="3">3일</button>
                        <button class="days-chip" data-days="4">4일</button>
                        <button class="days-chip" data-days="5">5일</button>
                    </div>
                </div>
                <button class="btn-primary onboarding-next" data-next="4">프로그램 생성</button>
            </div>

            <!-- Step 4: 생성 중 -->
            <div class="onboarding-step" data-step="4" style="display:none;">
                <h2>프로그램 생성 중...</h2>
                <p>맞춤 운동 프로그램을 만들고 있어요</p>
                <div class="onboarding-loading-spinner"></div>
                <div id="onboarding-program-summary" style="display:none;"></div>
            </div>

            <!-- Step 5: 완료 -->
            <div class="onboarding-step" data-step="5" style="display:none;">
                <h2>준비 완료!</h2>
                <p>맞춤 프로그램이 생성되었습니다. 오늘 운동을 시작해보세요!</p>
                <button class="btn-primary btn-lg onboarding-done">시작하기</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // State
    let step = 1;
    const selectedGoals = new Set();
    const painRegions = [];
    let selectedPainRegion = null;
    let timePerDay = 15;
    let daysPerWeek = 3;

    // Step navigation
    overlay.querySelectorAll('.onboarding-next').forEach(btn => {
        btn.addEventListener('click', async () => {
            const nextStep = parseInt(btn.dataset.next);

            // Step 4: 프로그램 생성
            if (nextStep === 4) {
                goToStep(4);
                await generateAndSave();
                return;
            }

            goToStep(nextStep);
        });
    });

    function goToStep(n) {
        step = n;
        overlay.querySelectorAll('.onboarding-step').forEach(s => {
            s.style.display = s.dataset.step == n ? '' : 'none';
        });
        const fill = document.getElementById('onboarding-progress-fill');
        if (fill) fill.style.width = (n * 20) + '%';
    }

    // Step 1: 목표 선택
    overlay.querySelectorAll('.onboarding-goal-item').forEach(item => {
        item.addEventListener('click', () => {
            const cb = item.querySelector('input');
            if (cb) {
                cb.checked = !cb.checked;
                if (cb.checked) selectedGoals.add(cb.value);
                else selectedGoals.delete(cb.value);
                item.classList.toggle('selected', cb.checked);
            }
        });
    });

    // Step 2: 통증 부위 선택
    const REGION_LABELS = { neck_l: '목', shoulder_l: '어깨', upper_back_l: '등', lower_back_l: '허리', hip_l: '골반', thigh_l: '허벅지', shin_l: '무릎/종아리', foot_l: '발' };

    overlay.querySelectorAll('.onboarding-region-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedPainRegion = btn.dataset.region;
            const detail = document.getElementById('onboarding-pain-detail');
            const label = document.getElementById('onboarding-pain-selected-label');
            if (detail) detail.style.display = '';
            if (label) label.textContent = REGION_LABELS[selectedPainRegion] || selectedPainRegion;

            overlay.querySelectorAll('.onboarding-region-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    const intensitySlider = overlay.querySelector('#onboarding-pain-intensity');
    const intensityVal = overlay.querySelector('#onboarding-pain-intensity-val');
    if (intensitySlider && intensityVal) {
        intensitySlider.addEventListener('input', () => { intensityVal.textContent = intensitySlider.value; });
    }

    overlay.querySelector('#btn-add-pain-region')?.addEventListener('click', () => {
        if (!selectedPainRegion) return;
        const intensity = parseInt(intensitySlider?.value || '5');
        const restrictions = [...overlay.querySelectorAll('.onboarding-restrictions input:checked')].map(c => c.value);

        painRegions.push({ regionKey: selectedPainRegion, intensity, restrictions });

        const addedEl = document.getElementById('onboarding-added-regions');
        if (addedEl) {
            const label = REGION_LABELS[selectedPainRegion] || selectedPainRegion;
            addedEl.innerHTML += `<div class="onboarding-added-tag">${label} (${intensity}/10)</div>`;
        }

        // 리셋
        selectedPainRegion = null;
        const detail = document.getElementById('onboarding-pain-detail');
        if (detail) detail.style.display = 'none';
        overlay.querySelectorAll('.onboarding-region-btn').forEach(b => b.classList.remove('active'));
    });

    // Step 3: 선호 설정
    overlay.querySelectorAll('.pref-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            overlay.querySelectorAll('.pref-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            timePerDay = parseInt(chip.dataset.time);
        });
    });

    overlay.querySelectorAll('.days-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            overlay.querySelectorAll('.days-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            daysPerWeek = parseInt(chip.dataset.days);
        });
    });

    // 프로그램 생성
    async function generateAndSave() {
        const goals = [...selectedGoals];
        if (goals.length === 0) goals.push('fitness');

        const equipment = [...overlay.querySelectorAll('.onboarding-equip-chips input:checked')].map(c => c.value);
        if (equipment.length === 0) equipment.push('none');

        const programData = generateProgram(goals, painRegions, { timePerDay, equipment, daysPerWeek });

        // 기존 프로그램 비활성화
        const { getAllPrograms, updateProgram } = await import('../services/Storage.js');
        const existing = await getAllPrograms();
        for (const p of existing) {
            if (p.isActive) {
                p.isActive = false;
                await updateProgram(p);
            }
        }

        await addProgram(programData);

        // 프로필 저장
        await setAppData('profile', {
            name: '',
            goals,
            painRegions,
            preferences: { timePerDay, equipment, daysPerWeek },
            onboardingDone: true,
            createdAt: new Date().toISOString(),
        });

        // 생성 완료 → step 5
        setTimeout(() => goToStep(5), 800);
    }

    // 완료
    overlay.querySelector('.onboarding-done')?.addEventListener('click', () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 500);
        window._navigate?.('today');
    });
}
