# Hamsktop v0.1 — 마일스톤 한국어 요약

원본은 `.omc/plans/hamsktop-v0.1-consensus.md` (영어, 984줄). 이 문서는 그 중 **5개 마일스톤** 부분만 한국어로 요약한 빠른 참고용입니다.

총 추정: 10–15일

| # | 제목 | 추정 | 상태 |
|---|------|------|------|
| A | 스켈레톤 + Tauri v2 검증 spike | 1.5–2.5일 | ✅ 완료 (`9510776`) |
| B | 스프라이트 + Hit-Test + 인터랙션 | 3–4일 | ⏳ 다음 |
| C | Idle/Active 감지 + 성장 루프 | 2–3일 | 🟡 |
| D | 라이프사이클 완결 + 영속 저장 | 2–3일 | 🟡 |
| E | 폴리싱 + 패키징 | 2–3일 | 🟡 |

---

## ✅ Milestone A: 스켈레톤 + Tauri v2 검증 spike (완료)

**목표**: Tauri 앱이 뜨고, 투명·항상-위·프레임 없는 창에 갈색 placeholder가 표시된다. 0.5일짜리 검증 spike가 v2 vs v1 결정의 게이트.

### A.0 — Tauri v2 검증 spike (게이트, 0.5일) ✅
3가지 핵심 API가 v2에서 동작하는지 확인:
1. `transparent + frameless + alwaysOnTop` 창이 macOS에서 정상 렌더 (배경에 데스크톱 비침)
2. `set_ignore_cursor_events(true/false)` 토글이 런타임에 동작
3. `mouse_position` crate가 click-through 상태에서도 글로벌 커서 좌표 읽기 가능

**합격 조건**: 3개 다 PASS (사용자 시각 확인까지). 하나라도 실패 시 v1 fallback (Electron 아님).

### A.1 — 프로젝트 부트스트랩 (1–2일) ✅
- Tauri v2 + React + Vite + Zustand + TypeScript 스캐폴딩
- `tauri.conf.json`: 투명·프레임 없음·항상-위, 초기 128×128
- 배경 투명 + 갈색 placeholder 사각형 표시
- placeholder sprite 3종 (아기 녹/성체 갈/노령 회) 32×(32×8) 시트 (`pngjs`로 프로그램 생성)
- Cmd+Shift+H 글로벌 단축키 (click-through 강제 OFF, 안전판)

### A.2 — 크로스플랫폼 CI (0.5일) ✅
- `.github/workflows/build.yml`: macOS + Windows 매트릭스
- push할 때마다 양 플랫폼 컴파일 검증
- 실패 시 즉시 알림 (Milestone E까지 미루지 않음)

---

## ⏳ Milestone B: 스프라이트 + Hit-Test + 인터랙션 (3–4일, 다음)

**목표**: 도트 햄스터가 스프라이트 시트에서 애니메이션 재생, 햄스터 몸 위만 클릭 차단, 클릭 시 액션 메뉴 등장.

**만들 것**:
- Canvas 기반 스프라이트 렌더러 (idle 애니메이션 재생)
- 알파 마스크 생성 스크립트 (sprite PNG → mask JSON)
- Rust 적응형 hit-test 루프:
  - 커서가 스프라이트 박스 2배 **밖**일 때 → 2fps polling
  - 커서가 박스 2배 **안**일 때 → 30fps polling
  - 상태 전환 시에만 `set_ignore_cursor_events` 토글
- 햄스터 몸 클릭 시 한국어 액션 메뉴 (먹이/쓰담/놀기)
- 투명 영역 클릭은 뒤 앱으로 통과
- 액션 버튼: placeholder 애니메이션 (콘솔 로그 + 짧은 컬러 플래시)

**핵심 파일**:
- `src/components/HamsterSprite.tsx` — Canvas 스프라이트 렌더러
- `src/animation/spriteEngine.ts` — 프레임 시퀀서, frame-changed 이벤트 emit
- `src/animation/manifest.json` — 애니메이션 정의
- `src/components/ActionMenu.tsx` — 라디얼/드롭다운 메뉴 (한국어)
- `src-tauri/src/hit_test/mod.rs` — 적응형 polling + DPI 정규화
- `src-tauri/src/hit_test/alpha_mask.rs` — 마스크 로더, 점-안-사각 쿼리, 프레임 인덱스 lookup
- `scripts/generate-alpha-mask.ts` — 빌드 타임 마스크 생성기
- `src/i18n/ko.json` — 한국어 문자열

**검증**:
1. 햄스터 몸 위로 커서 → 캡처
2. 투명 영역 → 뒤 앱으로 전달
3. 햄스터 클릭 → 먹이/쓰담/놀기 메뉴
4. 액션 클릭 → 콘솔 로그

**합격 기준**:
- 햄스터 스프라이트가 ~6fps로 애니메이션
- 투명 픽셀에서 click-through 동작
- 불투명 픽셀에서 액션 메뉴 표시
- 한국어 라벨 3개

---

## 🟡 Milestone C: Idle/Active 감지 + 성장 루프 (2–3일)

**목표**: OS 레벨 idle 감지가 햄스터 성장을 구동. active 시간 누적 → 라이프 스테이지 시각적 전환.

**만들 것**:
- 플랫폼별 idle detection: macOS(IOKit) + Windows(GetLastInputInfo)
- 프론트엔드 10초마다 idle 상태 polling
- active 시간이 Zustand store에 누적
- 라이프 스테이지 전환:
  - 아기 (0–20h)
  - 성체 (20–60h)
  - 노령 (60–80h)
- 스테이지 전환 시 sprite sheet 변경 + 전환 애니메이션
- 무드 시스템: 시간에 따라 감소, 인터랙션으로 회복
- idle 상태에서 sleep 애니메이션

**핵심 파일**:
- `src-tauri/src/platform/macos/idle.rs` — IOKit 구현
- `src-tauri/src/platform/windows/idle.rs` — GetLastInputInfo 구현
- `src-tauri/src/commands/idle.rs` — `get_idle_seconds` Tauri command
- `src/hooks/useIdleDetection.ts` — 10초 polling
- `src/hooks/useLifecycle.ts` — 상태 머신, 스테이지 전환
- `src/hooks/useMood.ts` — 무드 감소 + 인터랙션 효과
- `src/store/hamsterStore.ts` — 전체 HamsterState

**검증**:
1. 아기 단계 표시 확인
2. 컴퓨터 활발히 사용 → 누적 시간 증가 (dev console)
3. 자리 비움 → sleep 애니메이션
4. 스테이지 전환 테스트는 임시로 임계값을 초 단위로

**합격 기준**:
- macOS에서 마지막 입력 후 경과 초 정확히 반환
- 사용자가 active일 때만 시간 누적
- 스테이지 전환이 정확한 누적 시간 경계에서 발생
- idle 시 sleep 애니메이션 재생

---

## 🟡 Milestone D: 라이프사이클 완결 + 영속 저장 (2–3일)

**목표**: 80h active 후 햄스터 자연사 → 작별 화면 → 다시 시작. 앱 재시작에도 상태 유지.

**만들 것**:
- 죽음 상태 → 작별 화면 (햄스터 이름 + "다시 시작" 버튼)
- 다시 시작 → 새 햄스터 생성 (세대 +1, 새 이름 입력)
- 첫 실행 시 onboarding (이름 입력 다이얼로그)
- 60초마다 + 인터랙션 시 + 종료 시 자동 저장
- 앱 시작 시 저장된 상태 로드, 햄스터 이어가기
- 창 위치 유지
- 인터랙션 쿨다운 + 일일 놀이 횟수 cap (3회/일, 로컬 시간 기준)

**핵심 파일**:
- `src/components/FarewellScreen.tsx` — 죽음 화면
- `src/components/OnboardingDialog.tsx` — 첫 실행 이름 입력
- `src-tauri/src/persistence/schema.rs` — AppState 구조체
- `src-tauri/src/persistence/store.rs` — JSON 읽기/쓰기, app_data_dir
- `src-tauri/src/commands/state.rs` — save_state / load_state
- `src-tauri/src/commands/interaction.rs` — feed/pet/play + cooldown + cap
- `src/store/persistMiddleware.ts` — 상태 변경 시 debounced 자동 저장

**검증**:
1. 첫 실행 → onboarding 이름 다이얼로그
2. 이름 입력 → 햄스터 표시
3. 종료 후 재실행 → 같은 햄스터, 같은 이름
4. 펫 위치 변경 → 종료 → 재실행 → 위치 유지
5. 임시로 초 단위 임계값 → 라이프사이클 완주 → 죽음 화면
6. 다시 시작 클릭 → 2세대 햄스터, 새 이름 입력

**합격 기준**:
- 앱 재시작에도 상태 유지 (이름, 스테이지, 누적 시간, 위치)
- 작별 화면에 햄스터 이름 표시
- 다시 시작 버튼 동작, 세대 증가
- 첫 실행 시 이름 받기

---

## 🟡 Milestone E: 폴리싱 + 패키징 (2–3일)

**목표**: 사운드, 설정 패널, 다중 모니터 처리, 트레이 아이콘, 플랫폼 인스톨러.

**만들 것**:
- 사운드 효과 (켜져 있을 때): feed/pet/play 시 chirp, 스테이지 업 시 jingle, 죽음 시 melody
- 트레이 아이콘 + 컨텍스트 메뉴 (설정 / 종료)
- 설정 패널: 사운드 토글, about, 종료
- 다중 모니터: 펫 위치를 모니터에 anchor, 모니터 사라지면 fallback
- 진짜 패키징: 
  - macOS `.dmg` 로컬 빌드
  - Windows `.msi` CI artifacts에서 다운로드
- Windows VM에 .msi 설치하여 launch + 기본 동작 검증
- CPU 프로파일링: 양 플랫폼에서 idle CPU < 1% 확인

**핵심 파일**:
- `src/components/SettingsPanel.tsx` — 설정 UI
- `src/hooks/useSound.ts` — 사운드 플레이어 (설정 존중)
- `src/assets/sounds/chirp.wav`, `stage_up.wav`, `farewell.wav`
- `src-tauri/icons/` — 진짜 브랜딩 아이콘 (현재 placeholder 갈색 원 대체)

**검증** (CPU 측정):
- macOS: `top -l 5 -pid $(pgrep -f hamsktop) -stats cpu | tail -5`
- Windows: `Get-Counter '\Process(hamsktop)\% Processor Time' -SampleInterval 2 -MaxSamples 5`
- 목표: 5 샘플 평균 < 1%

**합격 기준**:
- 설정 켜짐/꺼짐에 따라 사운드 동작
- 양 플랫폼에서 트레이 아이콘 동작
- 모니터 disconnect 시 펫이 안전하게 처리됨
- macOS `.dmg` 로컬 빌드, Windows `.msi` CI 빌드 (둘 다 다운로드 가능)

---

## 진행 상황 추적

각 마일스톤은 별도 commit (또는 commits 묶음)으로 push됩니다. `git log --oneline` 또는 GitHub commits 탭에서 추적 가능.

이미 끝난 것 (A 마일스톤):
- `c4a88bf` bootstrap (spec + plan)
- `aa10c3e` A.0 spike scaffold
- `a7360ef` A.0 spike fix (visual PASS)
- `a53a36a` A.1 real bootstrap
- `84a2709` A.2 CI matrix
- `3fc8c3b` Cargo.lock 트래킹
- `87c0814` CI: --no-bundle (Milestone E로 packaging 이연)
- `9510776` CI: 플랫폼 아이콘 추가 (icon.ico, icon.icns)
