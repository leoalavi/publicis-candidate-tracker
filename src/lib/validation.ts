import { z } from "zod";
import { STAGES } from "./types";

// Validation rules, written with Zod. The same schemas are used:
//  - in the browser, to show errors before submitting the form
//  - in the API routes, so bad data can never reach the database
// (Server-side validation is the one that really matters: anyone can call
// the API directly and skip the browser checks.)

const MAX_RESUME_LENGTH = 50_000;

// Turns "" or "   " into null, so optional fields are stored as NULL, not "".
// .nullish() accepts a missing value OR null. Null matters: the form validates
// in the browser first (turning "" into null) and then sends THAT to the API.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .nullish()
    .transform((value) => (value ? value : null));

export const candidateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  phone: optionalText(20).refine(
    (value) => value === null || /^[0-9+()\-\s]{6,20}$/.test(value),
    "Phone can only contain digits, spaces, +, -, ( and )",
  ),
  role: z.string().trim().min(1, "Role is required").max(100, "Role is too long"),
  resume_text: z
    .string()
    .trim()
    .min(1, "Resume or cover letter text is required")
    .max(MAX_RESUME_LENGTH, `Resume text must be ${MAX_RESUME_LENGTH} characters or fewer`),
  stage: z.enum(STAGES, "Choose a valid stage").default("Applied"),
  source: optionalText(100),
});

// PATCH /api/candidates/[id] can change the stage, the archived flag, or both.
export const candidateUpdateSchema = z
  .object({
    stage: z.enum(STAGES, "Choose a valid stage").optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => data.stage !== undefined || data.archived !== undefined, {
    message: "Nothing to update: send a stage and/or archived value",
  });

export const noteSchema = z.object({
  note_text: z.string().trim().min(1, "Note cannot be empty").max(5000, "Note is too long"),
});

// Database IDs are UUIDs. Checking this first lets us return a clean 404
// instead of a confusing database error for URLs like /candidates/abc.
export function isValidId(id: string): boolean {
  return z.uuid().safeParse(id).success;
}

// Converts a Zod error into { fieldName: "first error message" },
// which is easy to show next to each form field.
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error);
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    const list = messages as string[] | undefined;
    if (list && list.length > 0) result[field] = list[0];
  }
  if (flat.formErrors.length > 0) result.form = flat.formErrors[0];
  return result;
}

export type CandidateInput = z.infer<typeof candidateSchema>;
