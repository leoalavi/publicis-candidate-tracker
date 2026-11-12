import { describe, expect, it } from "vitest";
import { candidateSchema, candidateUpdateSchema, getFieldErrors, isValidId, noteSchema } from "@/lib/validation";

const validInput = {
  name: "  Test Person  ",
  email: "test.person@example.com",
  phone: "",
  role: "Frontend Engineer",
  resume_text: "Two years of React experience.",
  source: "   ",
};

describe("candidateSchema", () => {
  it("accepts valid input, trims text and stores blank optional fields as null", () => {
    const result = candidateSchema.parse(validInput);

    expect(result.name).toBe("Test Person");
    expect(result.phone).toBeNull();
    expect(result.source).toBeNull();
    expect(result.stage).toBe("Applied"); // default when no stage is sent
  });

  it("accepts its own output again (the form validates, then the API validates the same data)", () => {
    // Regression test: blank optional fields become null in the browser, and
    // the API used to reject that null with "expected string, received null".
    const cleaned = candidateSchema.parse(validInput);
    expect(candidateSchema.safeParse(cleaned).success).toBe(true);
  });

  it("reports a readable error for each invalid field", () => {
    const result = candidateSchema.safeParse({ ...validInput, name: "   ", email: "not-an-email", resume_text: "" });

    expect(result.success).toBe(false);
    const errors = getFieldErrors(result.error!);
    expect(errors.name).toBe("Name is required");
    expect(errors.email).toBe("Enter a valid email address");
    expect(errors.resume_text).toBe("Resume or cover letter text is required");
  });

  it("rejects a stage that is not part of the pipeline", () => {
    const result = candidateSchema.safeParse({ ...validInput, stage: "Hired" });
    expect(result.success).toBe(false);
  });

  it("rejects phone numbers containing letters", () => {
    const result = candidateSchema.safeParse({ ...validInput, phone: "call me maybe" });
    expect(result.success).toBe(false);
  });

  it("accepts a typical formatted phone number", () => {
    const result = candidateSchema.safeParse({ ...validInput, phone: "+61 (0)491 570-006" });
    expect(result.success).toBe(true);
  });
});

describe("candidateUpdateSchema (stage changes / archiving)", () => {
  it("accepts any valid stage, in any order (no workflow rules)", () => {
    expect(candidateUpdateSchema.safeParse({ stage: "Offer" }).success).toBe(true);
    expect(candidateUpdateSchema.safeParse({ stage: "Applied" }).success).toBe(true);
  });

  it("rejects an unknown stage", () => {
    expect(candidateUpdateSchema.safeParse({ stage: "offer" }).success).toBe(false);
  });

  it("rejects an empty update", () => {
    expect(candidateUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("accepts an archive-only update", () => {
    expect(candidateUpdateSchema.safeParse({ archived: true }).success).toBe(true);
  });
});

describe("noteSchema", () => {
  it("rejects a note that is only whitespace", () => {
    expect(noteSchema.safeParse({ note_text: "   " }).success).toBe(false);
  });
});

describe("isValidId", () => {
  it("only accepts UUIDs", () => {
    expect(isValidId("6f1c2a3e-1111-4222-8333-444455556666")).toBe(true);
    expect(isValidId("123")).toBe(false);
  });
});
