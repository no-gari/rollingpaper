# 정희님께, 마음을 모아

김정희 책임님의 육아휴직을 응원하는 팀 롤링페이퍼.
**Next.js App Router + Neon PostgreSQL + Vercel** 구성입니다.
긴 편지(최대 1만 자), 편지지 색상, 기기 내 초안 저장, 검색, A4 인쇄/PDF를 지원합니다.

## 1. Neon 준비

1. Neon에서 프로젝트/데이터베이스를 만듭니다.
2. Connect에서 Node.js 연결 문자열을 복사합니다. SSL 옵션을 유지하세요.
3. 아래 환경변수를 로컬의 .env.local 또는 Vercel 프로젝트에 등록합니다.
   연결 문자열은 서버에서만 사용하며 브라우저로 전달하지 않습니다.

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
BOARD_SLUG=jeonghui
```

Neon Vercel Marketplace 연동을 사용한다면 주입된 DATABASE_URL을 사용하면 됩니다.
Preview 배포에는 별도 Neon 개발 브랜치 연결을 권장합니다.
무료 플랜의 현재 사용량/제한은 Neon 대시보드에서 확인하세요.

## 2. DB 초기화

Node.js 22.13 이상에서:

```sh
npm ci
cp .env.example .env.local
# .env.local의 DATABASE_URL을 실제 값으로 변경
npm run db:migrate
npm run dev
```

Windows PowerShell에서는 cp 대신 Copy-Item .env.example .env.local을 사용할 수 있습니다.

마이그레이션은 파일별 트랜잭션으로 실행하고 schema_migrations에 체크섬을 기록합니다.
다시 실행하면 적용한 파일은 건너뜁니다. 적용한 SQL을 수정하지 말고 다음 번호의 SQL을 추가하세요.
동일 DB에 대한 마이그레이션은 한 번에 한 프로세스만 실행합니다.
Vercel 배포에서는 vercel.json의 빌드 명령이 마이그레이션을 먼저 실행합니다. 실패하면 배포를 중단합니다. 웹 요청 중에는 마이그레이션하지 않습니다.

## 3. Vercel 배포

1. no-gari/rollingpaper 저장소를 Import 합니다.
2. Framework Preset: Next.js, Root Directory: 저장소 루트.
3. Build Command와 Output Directory는 기본값을 사용합니다. 저장소의 vercel.json이 DB 마이그레이션 후 Next.js 빌드를 실행합니다. 기존 Build Command Override가 있다면 끄세요.
4. Node.js 22.x 이상을 선택합니다.
5. Production에 DATABASE_URL, BOARD_SLUG=jeonghui를 등록합니다.
6. 배포합니다. 테이블 생성과 기본 롤링페이퍼 준비는 자동으로 실행되므로 SQL Editor나 터미널 작업이 필요 없습니다.
7. 편지 작성 후 새 브라우저에서 조회하고 인쇄 미리보기를 확인합니다.

DB 연결 문자열은 NEXT_PUBLIC_ 접두사를 붙이거나 Git에 커밋하지 마세요.
Vercel 배포 시 Neon 연결 정보가 없거나 DB 준비에 실패하면 빌드를 중단합니다. Neon을 연결한 후 Redeploy 하면 됩니다. 로컬 npm run build는 DB 없이도 가능합니다.
이 저장소는 Vercel을 기준으로 전환되었으며 이전 Cloudflare Sites 배포를 갱신하지 않습니다.

## DB 설계

| 테이블 | 필드 | 목적 |
| --- | --- | --- |
| boards | id (UUID PK), slug (UNIQUE), recipient_name, title, accepting_letters, created_at | 롤링페이퍼와 작성 마감 상태 |
| letters | id (UUID PK), board_id (FK), author_name, body, paper_color, created_at | 편지 본문과 표시 정보 |
| schema_migrations | name (PK), checksum, applied_at | 적용한 SQL 기록 |

boards 1 : N letters.
작성자명 1~40자, 본문 1~10,000자, 색상 cream/pink/sage는 DB CHECK로 검증합니다.
board_id 외래키는 편지가 있는 롤링페이퍼의 실수 삭제를 막습니다.
letters(board_id, created_at DESC, id DESC) 인덱스로 롤링페이퍼별 최신순 조회를 처리합니다.
시간은 timestamptz(UTC)로 저장하고 화면에는 한국 시간으로 표시합니다.
SQL은 파라미터 바인딩을 사용하며 Neon HTTP 드라이버로 서버에서만 실행합니다.

현재 화면의 수신인/제목은 정희님용으로 고정입니다. 다른 보드로 재사용할 때는
DB의 보드 추가 및 BOARD_SLUG 변경과 함께 화면 문구도 변경하세요.

### 작성 마감

Neon SQL Editor에서 실행합니다. 이미 받은 편지는 계속 조회/인쇄됩니다.

```sql
UPDATE boards SET accepting_letters = false WHERE slug = 'jeonghui';
```

재개는 false를 true로 바꾸면 됩니다.
현재 API는 로그인 없이 해당 페이지를 방문한 사람이 읽고 작성하는 구조입니다.
Vercel 배포 URL이 공개되어 있다면 링크를 받은 사람이 다른 사람에게 전달할 수도 있습니다.
팀 전용 접근이 필요하면 별도 인증 또는 배포 접근 제한을 구성해야 합니다.
편지 수정/삭제 API는 제공하지 않습니다. 필요한 정리는 DB 관리자가 수행합니다.
초안은 브라우저 localStorage에만 있으며 최종 제출된 편지만 DB에 저장됩니다.

## 확인

```sh
npm run test:db
npm run build
```

test:db는 PGlite의 실제 PostgreSQL 엔진으로 테이블 생성, 1만 자 저장, 길이/색상/외래키 제약,
롤링페이퍼 간 분리, 따옴표 입력, 작성 마감, 보드 삭제 방지를 검증합니다.
Neon 원격 접속 검증은 실제 DATABASE_URL 등록 후 별도로 수행해야 합니다.

이전 R2에 저장된 편지는 자동 이관되지 않습니다.
이전 사이트에서 실제 편지를 수집했다면 Neon으로 전환하기 전에 내보내기/이관이 필요합니다.

참고: https://neon.com/docs/serverless/serverless-driver
참고: https://vercel.com/marketplace/neon/neon

## 작성 화면과 결과 화면

- / : 쪽지 작성과 전달 현황. 공개 조회 및 제출 응답은 ID/색상/날짜만 포함합니다.
- /result : 작성자/전체 본문 조회 및 인쇄. 기본 화면에는 이 경로로 가는 링크가 없습니다.
- 결과 페이지에는 noindex/nofollow를 지정합니다. 이는 인증이 아닙니다.
- 의도적으로 비밀번호 없이 주소만으로 접근합니다. /result 또는 /api/result를 아는 사람은 누구나 읽을 수 있습니다.
- 제출 후 수정/삭제 API는 없으며 PATCH/PUT/DELETE 요청은 지원하지 않습니다.
