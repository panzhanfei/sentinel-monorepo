import {
  scanWithDeepSeek,
  auditWithDeepSeek,
  generateFinalReport,
  withHeartbeat,
} from '@/services';

const scan = withHeartbeat('Scanner', scanWithDeepSeek);
const audit = withHeartbeat('Auditor', auditWithDeepSeek);
const generate = withHeartbeat('Decision', generateFinalReport);

export const runChatAgents = async (message: string, publish: (agent: string, status: string, content: string) => void) => {
  // === Agent 1 ===
  publish('Scanner', 'thinking', 'Analyzing user input...');
  const r1 = await scan((chunk) => {
    publish('Scanner', 'thinking', chunk);
  }, message);

  // === Agent 2 ===
  publish('Auditor', 'thinking', 'Reviewing analysis...');
  const r2 = await audit((chunk) => {
    publish('Auditor', 'thinking', chunk);
  }, r1);

  // === Agent 3 ===
  publish('Decision', 'thinking', 'Generating final answer...');
  const r3 = await generate((chunk) => {
    publish('Decision', 'thinking', chunk);
  }, r2);

  publish('Decision', 'done', r3);

  return r3;
}
