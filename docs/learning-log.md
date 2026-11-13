# Learning Log: Zod

## Why I Chose Zod

Zod is a TypeScript validation library that checks data while an application is running. TypeScript helps catch type errors during development, but it cannot validate information submitted by users at runtime.

I hadn't used Zod before, and this project needed input validation, so it was a practical choice for the unfamiliar-tool requirement.

## How Zod Is Used in the Project

The validation rules are kept in `src/lib/validation.ts` and reused in both the candidate form and the API routes.

The frontend uses them to show useful error messages, while the backend validates incoming data before saving it to Supabase. Zod also validates the structured JSON returned by Gemini.

For example:

```typescript
const candidateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.string().trim().min(1, "Role is required"),
});

const result = candidateSchema.safeParse(body);

if (!result.success) {
  // Return validation errors to the client.
}
```

Here, `z.object()` defines the expected data structure, `z.string()` requires text, and `.trim()` removes surrounding spaces. The `.min(1)` rule prevents empty values.

`safeParse()` checks the input without throwing an exception. It returns either validated data or information about what failed.

## What I Read

I looked into Zod's basic validation features, including object schemas, string validation, `safeParse()`, and handling optional fields. I also reviewed how these features are used in `validation.ts`, particularly the difference between `.optional()` and `.nullish()`, which became important when handling empty form fields.

## What I Learned and Found Challenging

One useful distinction was that **optional, empty, and null values are not the same thing**.

During development, blank optional fields such as phone and source were converted to `null`. However, the original schema used `.optional()`, which accepts `undefined` but not `null`.

This caused candidate creation to fail even though the initial unit tests passed.

The validation was updated to use `.nullish()`, allowing both `undefined` and `null`. A regression test was also added to cover the actual data sent by the form.

Another detail worth understanding is the difference between Zod versions. This project uses Zod 4, which supports methods such as `z.email()` and `z.flattenError()`. Some older examples use different syntax, so checking the version matters.

## What I Would Tell Another Developer

- Keep validation rules in one place so the frontend and backend stay consistent.
- Always validate data on the server, even when the form already validates it.
- Use `safeParse()` to handle invalid input without unexpected exceptions.
- Test transformed values, not just the original input.
- Check library versions before using examples from documentation or AI suggestions.

## Takeaway

Zod was a useful addition because it made validation easier to read and maintain without adding much complexity. The optional-field issue also showed why checking data across the full application matters, even when individual unit tests are passing.
