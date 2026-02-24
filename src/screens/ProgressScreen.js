// ProgressScreen.js - 진행/기록: 스트릭, 달성률, 통증 추이, 운동 로그

import { getStreak, getAllPainLogs, getAllWorkoutSessions, getDailyCheckins } from '../services/Storage.js';
import { regionKeyToLabel } from '../anatomy/Regions.js';

let initialized = false;
let painChart = null;
let exerciseChart = null;
let chartsRendered = false;

export async function initProgressScreen() {
    if (!initialized) {
        initialized = true;
        bindChartTab();
    }
    chartsRendered = false;
    await renderOverview();
    await renderPainDiary();
    await renderExerciseLog();

    // 경과차트 탭이 이미 보이는 상태면 바로 렌더
    const chartsTab = document.getElementById('prog-charts');
    if (chartsTab && chartsTab.style.display !== 'none') {
        await renderCharts();
    }
}

function bindChartTab() {
    // 경과차트 탭 클릭 시에만 차트 렌더링
    document.querySelectorAll('.screen-tab[data-tab="prog-charts"]').forEach(tab => {
        tab.addEventListener('click', () => {
            // 탭 전환 후 약간의 지연을 줘서 display가 적용된 후 렌더
            setTimeout(() => {
                if (!chartsRendered) renderCharts();
            }, 50);
        });
    });
}

// ═══ Overview ═══

async function renderOverview() {
    // 스트릭
    const streakEl = document.getElementById('progress-streak');
    if (streakEl) {
        const streak = await getStreak();
        streakEl.innerHTML = `
            <div class="overview-card">
                <span class="overview-label">연속 수행</span>
                <span class="overview-value">${streak.count}일</span>
            </div>
        `;
    }

    // 주간 달성률
    const weeklyEl = document.getElementById('progress-weekly');
    if (weeklyEl) {
        const checkins = await getDailyCheckins(14);
        const completed = checkins.filter(c => c.routineCompleted).length;
        const total = checkins.length || 1;
        const rate = Math.round((completed / total) * 100);
        weeklyEl.innerHTML = `
            <div class="overview-card">
                <span class="overview-label">최근 달성률</span>
                <span class="overview-value">${rate}%</span>
                <span class="overview-sub">${completed}/${total} 완료</span>
            </div>
        `;
    }

    // 통증 트렌드
    const trendEl = document.getElementById('progress-pain-trend');
    if (trendEl) {
        const checkins = await getDailyCheckins(7);
        const pains = checkins.filter(c => c.prePainScore != null).map(c => c.prePainScore);
        const avg = pains.length > 0 ? (pains.reduce((s, v) => s + v, 0) / pains.length).toFixed(1) : '-';
        trendEl.innerHTML = `
            <div class="overview-card">
                <span class="overview-label">평균 통증 (7일)</span>
                <span class="overview-value">${avg}</span>
            </div>
        `;
    }
}

// ═══ Pain Diary ═══

async function renderPainDiary() {
    const container = document.getElementById('pain-diary-list');
    if (!container) return;

    try {
        const logs = await getAllPainLogs();
        if (logs.length === 0) {
            container.innerHTML = '<p class="empty-state">기록이 없습니다. 통증 관리에서 기록해보세요.</p>';
            return;
        }

        const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
        const groups = new Map();
        for (const log of sorted) {
            const dateKey = new Date(log.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!groups.has(dateKey)) groups.set(dateKey, []);
            groups.get(dateKey).push(log);
        }

        let html = '';
        for (const [dateStr, entries] of groups) {
            html += `<div class="record-date-group"><div class="record-date-label">${dateStr}</div>`;
            for (const log of entries) {
                const levelColor = log.painLevel >= 7 ? '#F44336' : log.painLevel >= 4 ? '#FFC107' : '#4CAF50';
                html += `
                    <div class="record-entry">
                        <div class="record-entry-main">
                            <span class="record-entry-region">${regionKeyToLabel(log.regionKey)}</span>
                            <span class="record-entry-level" style="color:${levelColor}">${log.painLevel}/10</span>
                        </div>
                        ${log.note ? `<div class="record-entry-detail">${esc(log.note)}</div>` : ''}
                    </div>`;
            }
            html += '</div>';
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p class="empty-state">기록을 불러오는 데 실패했습니다.</p>';
    }
}

// ═══ Exercise Log ═══

async function renderExerciseLog() {
    const container = document.getElementById('exercise-log-list');
    if (!container) return;

    try {
        const sessions = await getAllWorkoutSessions();
        if (sessions.length === 0) {
            container.innerHTML = '<p class="empty-state">운동 기록이 없습니다.</p>';
            return;
        }

        const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
        let html = '';
        for (const session of sorted.slice(0, 30)) {
            const date = new Date(session.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
            const duration = session.duration ? `${Math.floor(session.duration / 60)}분` : '';
            const rpeLabel = session.rpe === 'easy' ? '쉬움' : session.rpe === 'hard' ? '어려움' : '적당';
            const exercises = (session.exercises || []).map(e => e.name).join(', ');

            html += `
                <div class="record-entry">
                    <div class="record-entry-main">
                        <span class="record-entry-date">${date}</span>
                        <span class="record-entry-duration">${duration}</span>
                        ${session.rpe ? `<span class="record-entry-rpe rpe-${session.rpe}">${rpeLabel}</span>` : ''}
                    </div>
                    <div class="record-entry-detail">${esc(exercises)}</div>
                </div>`;
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p class="empty-state">기록을 불러오는 데 실패했습니다.</p>';
    }
}

// ═══ Charts ═══

function calcDayRange(items) {
    const now = new Date();
    if (!items.length) return 3;
    const dates = items.map(item => item.date?.split('T')[0]).filter(Boolean).sort();
    if (!dates.length) return 3;
    const earliest = new Date(dates[0] + 'T00:00:00');
    const daySpan = Math.ceil((now - earliest) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(daySpan + 1, 3), 30);
}

let ChartJS = null;

async function renderCharts() {
    try {
        if (!ChartJS) {
            const mod = await import('chart.js');
            ChartJS = mod.Chart;
            ChartJS.register(...mod.registerables);
        }

        // 기존 차트 완전 파괴
        if (painChart) { painChart.destroy(); painChart = null; }
        if (exerciseChart) { exerciseChart.destroy(); exerciseChart = null; }

        await renderPainChart(ChartJS);
        await renderExerciseChart(ChartJS);
        chartsRendered = true;
    } catch (e) { /* Chart.js load fail */ }
}

async function renderPainChart(Chart) {
    const canvas = document.getElementById('progress-pain-chart');
    if (!canvas) return;

    const logs = await getAllPainLogs();
    if (logs.length === 0) return;

    const now = new Date();
    const totalDays = calcDayRange(logs);
    const labels = [];
    const data = [];

    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
        const dayLogs = logs.filter(l => l.date && l.date.startsWith(dateStr));
        const avg = dayLogs.length > 0 ? dayLogs.reduce((s, l) => s + l.painLevel, 0) / dayLogs.length : null;
        data.push(avg);
    }

    painChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{ label: '평균 통증', data, borderColor: '#F44336', backgroundColor: 'rgba(244,67,54,0.1)', fill: true, tension: 0.3, spanGaps: true, pointRadius: 3 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, title: { display: true, text: `통증 추이 (${totalDays}일)`, font: { size: 13 } } },
            scales: { y: { min: 0, max: 10, ticks: { stepSize: 2 } }, x: { ticks: { maxTicksLimit: 7 } } }
        }
    });
}

async function renderExerciseChart(Chart) {
    const canvas = document.getElementById('progress-exercise-chart');
    if (!canvas) return;

    const sessions = await getAllWorkoutSessions();
    const now = new Date();
    const totalDays = calcDayRange(sessions);
    const labels = [];
    const data = [];

    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
        const dayMinutes = sessions.filter(s => s.date && s.date.startsWith(dateStr)).reduce((sum, s) => sum + (s.duration || 0), 0);
        data.push(Math.round(dayMinutes / 60));
    }

    exerciseChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: '운동 (분)', data, backgroundColor: 'rgba(74, 124, 111, 0.6)', borderRadius: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, title: { display: true, text: `운동량 추이 (${totalDays}일)`, font: { size: 13 } } },
            scales: { y: { beginAtZero: true }, x: { ticks: { maxTicksLimit: 7 } } }
        }
    });
}

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
