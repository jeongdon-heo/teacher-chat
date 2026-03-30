-- ============================================
-- 담임톡 - Supabase 데이터베이스 스키마
-- ============================================
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. rooms 테이블
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. messages 테이블
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('teacher', 'substitute')),
  content TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 인덱스
CREATE INDEX idx_messages_room_code ON messages(room_code);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = false;

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 - 누구나 읽기/쓰기 가능 (간단한 설정)
-- ※ 프로덕션에서는 인증 기반으로 변경하세요
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (true);

-- 6. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- Storage 설정 (Supabase Dashboard에서 수동 설정)
-- ============================================
-- 1. Storage > New Bucket > "chat-files" 생성
-- 2. Public bucket으로 설정 (토글 ON)
-- 3. Policies > New Policy > "Allow all uploads"
--    - Allowed operation: INSERT
--    - Policy: true
-- 4. Policies > New Policy > "Allow public reads"
--    - Allowed operation: SELECT  
--    - Policy: true
