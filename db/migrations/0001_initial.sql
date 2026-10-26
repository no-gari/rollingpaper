-- The deployed site selects a board via server-only BOARD_SLUG.
-- All timestamps are UTC; the UI displays Asia/Seoul.
CREATE TABLE boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  recipient_name text NOT NULL CHECK (char_length(btrim(recipient_name)) BETWEEN 1 AND 80),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  accepting_letters boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE RESTRICT,
  author_name text NOT NULL CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 40),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 10000),
  paper_color text NOT NULL DEFAULT 'cream' CHECK (paper_color IN ('cream', 'pink', 'sage')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX letters_board_created_idx ON letters (board_id, created_at DESC, id DESC);
INSERT INTO boards (slug, recipient_name, title)
VALUES ('jeonghui', '김정희 책임님', '정희님께, 마음을 모아');
