# Changelog

All notable changes to this project will be documented in this file.

## [v0.6.0] - 2026-05-13

### ✨ Features
- 게스트 URL 열람 기능 추가 (`3da6a3b`) — `?view=<slug>` URL로 비로그인 공개 대진 열람
  - 관리자 홈 화면에 "게스트 URL" 복사 버튼 (Share2 아이콘) 추가
  - GuestView: 학교급 탭·종목 카드·대진표/순위표 전체 공개 대시보드
  - 관리자 접근 버튼으로 로그인 화면으로 전환 가능
  - Supabase `get_org_tournaments` RPC(SECURITY DEFINER)로 org별 격리 유지
- 대진 생성 시 학년 선택 옵션 추가 (`0898573`) — 선택 사항, 기본값 "구분 없음"
  - 초등 1~6학년, 중등/고등 1~3학년
  - 학교급 변경 시 학년 자동 초기화
  - 선택한 학년이 대진표 헤더(Home·Draw·GuestView)·다운로드 파일명에 표시

### 🐛 Bug Fixes
- 대진표 다운로드 한글/스타일 깨짐 완전 수정 (`9724748`) — `cloneWithComputedStyles()`로 전체 DOM 인라인 스타일 복사, Tailwind v4 CSS 변수 미해석 문제 근본 해결
- 게스트 뷰 대진 미표시 수정 (`0a7357b`) — 대진 생성 시 `org_id`를 meta에 저장, `GENERATE_BRACKET` 액션에 `orgId` 전달

---

## [v0.5.0] - 2026-05-13

### ✨ Features
- 앱 내 사용 가이드 모달 추가 — GlobalBar 우하단 "사용법" 버튼(BookOpen 아이콘)으로 언제든 열람 가능 (`f444f78`)
  - 등록·로그인·대진생성·일정·결과입력·다운로드·로그아웃·주의사항 8개 섹션
  - 로그인 전(학교 선택 화면)·후 모두 표시

### 🐛 Bug Fixes
- 대진표 다운로드 시 한글 텍스트가 □·I 박스로 깨지는 문제 수정 (`f444f78`)
  - Noto Sans KR 폰트를 Google Fonts로 명시 로딩 (index.html)
  - `document.fonts.ready` 대기 + dom-to-image 더블 콜 패턴 적용 (CSS·폰트 캐시 워밍업)

### 📝 Documentation
- `README.md` 사용자 가이드 문서 신규 작성 — 등록·로그인·대진생성·경기진행·다운로드·관리자 참고사항 (`f444f78`)
- `CLAUDE.md` v0.4.0 멀티 테넌트 아키텍처 전면 업데이트 (`fc56a4e`)

---

## [v0.4.0] - 2026-05-13

### ✨ Features
- 멀티 테넌트 지원: 학교/기관별 독립 계정 및 데이터 격리
- 홈 화면 조직 선택 — 등록된 학교 목록 검색·선택 후 로그인
- 새 학교/기관 셀프 등록 (학교명·식별자·비밀번호)
- 완전 비공개 모드 — 로그인 없이는 대진 데이터 열람 불가

### 🔒 Security
- Supabase RLS `user_id = auth.uid()` 기반 소유자 격리
- `organizations` 테이블 추가 (slug·name·user_id)
- `tournaments` 테이블에 `user_id`·`org_id` 컬럼 추가
- 기존 공개 SELECT 정책(`anyone can read`) 제거

### ♻️ Refactoring
- `adminStorage.js` 재작성 — 단일 고정 계정 → 조직별 독립 계정
- `storage.js` — 인증 후 Supabase 결과 우선 신뢰 (localStorage fallback 차단)
- `AdminContext` — `orgSlug`·`orgId` 상태 추가
- `AdminLoginModal` — 로그아웃 전용으로 단순화
- `GlobalBar` — 미로그인 시 관리자 버튼 숨김

### 🆕 New Files
- `src/components/OrgSelectScreen.jsx` — 조직 선택·등록·로그인 통합 화면
- `SUPABASE_MIGRATION.sql` — DB 스키마 변경 명세

---

## [v0.3.0] - 2026-05-07

### ✨ Features
- 리그전 조별편성+토너먼트 기능 추가: 7팀 이상 시 자동 조편성, 조별 리그 완료 후 토너먼트 대진 자동 생성 (`353f0be`)
- 종목 대시보드에 조별 순위표·경기 결과 공개 표시 (GroupDashboardView) (`8c35727`)
- 학교급별 종목 현황 카드 대시보드 추가 — 진행률·우승자·포맷 한눈에 확인, 종목 목록 뒤로가기 (`ccd58e7`)
- 전체 초기화 2단계 확인 다이얼로그 추가 (실수 방지) (`ccd58e7`)
- 초등부 지원 및 성별(남성/여성/혼성) 구분 추가 (`f3c2703`)
- 팀 목록 CSV/Excel 템플릿 다운로드 버튼 추가 (`86412fd`)
- 종목 선택, 경기방식(토너먼트/리그전) 선택, CSV·Excel 일괄 업로드 기능 추가 (`ed0b776`)
- 종목 목록 22개로 확장 (보치아, 슐런 등 특수 종목 포함) (`7304fee`)

### 🐛 Bug Fixes
- 기존 대진 불러올 때 gameFormat 복원 오류 및 key 중복 버그 수정 (`c20c3f8`)
- Supabase Auth 연동으로 RLS 기반 쓰기 권한 적용 (`b3d7b07`)
- localStorage 우선 저장 + Supabase 보조 동기화 방식으로 안정화 (`9c4bbde`)
- 관리자 인증 localStorage 방식 롤백 및 세션 유지 복구 (`6450080`)

### ♻️ Refactoring
- 종목 선택 UI를 pill 버튼 → 드롭다운으로 변경 (`2a20001`)

### 📝 Documentation
- CLAUDE.md 전면 업데이트 — 현재 아키텍처 반영 (`4fa22c3`)

### 🔧 Chores
- 앱 타이틀 '학교스포츠클럽 축제 대진관리'로 변경 (`cefc5f8`)
- 푸터 저작권 표기 kimjs로 업데이트 (`ede38b2`)

---

## [v0.2.0] - 2026-04-28

### ✨ Features
- 홈 화면에 관리자/게스트 사용 가이드 모달 추가 (`cff52f2`)
- 공유 링크로 다른 기기에서 대진표 확인 가능하도록 구현 (LZString URL 압축) (`3132ab1`)
- 관리자 전용 대진 초기화·전체 초기화 기능 추가 (`52de497`)

### 🐛 Bug Fixes
- 내려받기 기능 브라우저 호환성 개선 (`8334f56`)
- 브라켓 다운로드 라이브러리 html2canvas → dom-to-image-more로 교체 (`0374856`)

### 📝 Documentation
- 관리자·게스트 사용 가이드 README 작성 (`07ec872`)

### 🔧 Chores
- GitHub Pages 배포 설정 추가 (`.github/workflows/deploy.yml`) (`1becf76`)

---

## [v0.1.0] - 2026-04-28

> 초기 릴리즈 — 학교스포츠클럽 농구 토너먼트 대진 관리 시스템

### ✨ Features

#### 홈 대시보드
- 고등부 / 중등부 레벨 탭으로 구분된 메인 대시보드 화면
- 레벨별 서브탭 제공: **현황**, **학교 조회**, **대진표**, **결과 피드**, **공지**
- 대회 현황 카드 (참가팀 수, 브라켓 규모, 완료 경기, 부전승 수)
- 라운드별 진행률 바
- 대회 종료 시 최종 순위 (1~4위) 자동 표시 및 우승 배너

#### 대진표 관리
- 참가 팀 등록 및 수정 (중등부 / 고등부 구분)
- 토너먼트 브라켓 자동 생성 (2의 거듭제곱 브라켓, 부전승 자동 배정)
- 대진 재구성(리셔플) 기능
- 대진표 다운로드: PNG / JPG / PDF 형식 지원 (dom-to-image-more + jsPDF)
- 경기 일정 입력 (날짜 / 시간 / 장소)
- 브라켓 카드에 일정 정보 표시

#### 다중 대회 지원
- 중등부·고등부 각각 여러 대회 생성 및 관리
- 대회별 독립 저장 (`localStorage` 멀티 키 구조)
- 기존 단일 대회 데이터 자동 마이그레이션
- 대회 선택기 (최신 / 2차 / 3차 …) 제공

#### 경기 진행
- 라운드별 경기 결과 입력 (홈/어웨이 점수)
- 동점 방지 유효성 검사 (연장전 결과 입력 안내)
- 결과 수정 기능
- 다음 라운드 진출팀 자동 반영
- 경기 완료율 진행 바

#### 학교별 일정 조회
- 학교명 자동완성 검색
- 팀 버튼 클릭으로 빠른 조회
- 해당 팀의 전체 경기 일정 / 결과 / 승패 통계 표시

#### 결과 피드
- 완료된 경기 목록 (최신순 정렬)
- 승자 트로피 아이콘 및 스코어 표시

#### 공지 관리
- 대회별 공지사항 등록 및 삭제
- 등록 시간 표시

### 🔒 보안 / 관리자 기능
- 관리자 계정 생성 (최초 1회 사용자명 + 비밀번호 설정)
- 관리자 로그인 모달 (재방문 시 로그인)
- 관리자 전용 기능 보호:
  - 대진 생성 및 재구성
  - 경기 일정 입력
  - 경기 결과 입력 (비관리자는 페이지 접근 불가)
  - 공지 작성 및 삭제
- `requireAdmin()` 패턴: 미로그인 상태에서 관리자 기능 시도 시 로그인 모달 → 완료 후 자동 실행
- 화면 우하단 GlobalBar: 관리자 상태 표시 / 로그인 · 로그아웃 버튼

### 🎨 UI / 테마
- 라이트 / 다크 / 시스템 자동 테마 모드 지원 (클래스 기반 dark mode)
- 테마 설정 `localStorage` 영속 저장
- 시스템 테마 변경 자동 감지 (auto 모드)
- Tailwind CSS v4 기반 반응형 레이아웃
- 모바일 / 태블릿 / 데스크탑 대응

### 🔧 기술 스택 / 인프라
- React 19 + Vite 8
- Tailwind CSS v4 (`@custom-variant dark` 클래스 기반)
- `useReducer` + Context API (전역 앱 상태 + 관리자 인증 분리)
- `localStorage` 다중 대회 저장 구조 (`tournament_ids_v2`, `tournament_data_{id}`)
- dom-to-image-more + jsPDF (브라켓 이미지/PDF 내보내기, 동적 임포트 레이지 로딩)
- lucide-react 아이콘

---

*이 프로젝트는 학교스포츠클럽 농구 대회의 대진 생성, 경기 진행, 결과 관리를 위한 웹 애플리케이션입니다.*
