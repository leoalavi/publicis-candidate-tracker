# AI Usage Log

I used Claude Code as an AI-assisted development tool throughout this project to help with implementation, debugging, testing, and code review.

My focus was on defining the requirements, choosing an appropriate technical approach, reviewing the implementation, and deciding which suggestions to accept or change. I prioritised keeping the application simple, reliable, and easy to understand.

Below are six examples of how AI assistance was used and how the implementation evolved.

## 1. Choosing a simpler technology stack

**Initial approach:** Claude proposed using Prisma, SQLite, and Next.js Server Actions.

**Decision:** I decided to use Supabase PostgreSQL, Next.js Route Handlers, and standard React state instead. Claude updated the implementation to follow that approach.

**Reason:** I was already familiar with these technologies and wanted to avoid introducing unnecessary complexity. This also made the application easier to maintain and explain.

## 2. Fixing optional-field validation

**Issue:** During browser testing, creating a candidate with an empty optional field failed because the API received `null` where the Zod schema expected a string.

**Resolution:** The validation logic was updated to accept nullable optional fields using `.nullish()`. A regression test was also added to cover the issue.

**Lesson:** A passing unit test does not always represent how data behaves across the full application. Testing the complete flow helped identify a problem that the initial tests missed.

## 3. Improving AI summary accuracy

**Initial approach:** The summarisation prompt required summaries between 80 and 120 words.

**Issue:** When processing short resumes, Gemini sometimes added descriptions or implied skills that were not supported by the original text.

**Decision:** I requested a review of the summarisation logic. The prompt was changed to allow summaries of up to 120 words without requiring a minimum length. It also explicitly discourages unsupported skills, assumptions, and exaggerated descriptions.

**Result:** In the final live test, a short three-sentence resume produced a concise 24-word summary without unsupported details. However, the Gemini model had also been changed, so I couldn't confirm whether the improvement came from the revised prompt, the new model, or both.

**Lesson:** Clear AI instructions should prioritise factual accuracy over a fixed output length.

## 4. Improving API error handling

**Issue:** The initial error handling returned a generic retry message for several Gemini API failures, including invalid API credentials.

**Resolution:** A targeted test identified that an invalid API key produced a misleading message. The error handling was updated to distinguish configuration problems from temporary service failures, and an automated test was added.

**Reason:** Error messages should help identify the actual problem. Asking users to retry an invalid API key would not resolve the issue.

## 5. Testing against prompt injection

**Initial approach:** The AI integration separated trusted instructions from resume content and included automated tests using a mocked Gemini response.

**Decision:** I requested additional tests against the actual Gemini API because mocked tests cannot confirm how a real language model responds to malicious instructions.

One fictional resume included an instruction asking the model to ignore previous rules and recommend hiring the candidate immediately.

**Result:** In the live test, Gemini ignored the embedded instruction and generated a factual summary instead.

**Limitation:** These results demonstrate the behaviour observed during testing, but do not guarantee protection against every prompt-injection technique.

## 6. Selecting a practical Gemini model

**Initial approach:** The application used `gemini-3.6-flash`.

**Issue:** The free-tier quota was exhausted during testing, preventing further live verification before the submission deadline.

**Decision:** I chose to switch to `gemini-3.5-flash-lite` rather than enable paid billing or delay testing.

**Result:** Claude updated the model configuration, and three live tests were completed using the model configured in the final application.

**Reason:** This allowed the AI feature to be tested end to end without additional cost, while keeping the implementation straightforward.

---

Overall, Claude Code helped accelerate implementation and testing, while the development process involved reviewing suggestions, identifying problems, making technical decisions, and verifying the resulting behaviour. The main priority was to deliver a working full-stack application with clear engineering choices rather than unnecessary complexity.
