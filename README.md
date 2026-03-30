# 담임톡 - 담임·기간제 교사 소통 메신저

담임교사가 부재 시 기간제 교사와 실시간으로 소통할 수 있는 웹 메신저입니다.

## 주요 기능

- 💬 **실시간 메시징** - Supabase Realtime 기반
- ✅ **읽음 확인** - 상대방이 메시지를 읽으면 표시
- 📎 **파일/이미지 전송** - 사진, 문서 파일 공유
- 📱 **PWA** - 홈 화면에 앱처럼 설치 가능
- 🔔 **오프라인 감지** - 인터넷 연결 상태 표시

## 설정 가이드

### 1단계: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에 가입/로그인
2. **New Project** 클릭하여 프로젝트 생성
3. **Settings > API**에서 아래 정보 복사:
   - `Project URL` → VITE_SUPABASE_URL
   - `anon public` key → VITE_SUPABASE_ANON_KEY

### 2단계: 데이터베이스 설정

1. Supabase Dashboard > **SQL Editor** 클릭
2. `supabase-schema.sql` 파일의 내용을 붙여넣고 **Run** 실행

### 3단계: Storage 설정

1. Supabase Dashboard > **Storage** 클릭
2. **New Bucket** > 이름: `chat-files` > **Public bucket** 토글 ON
3. **Policies** 탭에서:
   - New Policy > `Allow all uploads` (INSERT, policy: `true`)
   - New Policy > `Allow public reads` (SELECT, policy: `true`)

### 4단계: Realtime 확인

1. Supabase Dashboard > **Database > Replication**
2. `messages` 테이블이 활성화되어 있는지 확인
   (SQL에서 이미 설정했지만 확인 차 체크)

### 5단계: 프로젝트 실행

```bash
# 의존성 설치
npm install

# .env 파일 생성
cp .env.example .env
# .env 파일에 Supabase URL과 Key 입력

# 개발 서버 실행
npm run dev
```

### 6단계: Vercel 배포

```bash
# Vercel CLI로 배포
npx vercel

# 또는 GitHub 연동 후 자동 배포
```

**Vercel 환경변수 설정:**
- Settings > Environment Variables에서
- `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY` 추가

### 7단계: PWA 설치 (핸드폰)

1. 핸드폰 브라우저에서 배포된 URL 접속
2. **공유 > 홈 화면에 추가** (iOS Safari)
3. 또는 주소창의 **설치** 아이콘 클릭 (Android Chrome)

## 사용 방법

1. **담임교사**: "새 대화방 만들기" → 방 코드를 기간제 선생님께 공유
2. **기간제 교사**: 방 코드 입력 → 역할 선택 → 대화 시작
3. 교실 PC와 핸드폰 모두에서 같은 방 코드로 접속 가능

## 기술 스택

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Realtime + Storage)
- **PWA**: vite-plugin-pwa
- **배포**: Vercel

## PWA 아이콘 생성

`public/` 폴더에 `icon-192.png`과 `icon-512.png`을 추가하세요.
[RealFaviconGenerator](https://realfavicongenerator.net)에서
favicon.svg를 업로드하면 자동 생성됩니다.
