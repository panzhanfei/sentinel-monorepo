-- Legacy: ChatSession + ChatMessage.sessionId (FK)
-- Target: ChatMessage.threadId + userId + address (matches schema.prisma)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ChatSession'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ChatMessage' AND column_name = 'sessionId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ChatMessage' AND column_name = 'threadId'
  ) THEN
    ALTER TABLE "ChatMessage" ADD COLUMN "userId" TEXT;
    ALTER TABLE "ChatMessage" ADD COLUMN "address" TEXT;
    ALTER TABLE "ChatMessage" ADD COLUMN "threadId" TEXT;

    UPDATE "ChatMessage" AS cm
    SET
      "userId" = cs."userId",
      "address" = cs."address",
      "threadId" = cm."sessionId"
    FROM "ChatSession" AS cs
    WHERE cm."sessionId" = cs."id";

    ALTER TABLE "ChatMessage" ALTER COLUMN "userId" SET NOT NULL;
    ALTER TABLE "ChatMessage" ALTER COLUMN "address" SET NOT NULL;
    ALTER TABLE "ChatMessage" ALTER COLUMN "threadId" SET NOT NULL;

    ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_sessionId_fkey";
    ALTER TABLE "ChatMessage" DROP COLUMN "sessionId";

    DROP TABLE "ChatSession";
  END IF;
END $$;

-- Idempotent indexes (covers post-migrate + already-migrated DBs)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ChatMessage') THEN
    CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_createdAt_idx" ON "ChatMessage" ("threadId", "createdAt");
    CREATE INDEX IF NOT EXISTS "ChatMessage_userId_createdAt_idx" ON "ChatMessage" ("userId", "createdAt");
  END IF;
END $$;
