// Explicit live diagnostic: one tiny text request, no database or storage imports.
// Run from server: node --env-file=.env scripts/diagnose-health-ai.cjs --live
'use strict';
const { GoogleGenerativeAI } = require('@google/generative-ai');
const safeCode = value => typeof value === 'string' && /^[A-Z][A-Z0-9_]{1,60}$/.test(value) ? value : undefined;
async function main() {
  if (!process.argv.includes('--live')) throw new Error('This makes one real AI request. Pass --live only when authorized.');
  if (!process.env.GEMINI_API_KEY) { console.log(JSON.stringify({ result: 'configuration_missing', code: 'AI_UNAVAILABLE' })); process.exitCode = 1; return; }
  const originalFetch = global.fetch;
  let upstreamStatus, transportCode;
  global.fetch = async (...args) => {
    try { const response = await originalFetch(...args); upstreamStatus = response.status; return response; }
    catch (error) { transportCode = safeCode(error.cause?.code) || safeCode(error.code); throw error; }
  };
  const start = Date.now();
  let timer;
  try {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const request = client.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { maxOutputTokens: 32 } }, { timeout: 30000 }).generateContent('Reply with only OK.');
    await Promise.race([request, new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('Diagnostic timed out'), { code: 'DIAGNOSTIC_TIMEOUT' })), 31000); })]);
    console.log(JSON.stringify({ result: 'provider_reachable', model: 'gemini-2.5-flash', upstreamStatus, elapsedMs: Date.now() - start }));
  } catch (error) {
    // Never print error.message: SDK errors may include request URLs or provider details.
    const status = Number(error.status) || upstreamStatus;
    const details = Array.isArray(error.errorDetails) ? error.errorDetails : [];
    const reasons = details.map(item => safeCode(item?.reason)).filter(Boolean);
    console.log(JSON.stringify({ result: 'request_failed', model: 'gemini-2.5-flash', upstreamStatus: Number.isInteger(status) ? status : undefined, transportCode, diagnosticCode: safeCode(error.code), reasons, elapsedMs: Date.now() - start }));
    process.exitCode = 1;
  } finally { clearTimeout(timer); global.fetch = originalFetch; }
}
main().catch(() => { console.log(JSON.stringify({ result: 'diagnostic_setup_failed' })); process.exitCode = 1; });
