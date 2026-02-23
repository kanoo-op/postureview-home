// ProgramScreen.js - 내 프로그램: 목표/상태/주간계획 관리

import { getActiveProgram, updateProgram, addProgram } from '../services/Storage.js';
import { generateProgram } from '../services/ProgramEngine.js';
import { GOAL_REGION_MAP } from '../anatomy/BodyData.js';

let initialized = false;

const GOAL_LABELS = {
    lower_back: '허리',
    shoulder: '어깨',
    knee: '무릎',
    neck: '목',
    posture: '자세',
    fitness: '체력',
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export async function initProgramScreen() {
    if (!initialized) {
        initialized = true;
        bindProgramUI();
    }
    await renderProgram();
}

function bindProgramUI() {
    document.getElementById('btn-create-program')?.addEventListener('click', () => {
        // 온보딩 트리거
        import('../app/Onboarding.js').then(m => m.showOnboardingForProgram?.());
    });

    document.getElementById('btn-regenerate-program')?.addEventListener('click', async () => {
        const program = await getActiveProgram();
        if (!program) return;

        const newProgramData = generateProgram(
            program.goals || [],
            program.painRegions || [],
            program.preferences || {}
        );
        Object.assign(program, newProgramData);
        await updateProgram(program);
        await renderProgram();
        window.showToast?.('프로그램이 재생성되었습니다.', 'success');
    });
}

async function renderProgram() {
    const program = await getActiveProgram();
    const empty = document.getElementById('program-empty');
    const content = document.getElementById('program-content');

    if (!program) {
        if (empty) empty.style.display = '';
        if (content) content.style.display = 'none';
        return;
    }

    if (empty) empty.style.display = 'none';
    if (content) content.style.display = '';

    // 목표
    const goalsEl = document.getElementById('program-goals');
    if (goalsEl) {
        const goals = (program.goals || []).map(g => GOAL_LABELS[g] || g);
        goalsEl.innerHTML = `
            <div class="program-goals-header">
                <h4>내 목표</h4>
            </div>
            <div class="goal-chips">
                ${goals.map(g => `<span class="goal-chip">${esc(g)}</span>`).join('')}
            </div>
        `;
    }

    // 상태
    const statusEl = document.getElementById('program-status');
    if (statusEl) {
        const pref = program.preferences || {};
        statusEl.innerHTML = `
            <div class="program-status-info">
                <span>일 ${pref.timePerDay || 15}분</span>
                <span>주 ${pref.daysPerWeek || 3}일</span>
                <span>난이도 ×${(program.difficultyMultiplier || 1.0).toFixed(1)}</span>
            </div>
        `;
    }

    // 주간 계획
    const gridEl = document.getElementById('weekly-plan-grid');
    if (gridEl && program.weeklyPlan) {
        gridEl.innerHTML = program.weeklyPlan.map(day => `
            <div class="weekly-day-card">
                <div class="weekly-day-header">
                    <span class="weekly-day-label">${DAY_LABELS[day.dayIndex] || '?'}요일</span>
                    <span class="weekly-day-focus">${esc(day.label || day.focus)}</span>
                    <span class="weekly-day-time">${day.estimatedMinutes || '?'}분</span>
                </div>
                <div class="weekly-day-exercises">
                    ${(day.exercises || []).map(ex => `
                        <div class="weekly-ex-item">
                            <span>${esc(ex.name)}</span>
                            <span class="weekly-ex-detail">${ex.sets}×${ex.reps}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
}

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
