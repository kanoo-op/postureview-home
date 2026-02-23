# Changelog

PostureView Home - 소비자용 자세/통증 관리 앱

---

## [2026-02-20]

### Added
- 5탭 네비게이션 구조 (오늘운동 / 내프로그램 / 통증관리 / 동작라이브러리 / 진행기록)
- **오늘 운동 화면**: 통증 체크인(0-10 슬라이더 + 느낌 칩) → 루틴 수행 → RPE 피드백
- **내 프로그램 화면**: 온보딩 기반 맞춤 프로그램 자동 생성, 주간 계획 뷰, 설정 변경/재생성
- **통증 관리 화면**: 3D 바디맵 부위 선택 → 통증 기록 → 완화 루틴 추천 → 안전 경고
- **동작 라이브러리 화면**: 운동 검색/필터 (난이도/카테고리/태그), 운동 카드 + 영상 연결
- **진행/기록 화면**: 개요(스트릭/달성률/통증트렌드), 통증일지, 운동로그, 경과차트(Chart.js)
- **ProgramEngine**: 목표/통증/선호 기반 프로그램 자동 생성, 난이도 자동 조절, 완화 루틴 생성
- **SafetyService**: 통증 추이 분석, 악화 경고, 금기 운동 필터, 루틴 검증
- **Storage v2**: IndexedDB 마이그레이션 (programs/dailyCheckins/reliefSessions 스토어 추가)
- **온보딩 플로우**: 목표 선택 → 현재 상태 → 선호 설정 → 프로그램 자동 생성
- **그림판 오버레이**: 3D 모형 위 자유 드로잉 (펜/원/지우개), 색상 6종, 굵기 조절, 되돌리기, 이미지 저장
- **커스텀 커서**: 브러시 크기/색상 미리보기 링 + 시스템 크로스헤어
- 부드러운 펜 곡선 (quadratic bezier 보간)
- 원 그리기: 점선 미리보기 → 실선 확정 + 반투명 채우기
- 3D 딤 효과: 그리기 모드 시 배경 약간 어둡게
- 그리기 모드 전환 시 OrbitControls 자동 비활성화/복구
- 화면 전환 시 그리기 모드 자동 정리 (cleanupPainScreen)
- 글래스모피즘 그림판 툴바 (backdrop-filter blur, 슬라이드 애니메이션)
- SVG 아이콘 버튼 (이모지 제거)
- 업적 시스템 확장 (program_created, daily_checkin_7, relief_routine_5, pain_improved)
- 다크모드 전체 대응

### Changed
- 3D 뷰어 배경: 어두운 네이비(#080d18) → 따뜻한 오프화이트 그라데이션 (앱 테마 통일)
- 3D 라이팅: 차가운 파란 조명 → 따뜻한 스튜디오 조명
- 테마 전환 시 3D 배경 실시간 업데이트 (updateSceneBackground)
- 보기 모드 버튼: 어두운 글래스모피즘 → 밝은 글래스모피즘 + accent 색상
- 툴팁: 다크 배경 → 밝은 글래스모피즘
- 그리드 오버레이: 시안 → accent 틸 색상
- 칩 버튼 active 상태 가시성 개선 (var(--accent) → var(--accent-primary), font-weight 700)
- Chart.js 렌더링: 탭 전환 시에만 렌더, 무한 리사이즈 루프 수정
- 라우터에 화면 cleanup 콜백 지원 추가 (registerScreenCleanup)

### Removed
- 선택 후보(hit-list) 패널 제거
- 레거시 화면 파일 삭제 (HomeScreen, RecordScreen, ExerciseScreen, BodyMapScreen, PostureScreen)
- 마커 시스템 제거 (그림판으로 대체)
