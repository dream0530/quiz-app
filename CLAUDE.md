# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

교사가 미리 준비한 문제지(JSON)를 첫 화면 목록에서 골라 4지선다 문제를 끝까지 풀고, 마지막에 점수·문항별 정오·해설을 확인하는 교육용 웹앱입니다. 요구사항의 기준 문서는 [PRD.md](PRD.md)입니다.

- 기술 구성: Next.js + TypeScript, Vercel 배포, PC·휴대폰 모두 사용 가능한 화면
- 현재 상태: 1일차 앱 완성. 2일차: 교사·학생 화면 나누기, 교사 Google 로그인, Firestore 문제지 등록·공개·결과 저장·교사 결과표, PDF→Azure AI 10문항 출제(로컬에서 실제 호출 확인, 2026-11-03). Vercel에는 프로젝트·배포가 없음(배포 주소 시험은 미확인).
- Azure AI: 강사 제공 연결(`AZURE_API_STYLE=openai-v1`, `AZURE_ENDPOINT`, `AZURE_DEPLOYMENT=gpt-5.6-luna`, `AZURE_API_KEY`)을 `.env.local`에서만 읽음. `POST {endpoint}/openai/v1/chat/completions`, 헤더 `api-key`, `response_format: json_schema`(실제로 동작 확인). 자동 재시도 없음. 강사가 허용한 시험 호출 횟수는 모름 → 실제 호출은 최소한으로(지금까지 2회). 사용자가 키를 채팅에 붙여넣은 적이 있어 키 교체를 권했음. 키 값은 출력하지 말 것.
- 교안 입력 기준(플랫폼 공식 한도 아님): PDF 524,288바이트, 공백 정리 후 본문 12,000자. 넘으면 AI 호출 전에 거절하고 자르지 않음. 200자 미만은 스캔·사진 PDF로 보고 거절.
- Firestore: `(default)` 데이터베이스, 서울(asia-northeast3), Standard, 보안 규칙은 "모두 거부"(프로덕션 모드 기본값) 그대로. 앱 서버만 firebase-admin(서버용 키, 규칙 무시)으로 읽고 씀. 화면(브라우저)은 Firestore에 직접 접근하지 않음. 규칙을 열지 말 것.
- 서버용 키: `C:\Users\b\firebase-keys\quiz-app-3fd80-service-account.json`(프로젝트 폴더 밖, 내용은 읽거나 출력하지 않음). `.env.local`의 `GOOGLE_APPLICATION_CREDENTIALS`가 이 위치를 가리킴. 배포 때는 배포 설정 화면에 `FIREBASE_SERVICE_ACCOUNT_KEY`(키 파일 내용)를 사용자가 직접 넣어야 함(`lib/firebase/admin.ts`가 둘 다 지원).
- Claude가 실행하는 PowerShell/Bash는 격리되어 `AppData` 등 일부 쓰기가 실제 컴퓨터에 남지 않음. 실제 컴퓨터에 설치·파일 이동이 필요하면 터미널 패널(run_in_terminal)을 씀. 프로젝트 폴더와 `~/.claude`는 실제로 반영됨.
- Firebase: 프로젝트 `quiz-app-3fd80`(무료 요금제), 웹 앱 `quiz-app-web`, Authentication에서 Google 로그인 사용 설정, 허용 도메인은 기본값(localhost 포함). 배포하면 그 주소를 허용 도메인에 추가해야 함. Firebase CLI·공식 플러그인(스킬+MCP)은 사용자 범위로 설치·로그인됨(PowerShell에서는 `firebase.cmd`).
- `.env.local`(Git 제외): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`(공개되어도 되는 웹 앱 설정값), `TEACHER_EMAIL`(교사로 허용할 Google 계정 1개). 배포할 때는 같은 값을 배포 설정에 넣어야 함.
- Claude 앱 미리보기에서는 Google 로그인 팝업이 열리지 않음. 교사 로그인 확인은 사용자의 Chrome에서 http://localhost:3000/teacher 로 함.
- `sample-questions.json`은 파일 형식 참고용·검사용입니다. 앱에 고정하거나 자동으로 불러오지 않습니다.

## 명령어 (Windows PowerShell에서 `npm.cmd`로 실행 확인함)

- `npm.cmd run dev`: 내 컴퓨터에서 앱 켜기 → http://localhost:3000
- `npm.cmd test`: 자동 검사(vitest). 파일 하나만 검사하려면 `npm.cmd test -- lib/quiz/score.test.ts`
- `npm.cmd run build`: 완성본 만들기(오류 확인용)
- Claude 앱 안의 브라우저 미리보기는 `.claude/launch.json`의 `quiz-app` 설정을 씁니다.

## 구조

- `lib/quiz/`: 화면과 분리된 문제 처리 부분. `parse.ts`는 문제 파일 글자를 검사하고(하나라도 틀리면 파일 전체 거절, "N번 문제: …" 형식의 쉬운 오류 목록, 맨 앞 BOM 허용, 선택 항목 `title` 반환), `score.ts`는 `Math.round(정답 수 / 전체 × 100)`으로 채점, `paper-tools.ts`(서버 전용)는 문항 정리·정답 빼기·중복 지문(문항 내용 sha256, 제목 제외)·학생 이름 정리·결과 문서 키(문제지+이름, 영문 대소문자 무시)·평균(소수 첫째 자리).
- `lib/firebase/admin.ts`(서버 전용 firebase-admin), `lib/store/papers.ts`(`papers/{지문}`: title, questions(정답 포함), published, createdBy, createdAt, updatedAt; 등록은 비공개로, `create()`라 같은 내용은 중복으로 거절), `lib/store/results.ts`(`results/{문제지+이름 키}`: 이름·고른 답·점수·틀린 문항 번호·제출 시각, 다시 풀면 덮어써 최신 1건).
- `lib/ai/`(서버 전용): `pdf.ts`(크기·`%PDF-` 검사, `unpdf`로 본문 추출, 암호·손상·글자 없음·12,000자 초과 안내), `azure.ts`(호출·오류 종류 401/403/429/시간 초과(100초)/형식·쉬운 안내), `validate.ts`(`parseQuestionFile` 재사용 + 정확히 10문항 + 제목 1~100자 + 기존 제목과 같지 않음). 응답 JSON은 기존 문제 파일 구조 그대로.
- AI 출제: `POST /api/teacher/ai/generate`(교사만, multipart로 PDF 하나만, 600KB 넘는 요청은 읽기 전 거절, 기존 제목 목록을 프롬프트에 넣음, 저장하지 않음, `maxDuration=120`), `POST /api/teacher/ai/save`(교사만, 다시 검사, 같은 제목이면 409·자동 변경 없음, `createPaper(..., {published: true, source: "ai"})`로 바로 공개). 화면은 `components/TeacherAiGenerate.tsx`(결과는 읽기 전용, 버튼은 저장·취소뿐). PDF와 본문은 저장하지 않음.
- 교사 기능 버튼(AI 생성·저장, JSON 등록, 공개 전환)은 요청 직전에 `renewTeacherSession()`(`lib/firebase/client.ts`)으로 서버 로그인 표시(1시간)를 새로 받음(오래 열어 둔 화면에서 401 나던 문제 해결).
- API: `POST /api/teacher/papers`(교사만, 서버에서 다시 검사, 409=중복), `PATCH /api/teacher/papers/[id]`(교사만, 공개/비공개), `POST /api/results`(학생 최종 제출: 공개 문제지·모든 답 필요, 서버가 채점·저장한 뒤에만 정답·해설을 돌려줌, 실패 시 503). 교사 API는 `requireTeacher()`로 확인.
- 화면 주소: `/`(`app/page.tsx`, 교사·학생 선택), `/teacher`(`app/teacher/page.tsx`, 로그인한 교사에게만 `TeacherAiGenerate`, `TeacherUpload`(파일 미리보기→제목 확인→등록), 문제지별 `PublishToggle`과 결과표·평균), `/student`(`app/student/page.tsx`, 매 요청 공개 문제지만 정답·해설을 뺀 채로 읽음). 사용자 결정으로 주소를 나눴고, 학생 화면에는 교사 화면 내용이 들어가지 않습니다.
- 교사 로그인: `components/TeacherLogin.tsx`(Google 팝업 로그인 → ID 토큰을 `app/api/teacher/session/route.ts`에 보냄), 서버가 `lib/teacher/server.ts`의 `checkTeacherToken`으로 firebase-admin `verifyIdToken`(비밀키 없이 projectId만) + `lib/teacher/access.ts`의 `isAllowedTeacher`(Google 확인 이메일 == `TEACHER_EMAIL`)를 검사해 허용될 때만 httpOnly 쿠키 `teacher_token`(ID 토큰, 약 1시간)을 둠. `/teacher`는 매 요청 `getSignedInTeacher()`로 다시 검사하고 아니면 로그인 화면만 보냄. 허용 안 된 계정은 안내 후 Firebase에서도 로그아웃. 쿠키가 만료되면 로그인 화면이 Firebase 로그인 기록으로 자동 재확인. 앞으로 교사 기능(API 등)도 `getSignedInTeacher()`로 확인할 것. `TeacherLogout`은 Firebase 로그아웃 + 쿠키 삭제.
- `/student`: `components/StudentApp.tsx`가 이름을 받고(빈 이름은 "이름을 입력해 주세요.") `QuizApp`으로 넘기며, QuizApp이 문제지 목록 → 풀이 → 제출(서버 채점·저장, 실패 시 "다시 시도") → 결과를 바꿔 보여줍니다. 학생용 파일 업로드 기능은 사용자 결정으로 없앴습니다.
- `components/`: `HomeScreen`(학생 문제지 목록), `QuizScreen`(이전/다음, 답을 골라야 다음으로, 마지막엔 "채점하기", 풀이 중 정답·해설 표시 금지), `ResultScreen`("처음으로", "같은 문제 다시 풀기").

## 문제지 추가하기

- 교사가 교사 화면에서 문제 파일(.json)을 올려 등록(비공개로 저장)하고 "공개하기"를 누르면 학생 목록에 나옵니다. `question-papers/` 폴더의 파일은 이제 학생 목록에 나오지 않고, 올려 볼 예시 파일로만 남겨 둠(사용자 결정, 2026-11-03).
- 사용자가 정한 사항: 앞 문제로 돌아가 답 변경 가능, 점수는 반올림 정수, 틀린 파일은 전체 거절, 첫 화면은 교사·학생 선택이고 두 화면은 주소를 나눔, 학생 파일 업로드 없음, 학생 목록은 교사가 공개한 문제지만, Firestore는 서울. PRD.md에 반영됨.

## 사용자에 대해

사용자는 개발을 모르는 일반인입니다. 아래 규칙은 사용자가 직접 정한 것이므로 반드시 지킵니다.

## 앱을 만드는 기준

- PRD.md의 요구사항을 기준으로 작업합니다.
- 지금 만들 기능(1일차)과 나중에 추가할 기능(2일차)을 구분합니다.
- 정해진 조건을 마음대로 바꾸거나 요청하지 않은 기능을 추가하지 않습니다.
- 정해지지 않은 내용이나 선택이 필요한 사항은 먼저 질문합니다.
- 기존 파일 내용과 PRD.md가 서로 다르면 임의로 결정하지 말고 사용자에게 알립니다.

### 핵심 규칙 (PRD.md 요약 — 자세한 내용은 PRD.md)

- 문제 파일: 최상위 `questions` 배열. 각 문항은 `question`, `options`(보기 4개), `correctAnswer`(1~4, 1 = `options`의 첫 번째 보기), `explanation`. 정답은 하나.
- 첫 화면 목록에서 문제지를 골라 풉니다. 문항은 코드에 넣지 않고 `question-papers` 폴더의 파일에서 읽습니다. 학생 파일 업로드는 없습니다.
- 한 문제씩 표시합니다. 풀이 중에는 정답 여부·점수·해설을 절대 보여주지 않습니다.
- 모든 문항을 완료한 뒤 한 번에, 파일에 있는 정답으로 채점합니다.
- 점수 = 정답 수 ÷ 전체 문항 수 × 100 (100점 만점, 배점 동일).
- 결과 화면에 총점·문항별 정오·해설을 표시합니다.

### 1일차 / 2일차 구분

- 1일차: 문제지 목록 표시·선택, 문항 표시, 4지선다 풀이, 완료 후 채점·결과 표시, 로컬 실행과 Vercel 배포.
- 2일차(1일차에는 구현 금지): 교사 Google 로그인·학생 게스트 입장, Azure AI 문제 생성, 문제 저장·공개·목록, Firestore 결과 저장, 교사용 학생별 점수·오답·평균 조회.
- 1일차 코드는 2일차 기능을 붙이기 쉬운 구조로 만들되, 미래 기능을 미리 구현하지 않습니다.

## 사용자에게 설명하는 방법

- 새 세션을 시작하면 먼저 1일차인지 2일차인지 물어봅니다.
- 모든 설명은 쉬운 한국어로 합니다. 개발 지식이 있어야 알 수 있는 기술용어는 쓰지 않습니다.
- 사용자가 알아야 할 것은 "무엇을 하면 되는지"와 "어떤 결과가 나오는지"입니다.
- 화면의 버튼 이름과 파일 이름은 그대로 알려주되, 설명은 쉬운 말로 합니다.
- 설치나 설정이 필요하면 이 순서로 안내합니다.
  1. 어느 화면을 열어야 하는지
  2. 무엇을 누르거나 입력해야 하는지
  3. 제대로 됐는지 무엇을 보고 확인하는지
- 사용자가 입력할 내용은 그대로 복사해서 쓸 수 있게 제공합니다.
- 여러 가지를 한꺼번에 시키지 말고 한 단계씩 순서대로 안내합니다.
- 오류가 나면 원인과 해결 방법을 쉬운 말로 설명합니다.

## 작업을 진행하는 방법

- 앱을 만들기 전에 무엇을 어떤 순서로 만들지 짧게 설명하고 사용자의 확인을 받습니다.
- 수정 후에는 무엇이 바뀌었고 사용자가 어떻게 확인하면 되는지 알려줍니다.
- 실제로 확인한 결과와 아직 확인하지 못한 부분을 구분해서 말합니다.
- 실행하거나 확인하지 않은 일을 완료했다고 말하지 않습니다.
- 앱 화면의 안내 문구와 오류 메시지도 일반인이 이해할 수 있는 쉬운 말로 작성합니다.
- 사용자가 직접 브라우저를 조작하지 않아도 되도록 CLI, MCP, Plugin 등을 최대한 활용합니다. 불가능하면 방법을 친절히 안내합니다.
- 사용자의 컴퓨터를 직접 조작하지 않습니다(화면 제어·computer use 사용 금지).
