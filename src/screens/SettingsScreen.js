// SettingsScreen.js - 설정: 병원 연결, 동기화, 로그인/로그아웃

import { isLoggedIn, getUser, validateInviteCode, registerWithInvite, login, logout } from '../services/ApiClient.js';
import { startAutoSync, stopAutoSync, syncNow, getLastSyncTime } from '../services/SyncService.js';

export async function initSettingsScreen() {
    renderSettings();
}

function renderSettings() {
    const container = document.getElementById('settings-content');
    if (!container) return;

    if (isLoggedIn()) {
        renderConnectedState(container);
    } else {
        renderLoginState(container);
    }
}

// ═══ Connected (logged in) ═══

async function renderConnectedState(container) {
    const user = getUser();
    const lastSync = await getLastSyncTime();
    const syncTimeStr = lastSync ? new Date(lastSync).toLocaleString('ko-KR') : '없음';

    container.innerHTML = `
        <div class="settings-section">
            <h3 class="settings-section-title">병원 연결</h3>
            <div class="settings-card">
                <div class="settings-row">
                    <span class="settings-label">상태</span>
                    <span class="settings-value connected">연결됨</span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">계정</span>
                    <span class="settings-value">${esc(user?.full_name || user?.username || '')}</span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">마지막 동기화</span>
                    <span class="settings-value" id="settings-last-sync">${syncTimeStr}</span>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <h3 class="settings-section-title">동기화</h3>
            <div class="settings-actions">
                <button class="btn btn-primary" id="btn-sync-now">지금 동기화</button>
                <button class="btn btn-outline" id="btn-logout">로그아웃</button>
            </div>
        </div>
    `;

    document.getElementById('btn-sync-now')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-sync-now');
        btn.disabled = true;
        btn.textContent = '동기화 중...';
        try {
            await syncNow();
            const now = new Date().toLocaleString('ko-KR');
            document.getElementById('settings-last-sync').textContent = now;
            btn.textContent = '완료!';
            setTimeout(() => { btn.textContent = '지금 동기화'; btn.disabled = false; }, 1500);
        } catch (e) {
            btn.textContent = '실패';
            setTimeout(() => { btn.textContent = '지금 동기화'; btn.disabled = false; }, 1500);
        }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        logout();
        stopAutoSync();
        renderSettings();
    });

    // Listen for sync events
    window.addEventListener('pvh:synced', () => {
        const el = document.getElementById('settings-last-sync');
        if (el) el.textContent = new Date().toLocaleString('ko-KR');
    });
}

// ═══ Login / Invite ═══

function renderLoginState(container) {
    container.innerHTML = `
        <div class="settings-section">
            <h3 class="settings-section-title">병원 연결</h3>
            <p class="settings-desc">병원에서 받은 초대 코드로 연결하거나, 기존 계정으로 로그인하세요.</p>

            <div class="settings-tabs">
                <button class="settings-tab active" data-stab="invite">초대 코드</button>
                <button class="settings-tab" data-stab="login">로그인</button>
            </div>

            <!-- Invite Code Tab -->
            <div class="settings-tab-content" id="stab-invite">
                <div class="settings-card">
                    <div class="form-group">
                        <label>초대 코드</label>
                        <input type="text" id="invite-code-input" class="form-input" placeholder="6자리 코드 입력" maxlength="6" style="text-transform:uppercase;letter-spacing:4px;text-align:center;font-size:1.3em">
                    </div>
                    <div id="invite-status" class="form-status"></div>
                    <button class="btn btn-primary btn-full" id="btn-validate-code">코드 확인</button>

                    <!-- Registration form (hidden initially) -->
                    <div id="invite-register-form" style="display:none;margin-top:16px">
                        <p class="invite-patient-name" id="invite-patient-name"></p>
                        <div class="form-group">
                            <label>사용자명</label>
                            <input type="text" id="reg-username" class="form-input" placeholder="아이디">
                        </div>
                        <div class="form-group">
                            <label>비밀번호</label>
                            <input type="password" id="reg-password" class="form-input" placeholder="8자 이상">
                        </div>
                        <div class="form-group">
                            <label>이름</label>
                            <input type="text" id="reg-fullname" class="form-input" placeholder="이름">
                        </div>
                        <div id="reg-status" class="form-status"></div>
                        <button class="btn btn-primary btn-full" id="btn-register">계정 생성 및 연결</button>
                    </div>
                </div>
            </div>

            <!-- Login Tab -->
            <div class="settings-tab-content" id="stab-login" style="display:none">
                <div class="settings-card">
                    <div class="form-group">
                        <label>아이디</label>
                        <input type="text" id="login-username" class="form-input" placeholder="아이디">
                    </div>
                    <div class="form-group">
                        <label>비밀번호</label>
                        <input type="password" id="login-password" class="form-input" placeholder="비밀번호">
                    </div>
                    <div id="login-status" class="form-status"></div>
                    <button class="btn btn-primary btn-full" id="btn-login">로그인</button>
                </div>
            </div>
        </div>
    `;

    // Tab switching
    container.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            container.querySelectorAll('.settings-tab-content').forEach(c => c.style.display = 'none');
            const target = document.getElementById(`stab-${tab.dataset.stab}`);
            if (target) target.style.display = '';
        });
    });

    // Validate code
    let validatedCode = null;
    document.getElementById('btn-validate-code')?.addEventListener('click', async () => {
        const code = document.getElementById('invite-code-input')?.value?.trim();
        const status = document.getElementById('invite-status');
        if (!code || code.length < 4) {
            status.textContent = '코드를 입력해주세요.';
            status.className = 'form-status error';
            return;
        }

        status.textContent = '확인 중...';
        status.className = 'form-status';

        try {
            const result = await validateInviteCode(code);
            if (result.valid) {
                validatedCode = code;
                status.textContent = '유효한 코드입니다!';
                status.className = 'form-status success';
                document.getElementById('invite-register-form').style.display = '';
                document.getElementById('invite-patient-name').textContent =
                    result.patient_name ? `환자: ${result.patient_name}` : '';
            } else {
                status.textContent = '유효하지 않거나 만료된 코드입니다.';
                status.className = 'form-status error';
            }
        } catch (e) {
            status.textContent = '서버 연결 실패. 나중에 다시 시도해주세요.';
            status.className = 'form-status error';
        }
    });

    // Register
    document.getElementById('btn-register')?.addEventListener('click', async () => {
        const username = document.getElementById('reg-username')?.value?.trim();
        const password = document.getElementById('reg-password')?.value;
        const fullName = document.getElementById('reg-fullname')?.value?.trim();
        const status = document.getElementById('reg-status');

        if (!username || !password || !fullName) {
            status.textContent = '모든 필드를 입력해주세요.';
            status.className = 'form-status error';
            return;
        }
        if (password.length < 8) {
            status.textContent = '비밀번호는 8자 이상이어야 합니다.';
            status.className = 'form-status error';
            return;
        }

        status.textContent = '계정 생성 중...';
        status.className = 'form-status';

        try {
            await registerWithInvite(validatedCode, username, password, fullName);
            startAutoSync();
            renderSettings();
        } catch (e) {
            status.textContent = e.message || '계정 생성 실패';
            status.className = 'form-status error';
        }
    });

    // Login
    document.getElementById('btn-login')?.addEventListener('click', async () => {
        const username = document.getElementById('login-username')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        const status = document.getElementById('login-status');

        if (!username || !password) {
            status.textContent = '아이디와 비밀번호를 입력해주세요.';
            status.className = 'form-status error';
            return;
        }

        status.textContent = '로그인 중...';
        status.className = 'form-status';

        try {
            await login(username, password);
            startAutoSync();
            renderSettings();
        } catch (e) {
            status.textContent = e.message || '로그인 실패';
            status.className = 'form-status error';
        }
    });
}

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
