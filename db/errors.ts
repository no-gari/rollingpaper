export function databaseFailure(error: unknown, operation: 'load' | 'save') {
  const candidate = error && typeof error === 'object' ? error as {code?: unknown} : {};
  const code = typeof candidate.code === 'string' ? candidate.code : 'UNKNOWN';
  const incident = crypto.randomUUID().slice(0, 8);
  // Log only a SQLSTATE/configuration code, never query text, letter text or credentials.
  console.error('rollingpaper_database_failure', {operation, code, incident});
  let message = operation === 'save'
    ? '저장하지 못했어요. 작성한 글은 그대로 있으니 다시 시도해 주세요.'
    : '편지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
  if (code === 'DATABASE_URL_MISSING')
    message = 'DB 연결 설정이 필요해요. Vercel의 DATABASE_URL을 확인하고 다시 배포해 주세요.';
  if (code === '42P01')
    message = 'DB 테이블이 아직 준비되지 않았어요. 연결된 Neon DB에 테이블 생성 SQL을 실행해 주세요.';
  if (code === '42703')
    message = 'DB 테이블 구조가 코드와 달라요. 연결된 DB의 스키마를 확인해 주세요.';
  return Response.json({error:message, reference:incident}, {status:503, headers:{'Cache-Control':'no-store'}});
}
