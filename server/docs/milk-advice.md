# Milk and feeding advice

The web Milk Reports page and mobile Milk Reports screen include an expandable **Milk & feeding advice** card. Select one cow/buffalo, answer four questions, and choose **Save & get my advice**. Saving is followed by a generation request. Existing saved routines can request advice immediately. Three personalized sections appear first: improving milk production, reducing avoidable feed costs, and what to check over the next week. Feeding summaries, charts and recorded expenses are under expandable details. Records are read from the server, independently of report-page date filters.

## Deployment

1. Back up the database and review pending migrations. Apply `20261024000000-milk-advice.js` through the existing Sequelize migration workflow (`npm run db:migrate` from `server`). This creates three additive tables: feeding-routine history, advice cache and per-user usage. **The implementation task did not run this migration.**
2. Set `GROQ_API_KEY` and `GROQ_MODEL` in the **server environment only**. Use a Groq-hosted model supporting strict structured outputs, for example `GROQ_MODEL=openai/gpt-oss-20b`, subject to your account's model permissions. Requests go to `https://api.groq.com/openai/v1/chat/completions`. No model is hardcoded; absent configuration returns `AI_NOT_CONFIGURED` while saving routines still works. Never put keys in Vite/Expo public variables. Old `XAI_*` / `GROK_*` settings are not used by this feature.
3. Restart the backend, rebuild/deploy the frontend and release the updated mobile bundle through your normal release process.
4. Test with a staging account and an explicit, budgeted provider request before production rollout. Offline tests mock the database and provider; they do not prove live credentials, quota, model availability or migration execution.

## API and behavior

All routes require user authentication and the farm experience. Every operation verifies ownership of the selected FarmerCow.

- `GET /api/milk-reports/cows/:id/advice`: latest saved routine, server-calculated facts, readiness and matching cached advice.
- `PUT /api/milk-reports/cows/:id/feeding`: validates and saves an immutable routine revision; no AI call.
- `POST /api/milk-reports/cows/:id/advice`: generates or reuses advice; the client cannot supply totals, another user's identity or a model prompt.

Routine schema: `since` (YYYY-MM-DD, not future), `calving_months` (integer 0–120 or null), `feed` (unique allowed types with positive approximate `kg` or null, optional nonnegative `price_per_kg`; other feed requires a description), `water` (yes/no/unknown), and exclusive none/unknown or multiple recent changes. Quantities are kg per animal per whole day. Unknown amounts/prices remain null. Existing routines without prices remain valid. Price-based daily costs are calculated by the server, labelled partial when any quantity/price is missing, and never added to recorded expenses. Feed descriptions are saved but not sent to Groq. Routine confirmation is required after seven days; illness/reduced appetite always takes priority. No additional migration is needed for these fields because routines and advice use existing JSONB columns.

Initial guidance is available with one record or with feeding information alone; it is labelled as initial guidance. There is no minimum-history gate on generation. The comparison uses the **last 14 completed India-calendar days**, excluding today, and is shown only with at least five individual milk-record days per seven-day window. Missing days are never zero-filled. The most recent milk entry (including today, flagged potentially incomplete) and today's individually assigned expenses also inform initial advice. Herd milk, other animals and shared expenses are excluded. Duplicate animal/date milk rows stop generation. Individual recorded cost categories and bulk purchases are shown separately. Missing costs do not imply zero costs; no calculated profit or cost-per-litre claim is made.

Groq now writes an action and a reason for each of `milk`, `feed_cost`, and `next_week` in the requested English, Marathi or Hindi language. It links each section to allowed evidence IDs; the client displays the associated actual inputs separately. These are personalized explanations, not selections from a predefined tip catalogue. The schema and server validation enforce section structure, evidence IDs, text lengths, and reject generated numerals, URLs/HTML and selected unsafe terms. The prompt prohibits diagnoses, medicine/supplement doses, ration amount changes, invented nutrient deficiencies, guaranteed gains and predicted savings. These controls reduce risk but do not guarantee the correctness of free-form advice or catch every unsafe statement. Guidance is not a veterinary treatment or a professionally certified ration plan; obtain veterinary/nutrition review before production use as a precise ration tool.

Cache keys include owner/animal, model, policy version, language, routine revision and calculated facts/date window. Changed inputs invalidate advice; old ID-only advice is not reused by this version. GET uses `?language=en|mr|hi`; PUT/POST accept `language` in the body. Deploy the updated web/mobile clients with this backend response contract. Records are checked again after generation. An account-level database lease prevents simultaneous provider calls across server instances, expires after 60 seconds, and is released after failures. Ten generation attempts per user/India-calendar day (including failed attempts); cached reads are free. HTTP burst limiting is additional and process-local. Provider timeout: 25 seconds; client generation timeout: 45 seconds. No automatic paid retries.

Provider requests exclude names, tags, addresses, contact information and free-text descriptions/notes. No raw provider error/configuration is logged or returned. Review the chosen provider account's retention and data-processing terms before launch.

## Checks

Run `node --preserve-symlinks --preserve-symlinks-main --test scripts/test-milk-advice.cjs` from `server`. Tests use synthetic records and stubbed persistence/provider responses. They cover ownership, missing data, cost treatment, validation, cache invalidation, lease/limits, failure handling, changed inputs and translation parity.

Provider schema reference: https://console.groq.com/docs/structured-outputs
General ration context: https://www.nddb.org/services/animalnutrition/programmes/ration-balancing-programme
