// SearchScreen.js - 환자용 질환 검색 화면
// BodyData.js의 searchAnatomy / getAnatomyInfo 재사용

import { searchAnatomy, getAnatomyInfo } from '../anatomy/BodyData.js';
import { navigate } from '../app/Router.js';

let debounceTimer = null;

const DIFFICULTY_CLASS = { '쉬움': 'easy', '보통': 'medium', '어려움': 'hard' };

export function initSearchScreen() {
    const input = document.getElementById('search-anatomy-input');
    const results = document.getElementById('search-results');

    if (!input || !results) return;

    // 디바운스 검색
    if (!input._bound) {
        input._bound = true;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => performSearch(input.value), 150);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.value = '';
                performSearch('');
                input.blur();
            }
        });
    }

    // 인기 태그 클릭
    document.querySelectorAll('#search-popular-tags .search-tag').forEach(tag => {
        if (tag._bound) return;
        tag._bound = true;
        tag.addEventListener('click', () => {
            input.value = tag.dataset.query;
            performSearch(tag.dataset.query);
        });
    });

    // 초기 상태
    if (!input.value) {
        results.innerHTML = `
            <div class="search-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>검색어를 입력하거나 인기 태그를 눌러보세요.</p>
            </div>`;
    }

    input.focus();
}

function performSearch(query) {
    const results = document.getElementById('search-results');
    if (!results) return;

    if (!query || query.trim().length === 0) {
        results.innerHTML = `
            <div class="search-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>검색어를 입력하거나 인기 태그를 눌러보세요.</p>
            </div>`;
        return;
    }

    const matches = searchAnatomy(query);

    if (matches.length === 0) {
        results.innerHTML = `
            <div class="search-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <p>"${escapeHtml(query)}"에 대한 결과가 없습니다.</p>
            </div>`;
        return;
    }

    const cards = matches.map(r => {
        const info = getAnatomyInfo(r.regionKey);
        if (!info) return '';
        return renderCard(r.regionKey, info, r.matchField);
    }).join('');

    results.innerHTML = `<div class="search-result-grid">${cards}</div>`;

    // 운동 항목 클릭 → 영상 모달
    results.querySelectorAll('.search-exercise-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = item.dataset.exercise;
            const videoId = item.dataset.videoId;
            const difficulty = item.dataset.difficulty;
            if (window.openExerciseVideo) {
                window.openExerciseVideo(name, videoId, difficulty);
            }
        });
    });

    // 운동 라이브러리에서 보기
    results.querySelectorAll('.search-library-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigate('library');
        });
    });
}

function renderCard(regionKey, info, matchField) {
    const musclesHtml = info.keyMuscles.slice(0, 4).map(m =>
        `<span class="search-muscle-tag">${escapeHtml(m)}</span>`
    ).join('');

    const pathologiesHtml = info.commonPathologies.map(p =>
        `<span class="search-pathology-tag">${escapeHtml(p)}</span>`
    ).join('');

    const exercisesHtml = info.exercises.slice(0, 3).map(e =>
        `<div class="search-exercise-item" data-exercise="${escapeHtml(e.name)}" data-video-id="${e.videoId || ''}" data-difficulty="${escapeHtml(e.difficulty)}">
            <span class="search-exercise-name">${escapeHtml(e.name)}</span>
            <span class="search-exercise-meta">
                <span class="search-exercise-diff diff-${DIFFICULTY_CLASS[e.difficulty] || 'medium'}">${escapeHtml(e.difficulty)}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </span>
        </div>`
    ).join('');

    return `
        <div class="search-result-card" data-region-key="${regionKey}">
            <div class="search-card-header">
                <h4>${escapeHtml(info.name)}</h4>
                <span class="search-card-match">${escapeHtml(matchField)}</span>
            </div>
            <p class="search-card-desc">${escapeHtml(info.description)}</p>
            <div class="search-card-section">
                <div class="search-card-label">관련 증상</div>
                <div class="search-pathology-tags">${pathologiesHtml}</div>
            </div>
            <div class="search-card-section">
                <div class="search-card-label">주요 근육</div>
                <div class="search-muscle-tags">${musclesHtml}</div>
            </div>
            <div class="search-card-section">
                <div class="search-card-label">추천 운동</div>
                <div class="search-exercises">${exercisesHtml}</div>
            </div>
            <div class="search-card-footer">
                <button class="search-library-link">운동 라이브러리에서 보기 &rarr;</button>
            </div>
        </div>`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
