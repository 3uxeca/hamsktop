# Deep Interview Spec: Hamsktop — Pixel Hamster Desktop Companion

## Metadata
- Interview ID: hamsktop-2026-04-24
- Rounds: 6
- Final Ambiguity Score: 15.3%
- Type: greenfield
- Generated: 2026-04-24
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.88 | 0.40 | 0.352 |
| Constraint Clarity | 0.80 | 0.30 | 0.240 |
| Success Criteria | 0.85 | 0.30 | 0.255 |
| **Total Clarity** | | | **0.847** |
| **Ambiguity** | | | **0.153** |

## Goal

macOS와 Windows 모두에서 동작하는 데스크톱 앱. 픽셀(도트) 그래픽 햄스터가 **항상-위 투명 HUD 오버레이**로 화면 한켠에 떠있다. 햄스터의 삶은 **OS 레벨 idle/active 시간**과 연동되어, 사용자가 컴퓨터에서 활발히 작업할수록 햄스터가 자라고, 자리를 비우면 졸음 모션을 보인다. v0.1 범위는 **단일 세대 라이프사이클**(아기 → 성체 → 노령 → 자연사 → "다시 시작" 버튼). 사용자는 펫의 몸 위를 클릭해 먹이/쓰담/놀기 같은 명시적 인터랙션을 할 수 있고, 펫 외 영역은 모두 click-through로 뒤의 앱(코드/브라우저)에 정상 도달한다.

## Constraints

- **플랫폼**: macOS + Windows 양쪽 동시 지원 (cross-platform 필수)
- **창 시스템**: transparent, frameless, always-on-top 오버레이
- **마우스 모델**: 펫 몸통 위 = 클릭 차단, 그 외 = click-through (픽셀-정확 hit-test)
- **입력 신호**: OS 레벨 idle/active 시간만 (앱 이름·콘텐츠 추적 없음, 키스트로크 비관찰)
- **권한**: macOS는 Accessibility 권한 일부 필요, Windows는 GetLastInputInfo 등 가벼운 API
- **저장**: 로컬 전용 (계정·클라우드 동기화 없음)
- **리소스 예산**: 24/7 상시 동작 가능해야 함 — idle CPU < 1%, 적정 RAM (정확 수치는 v0.1 측정 후 조정)
- **인터랙션 액션**: 펫 클릭 시 먹이/쓰담/놀기 등 명시적 액션 (애니메이션 반응 포함)

## Non-Goals (v0.1)

- 다세대 가계도(Hamster Lineage) UI 및 묘지/족보 표현 — v1+로 이연
- Active app/window 추적 — 입력 신호는 idle/active만
- 클라우드 동기화, 사용자 계정, 멀티 디바이스
- 외부 도구 연동 (Google Calendar, Notion, Toggl, GitHub commits 등)
- 수동 포모도로 세션
- 다중 햄스터 동시 사육
- 수집·진화 변종 시스템 (다양한 종/컬러 분기)

## Acceptance Criteria

### v0.1 합격선
- [ ] macOS와 Windows에서 모두 빌드 및 실행 (단일 코드베이스 또는 명시적 양 플랫폼 빌드)
- [ ] 햄스터가 transparent, always-on-top, frameless 오버레이 창으로 표시됨
- [ ] 펫 몸통 영역에서 픽셀-정확 hit-test 동작; 그 외 영역 click-through 동작
- [ ] 펫 몸통 클릭 시 먹이/쓰담/놀기 액션 메뉴 표시 + 액션별 애니메이션 반응
- [ ] OS 레벨 idle/active 감지 동작 (active 시간 누적이 햄스터 성장에 반영)
- [ ] 햄스터가 가시적 라이프 스테이지(아기 → 성체 → 노령)를 거쳐감
- [ ] 노령 후 자연사 → 작별 화면 + "다시 시작" 버튼으로 새 햄스터 생성
- [ ] 펫 상태(나이, 성장 단계, 누적 active 시간 등) 로컬 영속 저장 → 앱 재시작 후에도 유지
- [ ] 일반 macOS/Windows 머신에서 idle CPU < 1% 달성
- [ ] 펫이 다중 모니터 환경에서도 의도한 화면에 위치 유지

## Assumptions Exposed & Resolved

| Assumption | Challenge (Round) | Resolution |
|------------|-------------------|------------|
| "햄스터 키우기" = 다마고치형 인터랙션 | Round 1 | **생산성 연동 펫**으로 확정 — 다마고치+앰비언트의 중간, 사용자 활동 신호가 성장 구동 |
| "생산성"은 사용자가 명시적으로 입력 (포모도로) | Round 2 | **OS Idle/Active 시간만** — 사용자 명시 입력 없이 자동 감지, 프라이버시 균형 |
| "키운다"는 한 마리 영속 | Round 3 | **성장·노화·대대손**으로 확정 — 죽음 + 다세대 가계도 (단, 다세대는 v0.1 미포함) |
| "한켠에 늘 띄워놓고"는 비협상 (Contrarian Round 4) | Round 4 | **원안 유지** — 가벼운 메뉴바/숨김 옵션 제시했으나 사용자가 "환영" 거부, 항상-위 HUD가 진짜 요구임 확인 |
| 펫이 스크린에 떠있을 때 뒤 앱 클릭 처리 | Round 5 | **펫 몸통 위에서만 분획 차단** — 픽셀-정확 hit-test, 명시 인터랙션 가능, 일상 작업 방해 최소 |
| v1에 모든 결정 사항을 한꺼번에 구현 (Simplifier Round 6) | Round 6 | **1세대 라이프사이클까지가 v0.1** — 가계도는 v1+로 이연, MVP 검증 우선 |

## Technical Context

**Greenfield, 빈 디렉토리(`/Users/dasha/Desktop/code/hamsktop/`).** 기술 스택 미선정 — ralplan 단계에서 결정 필요.

### 기술 스택 후보 (ralplan 결정 사항)
- **Tauri (Rust + WebView)**: 가벼움, 작은 바이너리, transparent window·click-through·shape hit-test 지원. Rust 학습 곡선.
- **Electron (Node + Chromium)**: 풍부한 생태계, `BrowserWindow` 옵션으로 transparent/always-on-top 자연스러움, `setIgnoreMouseEvents(true, {forward:true})` + 동적 영역 토글로 hit-test. 메모리·디스크 푸트프린트 큼.
- **Native (Swift/AppKit + C#/WinUI 또는 C++/Win32)**: 최고 성능·OS 통합, 코드베이스 분리(2배 작업), 픽셀 정확 hit-test 구현 가장 자연스러움.
- **Flutter Desktop**: 단일 코드베이스, 픽셀 게임에 어울리는 렌더링, 그러나 transparent always-on-top + shape hit-test가 플러그인 의존적·생태계 미성숙.

### 크로스 플랫폼 데스크톱 난이도 (사용자 원질문 답)
**보통 난이도, 그러나 이 앱이 요구하는 세 가지가 정확히 가장 까다로운 부분에 해당**:
1. Transparent always-on-top frameless window — Tauri/Electron이 가장 평탄, 네이티브는 OS별 분기.
2. 픽셀-정확 hit-test (click-through except pet body) — 모든 후보에서 구현 가능하나 디테일 다름.
3. OS 레벨 idle/active detection — macOS는 IOKit/CGEventSource, Windows는 GetLastInputInfo. Tauri/Electron 모두 native plugin 또는 ffi 필요.

이 셋은 잘 알려진 패턴이라 막히는 일은 적지만 플랫폼별 분기 로직이 반드시 들어간다.

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| `Hamster` | core domain | name, 세대 번호, 출생일시, 누적 active 시간, 성장 단계(아기/성체/노령/사망), 무드, 위치(x,y) | belongs to User; (post-v0.1) descendant of previous Hamster |
| `HUD Window` | supporting | 위치, 크기, 모니터 인덱스, click-through 영역 마스크 | hosts Hamster |
| `Productivity Signal` | external (OS API) | 마지막 입력 시각, idle 여부 | drives Activity Session |
| `Activity Session` | supporting | 시작·종료 시각, 누적 active 시간 | feeds Hamster growth |
| `User` | supporting | (단일 로컬 사용자) | owns Hamster, owns Hamster Lineage |
| `Hamster Lineage` *(post-v0.1)* | core supporting | 가계도 트리, 과거 햄스터 기록 | aggregates Hamster history |

## Ontology Convergence

| Round | Entity Count | New | Changed | Stable | Stability |
|-------|-------------|-----|---------|--------|-----------|
| 1 | 4 | 4 | - | - | N/A |
| 2 | 5 | 1 | 0 | 4 | 80% |
| 3 | 6 | 1 | 0 | 5 | 83% |
| 4 | 6 | 0 | 0 | 6 | 100% |
| 5 | 6 | 0 | 0 | 6 | 100% |
| 6 | 6 | 0 | 0 | 6 | 100% |

**3라운드 연속 100% stability** → 도메인 모델 수렴 확인.

## Open Questions (ralplan 단계로 이연)

1. **Tech stack 픽** — Tauri vs Electron vs Native (위 기술 후보 표 참조; 사용자 친화도 vs 푸트프린트 vs 네이티브 통합도 트레이드오프)
2. **1세대 실시간 길이** — 한 햄스터의 라이프사이클이 실시간 며칠? (제안: 7–14일)
3. **Idle 페널티 모델** — 자리 비움이 단순 중립(졸음 모션)인가, 성장 페널티(배고픔/체력 감소)인가
4. **명시 인터랙션 액션 가짓수와 효과** — feed/pet/play의 정확한 효과(성장 가속? 무드 회복?)
5. **사운드 효과** on/off, 기본값, 음량 조절 UI 필요 여부
6. **UI 언어** — 한국어 단일 / 영어 단일 / 로케일 자동
7. **다중 모니터** 시 펫 위치 정책 (스크린 변경 시 따라가기 vs 고정)
8. **펫 외형 커스터마이즈** v0.1 포함 여부 (이름·기본 색만? 스킨 시스템 미포함?)

## Interview Transcript

<details>
<summary>Full Q&A (6 rounds)</summary>

### Round 1 — Goal Clarity
**Q:** '햄스터를 키운다'는 표현의 핵심 경험은 무엇인가요? (다마고치형 / 앰비언트 동반자 / 생산성 연동 / 자체 미니 시뮬레이션)
**A:** 생산성 연동 펫
**Ambiguity:** 67% (Goal: 0.60, Constraints: 0.20, Criteria: 0.10)

### Round 2 — Constraints
**Q:** 햄스터가 사용자의 '생산성'을 어떻게 알아차릴까요? (수동 포모도로 / Idle-Active만 / Active app 추적 / 외부 도구 연동)
**A:** Idle/Active 시간만 추적
**Ambiguity:** 52% (Goal: 0.75, Constraints: 0.50, Criteria: 0.10)

### Round 3 — Success Criteria
**Q:** '성공한 햄스터 라이프'의 모양은? (끝없는 동반자 / 성장·노화·대대손 / 수집·진화 / 일일 리추얼)
**A:** 성장·노화·대대손
**Ambiguity:** 32% (Goal: 0.80, Constraints: 0.55, Criteria: 0.65)

### Round 4 — Constraints (CONTRARIAN)
**Q:** 펫이 항상 화면에 존재하지 않는다면? (원안 항상표시 / 메뉴바 / 데스크톱 벽지 / 토글 가능 HUD)
**A:** 원안대로 항상표시 HUD
**Ambiguity:** 29% (Goal: 0.80, Constraints: 0.65, Criteria: 0.65)

### Round 5 — Constraints + Goal sub-gap
**Q:** 펫 뒤에 있는 앱을 클릭하려 할 때 동작은? (완전 click-through / 펫 몸통만 차단 / modifier key / 펫이 커서 피함)
**A:** 펫 몸통 위에서만 분획 차단
**Ambiguity:** 23% (Goal: 0.85, Constraints: 0.78, Criteria: 0.65)

### Round 6 — Success Criteria (SIMPLIFIER)
**Q:** v0.1이 갖춰야 할 최소 합격선은? (presence-only / 존재+활동연동 / 1세대 lifecycle / 원안 전체)
**A:** 1세대 라이프사이클
**Ambiguity:** 15.3% (Goal: 0.88, Constraints: 0.80, Criteria: 0.85) → **임계치 통과**

</details>
