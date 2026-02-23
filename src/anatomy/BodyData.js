// BodyData.js - 부위별 운동/정보 데이터베이스 (소비자 앱용)
// 24개 PREDEFINED_REGIONS에 대한 운동 추천 + 기본 정보
// videoId: YouTube 영상 ID

// ═══ 운동 태그 분류 체계 ═══

export const EXERCISE_TAG_DEFS = {
    purpose: {
        label: '목적',
        options: [
            { id: 'mobility',  label: '가동성',   color: '#4FC3F7' },
            { id: 'stability', label: '안정화',   color: '#81C784' },
            { id: 'strength',  label: '근력',     color: '#FF8A65' },
            { id: 'neural',    label: '신경가동', color: '#CE93D8' },
            { id: 'breathing', label: '호흡/코어', color: '#FFD54F' },
        ]
    },
    phase: {
        label: '단계',
        options: [
            { id: 'acute',    label: '급성기',   color: '#ef5350' },
            { id: 'subacute', label: '아급성기', color: '#FFA726' },
            { id: 'chronic',  label: '만성기',   color: '#66BB6A' },
        ]
    },
    equipment: {
        label: '도구',
        options: [
            { id: 'none',        label: '맨몸',     color: '#90A4AE' },
            { id: 'band',        label: '밴드',     color: '#7E57C2' },
            { id: 'foam_roller', label: '폼롤러',   color: '#26A69A' },
            { id: 'ball',        label: '짐볼',     color: '#42A5F5' },
            { id: 'balance',     label: '균형보드', color: '#8D6E63' },
            { id: 'golf_ball',   label: '골프공',   color: '#BDBDBD' },
            { id: 'towel',       label: '타월',     color: '#A1887F' },
        ]
    },
    pattern: {
        label: '패턴',
        options: [
            { id: 'stretch',   label: '스트레칭',   color: '#4DD0E1' },
            { id: 'hinge',     label: '힌지',       color: '#FF7043' },
            { id: 'squat',     label: '스쿼트',     color: '#5C6BC0' },
            { id: 'lunge',     label: '런지',       color: '#EC407A' },
            { id: 'reach',     label: '리치',       color: '#AB47BC' },
            { id: 'rotation',  label: '로테이션',   color: '#FFA000' },
            { id: 'isometric', label: '등척성',     color: '#78909C' },
            { id: 'eccentric', label: '편심성',     color: '#8D6E63' },
            { id: 'massage',   label: '자가마사지', color: '#AED581' },
            { id: 'plank',     label: '플랭크',     color: '#7986CB' },
        ]
    }
};

const ANATOMY_DB = {
    head_l: {
        name: '머리 (좌)',
        description: '두개골 좌측 영역. 측두근, 교근 등 저작근과 두개골 구조를 포함합니다.',
        keyMuscles: ['측두근', '교근', '전두근', '후두근'],
        keyStructures: ['측두골', '두정골', '측두하악관절(TMJ)'],
        commonPathologies: ['긴장성 두통', 'TMJ 장애', '측두근 긴장'],
        exercises: [
            { name: 'TMJ 스트레칭', difficulty: '쉬움', videoId: 'pnlnBFsCLCE', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: 'TMJ 탈구 이력 시 주의. 과도한 개구 금지' },
            { name: '측두근 자가마사지', difficulty: '쉬움', videoId: 'm8QyW9RLEcQ', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['massage'], precautions: '두통 악화 시 중단' },
            { name: '턱 이완 운동', difficulty: '쉬움', videoId: 'pnlnBFsCLCE', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '' }
        ],
        cameraPreset: { position: 'right', yOffset: 0.4 }
    },
    head_r: {
        name: '머리 (우)',
        description: '두개골 우측 영역. 측두근, 교근 등 저작근과 두개골 구조를 포함합니다.',
        keyMuscles: ['측두근', '교근', '전두근', '후두근'],
        keyStructures: ['측두골', '두정골', '측두하악관절(TMJ)'],
        commonPathologies: ['긴장성 두통', 'TMJ 장애', '측두근 긴장'],
        exercises: [
            { name: 'TMJ 스트레칭', difficulty: '쉬움', videoId: 'pnlnBFsCLCE', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: 'TMJ 탈구 이력 시 주의. 과도한 개구 금지' },
            { name: '측두근 자가마사지', difficulty: '쉬움', videoId: 'm8QyW9RLEcQ', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['massage'], precautions: '두통 악화 시 중단' },
            { name: '턱 이완 운동', difficulty: '쉬움', videoId: 'pnlnBFsCLCE', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '' }
        ],
        cameraPreset: { position: 'left', yOffset: 0.4 }
    },
    neck_l: {
        name: '목 (좌)',
        description: '경추 좌측. 흉쇄유돌근, 사각근 등 목 근육과 경추를 포함합니다.',
        keyMuscles: ['흉쇄유돌근(SCM)', '사각근', '두판상근', '견갑거근'],
        keyStructures: ['경추(C1-C7)', '추간판', '경동맥'],
        commonPathologies: ['경추 디스크', '사경', '근막통증 증후군', '경추 퇴행성 변화'],
        exercises: [
            { name: '경추 측굴 스트레칭', difficulty: '쉬움', videoId: 'stVphpo6uC4', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '경추 디스크 환자 통증 유발 방향 금지. 어지러움 시 중단' },
            { name: 'SCM 스트레칭', difficulty: '쉬움', videoId: 'Z9nantEZ1bo', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '경동맥 압박 주의. 어지러움 시 즉시 중단' },
            { name: '딥넥 플렉서 강화', difficulty: '보통', videoId: 'eKUH0Rcwhd8', purpose: ['stability'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '경추 수술 후 6주 이내 금지' },
            { name: '경추 등척성 운동', difficulty: '보통', videoId: 'eKUH0Rcwhd8', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '급성 디스크 시 금지. 통증 범위 내에서 수행' }
        ],
        cameraPreset: { position: 'right', yOffset: 0.35 }
    },
    neck_r: {
        name: '목 (우)',
        description: '경추 우측. 흉쇄유돌근, 사각근 등 목 근육과 경추를 포함합니다.',
        keyMuscles: ['흉쇄유돌근(SCM)', '사각근', '두판상근', '견갑거근'],
        keyStructures: ['경추(C1-C7)', '추간판', '경동맥'],
        commonPathologies: ['경추 디스크', '사경', '근막통증 증후군', '경추 퇴행성 변화'],
        exercises: [
            { name: '경추 측굴 스트레칭', difficulty: '쉬움', videoId: 'stVphpo6uC4', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '경추 디스크 환자 통증 유발 방향 금지. 어지러움 시 중단' },
            { name: 'SCM 스트레칭', difficulty: '쉬움', videoId: 'Z9nantEZ1bo', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '경동맥 압박 주의. 어지러움 시 즉시 중단' },
            { name: '딥넥 플렉서 강화', difficulty: '보통', videoId: 'eKUH0Rcwhd8', purpose: ['stability'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '경추 수술 후 6주 이내 금지' },
            { name: '경추 등척성 운동', difficulty: '보통', videoId: 'eKUH0Rcwhd8', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '급성 디스크 시 금지. 통증 범위 내에서 수행' }
        ],
        cameraPreset: { position: 'left', yOffset: 0.35 }
    },
    shoulder_l: {
        name: '왼쪽 어깨',
        description: '좌측 어깨 관절 복합체. 삼각근, 회전근개, 견갑골 주변 근육을 포함합니다.',
        keyMuscles: ['삼각근', '극상근', '극하근', '소원근', '견갑하근', '승모근'],
        keyStructures: ['견갑골', '쇄골', '견봉', '견관절(GH joint)', '견봉하 공간'],
        commonPathologies: ['회전근개 손상', '충돌 증후군', '오십견(동결견)', '견갑골 이상운동증'],
        exercises: [
            { name: '코드만 진자운동', difficulty: '쉬움', videoId: 'OaIdPbaglt0', purpose: ['mobility'], phase: ['acute', 'subacute'], equipment: ['none'], pattern: ['stretch'], precautions: '급성 탈구/골절 시 금지' },
            { name: '외회전 밴드운동', difficulty: '보통', videoId: 'FSUSzHjcc4I', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['band'], pattern: ['rotation'], precautions: '회전근개 파열 급성기 금지. 통증 없는 범위에서 수행' },
            { name: '견갑골 세팅', difficulty: '보통', videoId: 'XXgaV3vsmGQ', purpose: ['stability'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '' },
            { name: 'Y-T-W 운동', difficulty: '보통', videoId: 'BMKZ1cN7MkY', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['reach'], precautions: '충돌 증후군 시 통증 범위 주의' }
        ],
        cameraPreset: { position: 'right', yOffset: 0.2 }
    },
    shoulder_r: {
        name: '오른쪽 어깨',
        description: '우측 어깨 관절 복합체. 삼각근, 회전근개, 견갑골 주변 근육을 포함합니다.',
        keyMuscles: ['삼각근', '극상근', '극하근', '소원근', '견갑하근', '승모근'],
        keyStructures: ['견갑골', '쇄골', '견봉', '견관절(GH joint)', '견봉하 공간'],
        commonPathologies: ['회전근개 손상', '충돌 증후군', '오십견(동결견)', '견갑골 이상운동증'],
        exercises: [
            { name: '코드만 진자운동', difficulty: '쉬움', videoId: 'OaIdPbaglt0', purpose: ['mobility'], phase: ['acute', 'subacute'], equipment: ['none'], pattern: ['stretch'], precautions: '급성 탈구/골절 시 금지' },
            { name: '외회전 밴드운동', difficulty: '보통', videoId: 'FSUSzHjcc4I', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['band'], pattern: ['rotation'], precautions: '회전근개 파열 급성기 금지. 통증 없는 범위에서 수행' },
            { name: '견갑골 세팅', difficulty: '보통', videoId: 'XXgaV3vsmGQ', purpose: ['stability'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '' },
            { name: 'Y-T-W 운동', difficulty: '보통', videoId: 'BMKZ1cN7MkY', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['reach'], precautions: '충돌 증후군 시 통증 범위 주의' }
        ],
        cameraPreset: { position: 'left', yOffset: 0.2 }
    },
    chest_l: {
        name: '가슴 (좌)',
        description: '좌측 흉부. 대흉근, 소흉근과 흉곽 구조를 포함합니다.',
        keyMuscles: ['대흉근', '소흉근', '전거근', '외늑간근'],
        keyStructures: ['흉골', '늑골(1-12)', '흉곽'],
        commonPathologies: ['흉곽출구증후군', '소흉근 단축', '늑간신경통'],
        exercises: [
            { name: '도어 스트레칭', difficulty: '쉬움', videoId: '42DrZRxsZas', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '전방 불안정 시 과도한 신전 주의' },
            { name: '대흉근 스트레칭', difficulty: '쉬움', videoId: 'piTKJeo6RSs', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '' },
            { name: '전거근 펀치', difficulty: '보통', videoId: 'AmQ7HxgP_aU', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['reach'], precautions: '견갑골 익상 시 가벼운 저항으로 시작' }
        ],
        cameraPreset: { position: 'front', yOffset: 0.15 }
    },
    chest_r: {
        name: '가슴 (우)',
        description: '우측 흉부. 대흉근, 소흉근과 흉곽 구조를 포함합니다.',
        keyMuscles: ['대흉근', '소흉근', '전거근', '외늑간근'],
        keyStructures: ['흉골', '늑골(1-12)', '흉곽'],
        commonPathologies: ['흉곽출구증후군', '소흉근 단축', '늑간신경통'],
        exercises: [
            { name: '도어 스트레칭', difficulty: '쉬움', videoId: '42DrZRxsZas', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '전방 불안정 시 과도한 신전 주의' },
            { name: '대흉근 스트레칭', difficulty: '쉬움', videoId: 'piTKJeo6RSs', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '' },
            { name: '전거근 펀치', difficulty: '보통', videoId: 'AmQ7HxgP_aU', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['reach'], precautions: '견갑골 익상 시 가벼운 저항으로 시작' }
        ],
        cameraPreset: { position: 'front', yOffset: 0.15 }
    },
    upper_back_l: {
        name: '상부 등 (좌)',
        description: '좌측 흉추부. 능형근, 승모근 중부, 척추기립근 상부를 포함합니다.',
        keyMuscles: ['승모근 중부', '능형근', '척추기립근', '다열근'],
        keyStructures: ['흉추(T1-T6)', '추간판', '늑골두 관절'],
        commonPathologies: ['흉추 과후만', '능형근 약화', '상교차 증후군'],
        exercises: [
            { name: '로우(Rows)', difficulty: '보통', videoId: 'B_smaviLr1g', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['band'], pattern: ['hinge'], precautions: '흉추 골절/골다공증 시 주의' },
            { name: '흉추 익스텐션', difficulty: '보통', videoId: 'j-yZc63FfKk', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '골다공증 환자 과신전 금지' },
            { name: '폼롤러 흉추 가동술', difficulty: '쉬움', videoId: 'kDPF8UeRgRo', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['foam_roller'], pattern: ['stretch'], precautions: '골다공증/늑골 골절 시 금지' },
            { name: '능형근 스퀴즈', difficulty: '쉬움', videoId: '3zc1mGfA5kc', purpose: ['stability'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '' }
        ],
        cameraPreset: { position: 'back', yOffset: 0.15 }
    },
    upper_back_r: {
        name: '상부 등 (우)',
        description: '우측 흉추부. 능형근, 승모근 중부, 척추기립근 상부를 포함합니다.',
        keyMuscles: ['승모근 중부', '능형근', '척추기립근', '다열근'],
        keyStructures: ['흉추(T1-T6)', '추간판', '늑골두 관절'],
        commonPathologies: ['흉추 과후만', '능형근 약화', '상교차 증후군'],
        exercises: [
            { name: '로우(Rows)', difficulty: '보통', videoId: 'B_smaviLr1g', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['band'], pattern: ['hinge'], precautions: '흉추 골절/골다공증 시 주의' },
            { name: '흉추 익스텐션', difficulty: '보통', videoId: 'j-yZc63FfKk', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '골다공증 환자 과신전 금지' },
            { name: '폼롤러 흉추 가동술', difficulty: '쉬움', videoId: 'kDPF8UeRgRo', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['foam_roller'], pattern: ['stretch'], precautions: '골다공증/늑골 골절 시 금지' },
            { name: '능형근 스퀴즈', difficulty: '쉬움', videoId: '3zc1mGfA5kc', purpose: ['stability'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '' }
        ],
        cameraPreset: { position: 'back', yOffset: 0.15 }
    },
    lower_back_l: {
        name: '허리 (좌)',
        description: '좌측 요추부. 요방형근, 다열근, 척추기립근 하부를 포함합니다.',
        keyMuscles: ['요방형근(QL)', '다열근', '척추기립근', '요근(Psoas)'],
        keyStructures: ['요추(L1-L5)', '추간판', '후관절', '황색인대'],
        commonPathologies: ['요추 디스크 탈출', '요추 협착증', '요방형근 경련', '척추 전방전위증'],
        exercises: [
            { name: '캣카우 스트레칭', difficulty: '쉬움', videoId: 'VCx-4bFLBRM', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '급성 디스크 시 통증 방향 주의' },
            { name: '버드독', difficulty: '보통', videoId: 'RN22oMwDnVY', purpose: ['stability'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['reach'], precautions: '급성 요통 시 금지. 골반 수평 유지' },
            { name: '데드버그', difficulty: '보통', videoId: 'NKO0OKO4wq0', purpose: ['stability', 'breathing'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['reach'], precautions: '복직근 이개 시 주의' },
            { name: '맥길 빅3', difficulty: '보통', videoId: 'VzCi28QMqVM', purpose: ['stability', 'breathing'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['plank'], precautions: '급성 디스크 탈출 시 사이드 플랭크 주의' }
        ],
        cameraPreset: { position: 'back', yOffset: 0.0 }
    },
    lower_back_r: {
        name: '허리 (우)',
        description: '우측 요추부. 요방형근, 다열근, 척추기립근 하부를 포함합니다.',
        keyMuscles: ['요방형근(QL)', '다열근', '척추기립근', '요근(Psoas)'],
        keyStructures: ['요추(L1-L5)', '추간판', '후관절', '황색인대'],
        commonPathologies: ['요추 디스크 탈출', '요추 협착증', '요방형근 경련', '척추 전방전위증'],
        exercises: [
            { name: '캣카우 스트레칭', difficulty: '쉬움', videoId: 'VCx-4bFLBRM', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '급성 디스크 시 통증 방향 주의' },
            { name: '버드독', difficulty: '보통', videoId: 'RN22oMwDnVY', purpose: ['stability'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['reach'], precautions: '급성 요통 시 금지. 골반 수평 유지' },
            { name: '데드버그', difficulty: '보통', videoId: 'NKO0OKO4wq0', purpose: ['stability', 'breathing'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['reach'], precautions: '복직근 이개 시 주의' },
            { name: '맥길 빅3', difficulty: '보통', videoId: 'VzCi28QMqVM', purpose: ['stability', 'breathing'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['plank'], precautions: '급성 디스크 탈출 시 사이드 플랭크 주의' }
        ],
        cameraPreset: { position: 'back', yOffset: 0.0 }
    },
    abdomen_l: {
        name: '복부 (좌)',
        description: '좌측 복부. 복직근, 외복사근, 내복사근, 복횡근을 포함합니다.',
        keyMuscles: ['복직근', '외복사근', '내복사근', '복횡근'],
        keyStructures: ['백선', '서혜인대', '복벽근막'],
        commonPathologies: ['복직근 이개', '복벽 탈장', '코어 불안정'],
        exercises: [
            { name: '복횡근 활성화(드로인)', difficulty: '쉬움', videoId: 'VzCi28QMqVM', purpose: ['breathing', 'stability'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '' },
            { name: '플랭크', difficulty: '보통', videoId: '86F74fyD3uc', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['plank'], precautions: '급성 요통/복직근 이개 시 금지' },
            { name: '사이드 플랭크', difficulty: '보통', videoId: '86F74fyD3uc', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['plank'], precautions: '어깨 통증 시 팔꿈치 지지로 전환' },
            { name: '팔로프 프레스', difficulty: '어려움', videoId: '_DVhhmg7n98', purpose: ['stability', 'strength'], phase: ['chronic'], equipment: ['band'], pattern: ['rotation'], precautions: '급성기 금지. 허리 회전 최소화' }
        ],
        cameraPreset: { position: 'front', yOffset: -0.05 }
    },
    abdomen_r: {
        name: '복부 (우)',
        description: '우측 복부. 복직근, 외복사근, 내복사근, 복횡근을 포함합니다.',
        keyMuscles: ['복직근', '외복사근', '내복사근', '복횡근'],
        keyStructures: ['백선', '서혜인대', '복벽근막'],
        commonPathologies: ['복직근 이개', '복벽 탈장', '코어 불안정'],
        exercises: [
            { name: '복횡근 활성화(드로인)', difficulty: '쉬움', videoId: 'VzCi28QMqVM', purpose: ['breathing', 'stability'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '' },
            { name: '플랭크', difficulty: '보통', videoId: '86F74fyD3uc', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['plank'], precautions: '급성 요통/복직근 이개 시 금지' },
            { name: '사이드 플랭크', difficulty: '보통', videoId: '86F74fyD3uc', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['plank'], precautions: '어깨 통증 시 팔꿈치 지지로 전환' },
            { name: '팔로프 프레스', difficulty: '어려움', videoId: '_DVhhmg7n98', purpose: ['stability', 'strength'], phase: ['chronic'], equipment: ['band'], pattern: ['rotation'], precautions: '급성기 금지. 허리 회전 최소화' }
        ],
        cameraPreset: { position: 'front', yOffset: -0.05 }
    },
    arm_l: {
        name: '왼팔',
        description: '좌측 상지. 이두근, 삼두근, 전완 근육과 팔꿈치 관절을 포함합니다.',
        keyMuscles: ['이두근', '삼두근', '상완근', '원회내근', '요골수근굴근'],
        keyStructures: ['상완골', '요골', '척골', '주관절', '수근관절'],
        commonPathologies: ['테니스 엘보', '골프 엘보', '이두근 건염', '수근관 증후군'],
        exercises: [
            { name: '손목 신전근 스트레칭', difficulty: '쉬움', videoId: 'QfytI3MQR7U', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '골절 회복기 시 의사 승인 필요' },
            { name: '편심성 손목 운동', difficulty: '보통', videoId: '9VTCCQm6-1g', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['eccentric'], precautions: '급성 건염 시 통증 유발 강도 금지' },
            { name: '그립 강화운동', difficulty: '쉬움', videoId: '2hsd6XwYoy4', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '수근관 증후군 시 과도한 쥐기 금지' }
        ],
        cameraPreset: { position: 'right', yOffset: 0.05 }
    },
    arm_r: {
        name: '오른팔',
        description: '우측 상지. 이두근, 삼두근, 전완 근육과 팔꿈치 관절을 포함합니다.',
        keyMuscles: ['이두근', '삼두근', '상완근', '원회내근', '요골수근굴근'],
        keyStructures: ['상완골', '요골', '척골', '주관절', '수근관절'],
        commonPathologies: ['테니스 엘보', '골프 엘보', '이두근 건염', '수근관 증후군'],
        exercises: [
            { name: '손목 신전근 스트레칭', difficulty: '쉬움', videoId: 'QfytI3MQR7U', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '골절 회복기 시 의사 승인 필요' },
            { name: '편심성 손목 운동', difficulty: '보통', videoId: '9VTCCQm6-1g', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['eccentric'], precautions: '급성 건염 시 통증 유발 강도 금지' },
            { name: '그립 강화운동', difficulty: '쉬움', videoId: '2hsd6XwYoy4', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '수근관 증후군 시 과도한 쥐기 금지' }
        ],
        cameraPreset: { position: 'left', yOffset: 0.05 }
    },
    hip_l: {
        name: '골반 (좌)',
        description: '좌측 고관절 영역. 둔근, 장요근, 이상근과 고관절 구조를 포함합니다.',
        keyMuscles: ['대둔근', '중둔근', '소둔근', '장요근', '이상근'],
        keyStructures: ['장골', '비구', '대퇴골두', '고관절순', '천장관절(SI joint)'],
        commonPathologies: ['고관절 충돌 증후군', '이상근 증후군', '천장관절 기능장애', '대퇴비구충돌'],
        exercises: [
            { name: '클램셸', difficulty: '쉬움', videoId: '_DVhhmg7n98', purpose: ['stability', 'strength'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['rotation'], precautions: '' },
            { name: '힙 플렉서 스트레칭', difficulty: '쉬움', videoId: 'GJEbZqWL5tU', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['lunge'], precautions: '고관절 전방 불안정 시 과신전 주의' },
            { name: '이상근 스트레칭', difficulty: '쉬움', videoId: 'HNfHJfeosOc', purpose: ['mobility', 'neural'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '고관절 치환술 후 금지(후방 접근 시)' },
            { name: '힙 힌지', difficulty: '보통', videoId: 'iQ7MnBxZpN8', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['hinge'], precautions: '급성 요통 시 중립 척추 유지 필수' }
        ],
        cameraPreset: { position: 'right', yOffset: -0.1 }
    },
    hip_r: {
        name: '골반 (우)',
        description: '우측 고관절 영역. 둔근, 장요근, 이상근과 고관절 구조를 포함합니다.',
        keyMuscles: ['대둔근', '중둔근', '소둔근', '장요근', '이상근'],
        keyStructures: ['장골', '비구', '대퇴골두', '고관절순', '천장관절(SI joint)'],
        commonPathologies: ['고관절 충돌 증후군', '이상근 증후군', '천장관절 기능장애', '대퇴비구충돌'],
        exercises: [
            { name: '클램셸', difficulty: '쉬움', videoId: '_DVhhmg7n98', purpose: ['stability', 'strength'], phase: ['acute', 'subacute', 'chronic'], equipment: ['none'], pattern: ['rotation'], precautions: '' },
            { name: '힙 플렉서 스트레칭', difficulty: '쉬움', videoId: 'GJEbZqWL5tU', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['lunge'], precautions: '고관절 전방 불안정 시 과신전 주의' },
            { name: '이상근 스트레칭', difficulty: '쉬움', videoId: 'HNfHJfeosOc', purpose: ['mobility', 'neural'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '고관절 치환술 후 금지(후방 접근 시)' },
            { name: '힙 힌지', difficulty: '보통', videoId: 'iQ7MnBxZpN8', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['hinge'], precautions: '급성 요통 시 중립 척추 유지 필수' }
        ],
        cameraPreset: { position: 'left', yOffset: -0.1 }
    },
    thigh_l: {
        name: '왼대퇴',
        description: '좌측 대퇴부. 대퇴사두근, 햄스트링, 내전근과 대퇴골을 포함합니다.',
        keyMuscles: ['대퇴사두근', '대퇴이두근', '반건양근', '반막양근', '내전근군'],
        keyStructures: ['대퇴골', '슬관절', '장경인대(ITB)'],
        commonPathologies: ['햄스트링 염좌', 'ITB 증후군', '대퇴사두 건염', '대퇴 스트레인'],
        exercises: [
            { name: '햄스트링 스트레칭', difficulty: '쉬움', videoId: '5ZR8VVNZIvg', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '좌골신경통 시 통증 각도 이전에 중단' },
            { name: '대퇴사두 스트레칭', difficulty: '쉬움', videoId: 'E7zqjVm-MMA', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '슬관절 수술 후 과굴곡 주의' },
            { name: '스쿼트', difficulty: '보통', videoId: 'nTcRTG-Py0c', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['squat'], precautions: '슬관절 통증 시 ROM 제한. 무릎 정렬 주의' },
            { name: '노르딕 컬', difficulty: '어려움', videoId: 'nTcRTG-Py0c', purpose: ['strength'], phase: ['chronic'], equipment: ['none'], pattern: ['eccentric'], precautions: '급성 햄스트링 손상 시 절대 금지' }
        ],
        cameraPreset: { position: 'front', yOffset: -0.2 }
    },
    thigh_r: {
        name: '오른대퇴',
        description: '우측 대퇴부. 대퇴사두근, 햄스트링, 내전근과 대퇴골을 포함합니다.',
        keyMuscles: ['대퇴사두근', '대퇴이두근', '반건양근', '반막양근', '내전근군'],
        keyStructures: ['대퇴골', '슬관절', '장경인대(ITB)'],
        commonPathologies: ['햄스트링 염좌', 'ITB 증후군', '대퇴사두 건염', '대퇴 스트레인'],
        exercises: [
            { name: '햄스트링 스트레칭', difficulty: '쉬움', videoId: '5ZR8VVNZIvg', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '좌골신경통 시 통증 각도 이전에 중단' },
            { name: '대퇴사두 스트레칭', difficulty: '쉬움', videoId: 'E7zqjVm-MMA', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '슬관절 수술 후 과굴곡 주의' },
            { name: '스쿼트', difficulty: '보통', videoId: 'nTcRTG-Py0c', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['squat'], precautions: '슬관절 통증 시 ROM 제한. 무릎 정렬 주의' },
            { name: '노르딕 컬', difficulty: '어려움', videoId: 'nTcRTG-Py0c', purpose: ['strength'], phase: ['chronic'], equipment: ['none'], pattern: ['eccentric'], precautions: '급성 햄스트링 손상 시 절대 금지' }
        ],
        cameraPreset: { position: 'front', yOffset: -0.2 }
    },
    shin_l: {
        name: '왼종아리',
        description: '좌측 하퇴부. 비복근, 가자미근, 전경골근과 경비골을 포함합니다.',
        keyMuscles: ['비복근', '가자미근', '전경골근', '비골근'],
        keyStructures: ['경골', '비골', '족관절', '아킬레스건'],
        commonPathologies: ['아킬레스건염', '정강이 부목', '비복근 경련', '구획증후군'],
        exercises: [
            { name: '카프 레이즈', difficulty: '쉬움', videoId: 'JijbvAl75-A', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '아킬레스건 급성 염증 시 금지' },
            { name: '가자미근 스트레칭', difficulty: '쉬움', videoId: 'JijbvAl75-A', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '' },
            { name: '편심성 카프 레이즈', difficulty: '보통', videoId: 'JijbvAl75-A', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['eccentric'], precautions: '아킬레스건 파열 수술 후 의사 승인 필요' },
            { name: '발목 밴드 운동', difficulty: '보통', videoId: '970LrTe8wBo', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['band'], pattern: ['rotation'], precautions: '급성 발목 염좌 시 금지' }
        ],
        cameraPreset: { position: 'front', yOffset: -0.35 }
    },
    shin_r: {
        name: '오른종아리',
        description: '우측 하퇴부. 비복근, 가자미근, 전경골근과 경비골을 포함합니다.',
        keyMuscles: ['비복근', '가자미근', '전경골근', '비골근'],
        keyStructures: ['경골', '비골', '족관절', '아킬레스건'],
        commonPathologies: ['아킬레스건염', '정강이 부목', '비복근 경련', '구획증후군'],
        exercises: [
            { name: '카프 레이즈', difficulty: '쉬움', videoId: 'JijbvAl75-A', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['isometric'], precautions: '아킬레스건 급성 염증 시 금지' },
            { name: '가자미근 스트레칭', difficulty: '쉬움', videoId: 'JijbvAl75-A', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '' },
            { name: '편심성 카프 레이즈', difficulty: '보통', videoId: 'JijbvAl75-A', purpose: ['strength'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['eccentric'], precautions: '아킬레스건 파열 수술 후 의사 승인 필요' },
            { name: '발목 밴드 운동', difficulty: '보통', videoId: '970LrTe8wBo', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['band'], pattern: ['rotation'], precautions: '급성 발목 염좌 시 금지' }
        ],
        cameraPreset: { position: 'front', yOffset: -0.35 }
    },
    foot_l: {
        name: '왼발',
        description: '좌측 족부. 족저근막, 내재근, 족근골과 발가락 관절을 포함합니다.',
        keyMuscles: ['족저근막', '후경골근', '단비골근', '족부 내재근'],
        keyStructures: ['거골', '종골', '족근관절', '족궁(내측/외측)'],
        commonPathologies: ['족저근막염', '편평족', '요족', '무지외반증', '발목 불안정'],
        exercises: [
            { name: '골프공 족저 마사지', difficulty: '쉬움', videoId: '1yJwleqY73s', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['golf_ball'], pattern: ['massage'], precautions: '족저근막 파열 시 금지' },
            { name: '타월 컬', difficulty: '쉬움', videoId: 'GNCpqbXlZ1g', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['towel'], pattern: ['isometric'], precautions: '' },
            { name: '카프 스트레칭', difficulty: '쉬움', videoId: '1yJwleqY73s', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '' },
            { name: '균형 보드 훈련', difficulty: '보통', videoId: '970LrTe8wBo', purpose: ['stability'], phase: ['chronic'], equipment: ['balance'], pattern: ['isometric'], precautions: '급성 발목 염좌/골절 시 절대 금지' }
        ],
        cameraPreset: { position: 'front', yOffset: -0.45 }
    },
    foot_r: {
        name: '오른발',
        description: '우측 족부. 족저근막, 내재근, 족근골과 발가락 관절을 포함합니다.',
        keyMuscles: ['족저근막', '후경골근', '단비골근', '족부 내재근'],
        keyStructures: ['거골', '종골', '족근관절', '족궁(내측/외측)'],
        commonPathologies: ['족저근막염', '편평족', '요족', '무지외반증', '발목 불안정'],
        exercises: [
            { name: '골프공 족저 마사지', difficulty: '쉬움', videoId: '1yJwleqY73s', purpose: ['mobility'], phase: ['acute', 'subacute', 'chronic'], equipment: ['golf_ball'], pattern: ['massage'], precautions: '족저근막 파열 시 금지' },
            { name: '타월 컬', difficulty: '쉬움', videoId: 'GNCpqbXlZ1g', purpose: ['stability', 'strength'], phase: ['subacute', 'chronic'], equipment: ['towel'], pattern: ['isometric'], precautions: '' },
            { name: '카프 스트레칭', difficulty: '쉬움', videoId: '1yJwleqY73s', purpose: ['mobility'], phase: ['subacute', 'chronic'], equipment: ['none'], pattern: ['stretch'], precautions: '' },
            { name: '균형 보드 훈련', difficulty: '보통', videoId: '970LrTe8wBo', purpose: ['stability'], phase: ['chronic'], equipment: ['balance'], pattern: ['isometric'], precautions: '급성 발목 염좌/골절 시 절대 금지' }
        ],
        cameraPreset: { position: 'front', yOffset: -0.45 }
    },
};

/**
 * 부위 키로 해부학 정보 조회
 * @param {string} regionKey - PREDEFINED_REGIONS의 id (예: 'shoulder_l')
 * @returns {Object|null} 해부학 정보 객체
 */
export function getAnatomyInfo(regionKey) {
    return ANATOMY_DB[regionKey] || null;
}

/**
 * 키워드 검색 → 매칭된 부위 목록 반환
 * 질환 우선, 그 다음 근육/구조/부위명/운동 순서로 검색
 * @param {string} query - 검색어
 * @returns {Array<{regionKey: string, name: string, matchField: string}>}
 */
export function searchAnatomy(query) {
    if (!query || query.trim().length === 0) return [];

    const q = query.trim().toLowerCase();

    // 1차: 질환 매칭 (최우선)
    const diseaseResults = [];
    // 2차: 나머지 매칭
    const otherResults = [];
    const seen = new Set();

    for (const [key, info] of Object.entries(ANATOMY_DB)) {
        // 질환 매칭 (최우선)
        for (const path of info.commonPathologies) {
            if (path.toLowerCase().includes(q) && !seen.has(key)) {
                diseaseResults.push({ regionKey: key, name: info.name, matchField: `질환: ${path}` });
                seen.add(key);
                break;
            }
        }
    }

    for (const [key, info] of Object.entries(ANATOMY_DB)) {
        if (seen.has(key)) continue;

        // 근육 매칭
        for (const muscle of info.keyMuscles) {
            if (muscle.toLowerCase().includes(q) && !seen.has(key)) {
                otherResults.push({ regionKey: key, name: info.name, matchField: `근육: ${muscle}` });
                seen.add(key);
                break;
            }
        }
        if (seen.has(key)) continue;

        // 부위명 매칭
        if (info.name.toLowerCase().includes(q)) {
            otherResults.push({ regionKey: key, name: info.name, matchField: '부위명' });
            seen.add(key);
            continue;
        }

        // 구조 매칭
        for (const struct of info.keyStructures) {
            if (struct.toLowerCase().includes(q) && !seen.has(key)) {
                otherResults.push({ regionKey: key, name: info.name, matchField: `구조: ${struct}` });
                seen.add(key);
                break;
            }
        }
        if (seen.has(key)) continue;

        // 운동 매칭
        for (const ex of info.exercises) {
            if (ex.name.toLowerCase().includes(q) && !seen.has(key)) {
                otherResults.push({ regionKey: key, name: info.name, matchField: `운동: ${ex.name}` });
                seen.add(key);
                break;
            }
        }
    }

    return [...diseaseResults, ...otherResults];
}

/**
 * 자동완성용 전체 용어 목록 반환
 * @returns {string[]} 검색 가능한 모든 용어
 */
export function getAutocompleteTerms() {
    const terms = new Set();

    for (const info of Object.values(ANATOMY_DB)) {
        terms.add(info.name);
        info.keyMuscles.forEach(m => terms.add(m));
        info.keyStructures.forEach(s => terms.add(s));
        info.commonPathologies.forEach(p => terms.add(p));
        info.exercises.forEach(e => terms.add(e.name));
    }

    return [...terms].sort();
}

// ═══ Consumer-Friendly Helpers ═══

/**
 * 부위별 추천 운동 리스트 반환 (소비자용 간소화)
 * @param {string} regionKey - 부위 키 (예: 'shoulder_l')
 * @returns {Array<{name, difficulty, videoId, purpose, equipment}>}
 */
export function getExercisesForRegion(regionKey) {
    const info = ANATOMY_DB[regionKey];
    if (!info) return [];

    return info.exercises.map(ex => ({
        name: ex.name,
        difficulty: ex.difficulty,
        videoId: ex.videoId,
        purpose: (ex.purpose || []).map(p => {
            const tag = EXERCISE_TAG_DEFS.purpose.options.find(o => o.id === p);
            return tag ? tag.label : p;
        }),
        equipment: (ex.equipment || []).map(e => {
            const tag = EXERCISE_TAG_DEFS.equipment.options.find(o => o.id === e);
            return tag ? tag.label : e;
        }),
        precautions: ex.precautions || '',
    }));
}

/**
 * 부위 이름 반환 (소비자용 간결한 이름)
 */
export function getRegionDisplayName(regionKey) {
    const info = ANATOMY_DB[regionKey];
    return info ? info.name : regionKey;
}

/**
 * 부위의 일반적 증상/문제 반환 (소비자 용어)
 */
export function getCommonIssues(regionKey) {
    const info = ANATOMY_DB[regionKey];
    if (!info) return [];
    return info.commonPathologies || [];
}

/**
 * 부위 설명 반환
 */
export function getRegionDescription(regionKey) {
    const info = ANATOMY_DB[regionKey];
    return info ? info.description : '';
}

/**
 * 카메라 프리셋 반환
 */
export function getCameraPreset(regionKey) {
    const info = ANATOMY_DB[regionKey];
    return info ? info.cameraPreset : null;
}

// ═══ Goal → Region Mapping (ProgramEngine용) ═══

export const GOAL_REGION_MAP = {
    lower_back: ['lower_back_l', 'lower_back_r', 'hip_l', 'hip_r', 'abdomen_l', 'abdomen_r'],
    shoulder:   ['shoulder_l', 'shoulder_r', 'upper_back_l', 'upper_back_r', 'chest_l', 'chest_r'],
    knee:       ['thigh_l', 'thigh_r', 'shin_l', 'shin_r'],
    neck:       ['neck_l', 'neck_r', 'head_l', 'head_r'],
    posture:    ['upper_back_l', 'upper_back_r', 'shoulder_l', 'shoulder_r', 'neck_l', 'neck_r', 'abdomen_l', 'abdomen_r'],
    fitness:    Object.keys(ANATOMY_DB),
};

/**
 * 목표 ID에 해당하는 운동 풀 반환 (raw 형식, 리전키 포함)
 */
export function getExercisesForGoal(goalId) {
    const regionKeys = GOAL_REGION_MAP[goalId] || [];
    const seen = new Set();
    const result = [];

    for (const rk of regionKeys) {
        const info = ANATOMY_DB[rk];
        if (!info) continue;
        for (const ex of info.exercises) {
            const key = ex.name + '|' + (ex.videoId || '');
            if (seen.has(key)) continue;
            seen.add(key);
            result.push({ ...ex, regionKey: rk });
        }
    }
    return result;
}

/**
 * 카테고리별 운동 필터 (warmup/main/cooldown 추정)
 * estimatedSeconds가 없으면 패턴 기반으로 추정
 */
export function guessExerciseCategory(ex) {
    const p = ex.purpose || [];
    const pat = ex.pattern || [];
    if (pat.includes('stretch') || pat.includes('massage') || p.includes('breathing')) return 'warmup';
    if (p.includes('strength') || pat.includes('squat') || pat.includes('lunge') || pat.includes('hinge') || pat.includes('plank')) return 'main';
    if (p.includes('stability') || pat.includes('isometric')) return 'main';
    return 'warmup';
}

/**
 * 운동 난이도를 숫자로 변환 (1-5)
 */
export function difficultyToNumber(diff) {
    if (diff === '쉬움') return 1;
    if (diff === '보통') return 3;
    if (diff === '어려움') return 5;
    return 3;
}

/**
 * 모든 리전 키 목록 반환
 */
export function getAllRegionKeys() {
    return Object.keys(ANATOMY_DB);
}

/**
 * Raw 운동 데이터 반환 (리전별)
 */
export function getRawExercises(regionKey) {
    const info = ANATOMY_DB[regionKey];
    return info ? info.exercises : [];
}
