# Test Desk

A static, JSON-driven test website with an optional OpenAI-powered grader.

## Local preview

The GitHub Pages version discovers tests from `tests/index.json`. Because browsers restrict `fetch()` from a `file://` page, serve this folder locally (for example, `python3 -m http.server 8000`) and open `http://localhost:8000`. You can also open `index.html` directly and load a test JSON with the file picker; JSON-relative images are intended for the hosted/server preview.

The sample test is `tests/unit-2-shopping/test.json`. Its custom SVG illustrations live beside it in `tests/unit-2-shopping/images/`. The learner's source photos are not included: they contain a name, handwriting, and grades. The sample art is newly drawn for this demo.

## Test catalog and images

Add a test folder beneath `tests/`, put its JSON and image files in that folder, and add an entry to `tests/index.json`:

```json
{
  "tests": [
    { "id": "unit-2-shopping", "title": "Unit 2 · Shopping", "file": "unit-2-shopping/test.json" }
  ]
}
```

Images are referenced relative to that test's JSON file. Add `"image": { "src": "images/picture.svg", "alt": "A short description" }` to a question, or `"images": [...]` to a section. The page resolves these paths against the selected JSON file, so each test remains self-contained in its folder.

Each question requires a unique `id`, `prompt`, and `type` (`text`, `textarea`, or `choice`). For local answer-key checking, add either an `answer` string or an `accepted` array. Choice questions also need an `options` array. Optional fields include `points`, `explanation`, `rubric`, and `review: "codex"` for responses that should be manually reviewed when the API is not configured.

## Grading and data flow

Without a grader endpoint, the page checks answers against the JSON answer key locally. With the endpoint configured, the page sends the test text, answer key/rubric, and the learner's answers to the Worker. The Worker calls the OpenAI Responses API with structured output and returns per-question correctness, score, correction, and feedback. The UI highlights each answer and calculates the total. Images are displayed by the browser and are not sent to the evaluator. The page does not retain submissions after it is closed.

The site does not connect to this Codex chat or use the user's Codex sign-in. The grader uses an OpenAI API project key, which must stay in the server-side Worker secret store. API usage may incur charges. The Worker sets `store: false`, limits request size/question count, checks the allowed site origin, and applies a basic per-IP rate limit. Cloudflare's built-in limiter is approximate; configure an API project spending limit and monitor usage before sharing the site widely.

## Deploy

### GitHub Pages

The workflow in `.github/workflows/pages.yml` publishes the repository root on pushes to `main`. In the new GitHub repository, enable Pages with **GitHub Actions** as the build and deployment source. The public page URL will be `https://gprzybycien.github.io/<repository-name>/`.

### OpenAI grading Worker

The backend is a separate Cloudflare Worker in `api/`. From that folder:

1. Log in to Wrangler and deploy the Worker: `npx wrangler login`, then `npx wrangler deploy`.
2. Set the API key as a Worker secret: `npx wrangler secret put OPENAI_API_KEY`.
3. Check `ALLOWED_ORIGIN` in `api/wrangler.toml`. It must match the Pages origin exactly (for this account, `https://gprzybycien.github.io`).
4. Set `evaluatorEndpoint` in `site-config.json` to the Worker's HTTPS URL ending in `/evaluate` and push the change.

Keep the API key out of the repository, `site-config.json`, and browser code. The default `site-config.json` leaves AI grading off until a Worker URL is set. If using a repository name other than `english-test-runner`, the Pages origin remains the same account origin. For a custom domain, update `ALLOWED_ORIGIN` and redeploy the Worker.

## Source notes

The sample uses clearly legible material from the Unit 2 sheet: shop vocabulary and adjective comparisons. Printed directions are learner-facing test instructions. The source images are not uploaded or reproduced in this sample.
