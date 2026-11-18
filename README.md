# Test Desk

A JSON-driven test site hosted with GitHub Pages. Neon provides account login and private score history. An optional server-side OpenAI evaluator returns per-answer corrections.

## Local preview

Run `npm install` once, then `npm run dev`. GitHub Pages discovers tests from `tests/index.json`; each test can keep its JSON and images together in a subfolder. The sample test is `tests/unit-2-shopping/test.json`; its illustrations are newly drawn SVGs. The learner's source photos are not included because they show a name, handwriting, and grades.

## Test catalog and images

Add a test folder beneath `tests/`, put its JSON and image files in that folder, and add an entry to `tests/index.json`:

```json
{
  "tests": [
    { "id": "unit-2-shopping", "title": "Unit 2 · Shopping", "file": "tests/unit-2-shopping/test.json" }
  ]
}
```

Catalog `file` paths are relative to the site root. Images are referenced relative to that test's JSON file. Add `"image": { "src": "images/picture.svg", "alt": "A short description" }` to a question, or `"images": [...]` to a section. The page resolves image paths against the selected JSON file, so each test remains self-contained in its folder.

Each question requires a unique `id`, `prompt`, and `type` (`text`, `textarea`, or `choice`). For local answer-key checking, add either an `answer` string or an `accepted` array. Choice questions also need an `options` array. Optional fields include `points`, `explanation`, `rubric`, and `review: "codex"` for responses that should be manually reviewed when the API is not configured.

## Login and score history

The account panel uses Neon Managed Auth with email/password sign-in. Signed-in learners can save and view their own 20 most recent results. Results are stored in `public.test_attempts`, with row-level security policies limiting reads and writes to the authenticated user's ID. `db/schema.sql` contains the table and policies. The Neon Auth and Data API URLs in `site-config.json` are public endpoints; no database password or Neon API key belongs in the site.

Neon configuration is declared in `neon.ts`. After linking a Neon project, run `neon config apply`, then apply the history schema with `neon psql -- -v ON_ERROR_STOP=1 -f db/schema.sql`. Run `neon env pull --file .env.local` to refresh local settings; `.env.local` is ignored by Git. Set `neonAuthUrl` and `neonDataApiUrl` in `site-config.json` to the `NEON_AUTH_BASE_URL` and `NEON_DATA_API_URL` values. Add the deployed site origin to the Neon Auth trusted origins if the Console requests it.

## Grading

Without an evaluator endpoint, answers are checked against the JSON answer key in the browser. When configured, the page sends test text, answer keys/rubrics, and responses to the server-side grader. The Worker calls OpenAI's Responses API and returns per-question correctness, score, correction, and feedback. Images are displayed by the browser and are not sent to the evaluator. The site is not connected to this Codex chat or to Codex sign-in; grading requires an OpenAI API project key and may incur API usage charges.

The evaluator URL is set in `site-config.json`. Keep `OPENAI_API_KEY` in the Worker's secret store. The included Worker sets `store: false`, limits request size and question count, checks the allowed origin, and applies a per-IP rate limit.

## Deploy

### GitHub Pages

The workflow in `.github/workflows/pages.yml` builds the Vite site and publishes `dist/` on pushes to `main`. Pages is enabled for this repository at `https://gprzybycien.github.io/english-test-runner/`.

### OpenAI grading Worker

The backend is a separate Cloudflare Worker in `api/`. From that folder:

1. Log in to Wrangler and deploy the Worker: `npx wrangler login`, then `npx wrangler deploy`.
2. Set the API key as a Worker secret: `npx wrangler secret put OPENAI_API_KEY`.
3. Check `ALLOWED_ORIGIN` in `api/wrangler.toml`. It must match the Pages origin exactly (for this account, `https://gprzybycien.github.io`).
4. Set `evaluatorEndpoint` in `site-config.json` to the Worker's HTTPS URL ending in `/evaluate` and push the change.

Keep the API key out of the repository, `site-config.json`, and browser code. The default `site-config.json` leaves AI grading off until a Worker URL is set. If using a repository name other than `english-test-runner`, the Pages origin remains the same account origin. For a custom domain, update `ALLOWED_ORIGIN` and redeploy the Worker.

## Source notes

The sample uses clearly legible material from the Unit 2 sheet: shop vocabulary and adjective comparisons. Printed directions are learner-facing test instructions. The source images are not uploaded or reproduced in this sample.
