"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "./ui";
import { ApiError, apiRequest } from "@/lib/api-client";
import { STAGES, type Candidate } from "@/lib/types";
import { candidateSchema, getFieldErrors } from "@/lib/validation";

const MAX_FILE_SIZE = 200 * 1024; // 200 KB is plenty for a plain-text resume

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "",
  source: "",
  stage: "Applied",
  resume_text: "",
};

type FormValues = typeof emptyForm;

export function CandidateForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof FormValues, value: string) {
    setValues({ ...values, [field]: value });
  }

  // Reads a .txt file in the browser and puts its text into the resume box.
  // PDF / Word files are NOT supported (they need a parser), so we say so.
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setErrors({ ...errors, resume_text: "Only .txt files are supported. For PDF or Word files, copy and paste the text instead." });
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors({ ...errors, resume_text: "That file is too large (max 200 KB)." });
      event.target.value = "";
      return;
    }

    const text = await file.text();
    // Use the "previous state" form because the user may have typed while the
    // file was being read, and `values` here could be out of date.
    setValues((previous) => ({ ...previous, resume_text: text }));
    setErrors((previous) => ({ ...previous, resume_text: "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 1. Check in the browser first for quick feedback.
    const result = candidateSchema.safeParse(values);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    // 2. Send to the API (which validates again on the server).
    setIsSubmitting(true);
    setErrors({});
    try {
      const created = await apiRequest<Candidate>("/api/candidates", {
        method: "POST",
        body: JSON.stringify(result.data),
      });
      router.push(`/candidates/${created.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      setErrors({ ...apiError.fieldErrors, form: apiError.message });
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.form && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {errors.form}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="name" label="Full name" required value={values.name} error={errors.name}
          onChange={(v) => updateField("name", v)} />
        <TextField id="email" label="Email" type="email" required value={values.email} error={errors.email}
          onChange={(v) => updateField("email", v)} />
        <TextField id="phone" label="Phone (optional)" type="tel" value={values.phone} error={errors.phone}
          onChange={(v) => updateField("phone", v)} />
        <TextField id="role" label="Role applied for" required value={values.role} error={errors.role}
          placeholder="e.g. Frontend Engineer" onChange={(v) => updateField("role", v)} />
        <TextField id="source" label="Source (optional)" value={values.source} error={errors.source}
          placeholder="e.g. LinkedIn, Referral" list="source-options" onChange={(v) => updateField("source", v)} />
        <datalist id="source-options">
          <option value="LinkedIn" />
          <option value="Referral" />
          <option value="Job board" />
          <option value="Careers site" />
          <option value="Recruiter" />
        </datalist>
        <div>
          <label htmlFor="stage" className={labelClass}>Stage</label>
          <select id="stage" className={inputClass} value={values.stage}
            onChange={(e) => updateField("stage", e.target.value)}>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="resume_text" className={labelClass}>
          Resume / cover letter text <span className="text-red-600">*</span>
        </label>
        <textarea
          id="resume_text"
          rows={10}
          className={inputClass}
          value={values.resume_text}
          onChange={(e) => updateField("resume_text", e.target.value)}
          aria-invalid={Boolean(errors.resume_text)}
          aria-describedby="resume_text-help resume_text-error"
          placeholder="Paste the resume or cover letter text here…"
        />
        <div id="resume_text-help" className="mt-2 text-sm text-slate-600">
          <label htmlFor="resume_file" className="mr-2">Or upload a .txt file:</label>
          <input id="resume_file" type="file" accept=".txt,text/plain" onChange={handleFileChange} className="text-sm" />
          <p className="mt-1 text-xs text-slate-500">Plain text (.txt) only, max 200 KB. PDF and Word are not supported yet.</p>
        </div>
        <FieldError id="resume_text-error" message={errors.resume_text} />
      </div>

      <div className="flex gap-3">
        <button type="submit" className={primaryButtonClass} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add candidate"}
        </button>
        <button type="button" className={secondaryButtonClass} onClick={() => router.push("/")} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  list?: string;
};

function TextField({ id, label, value, onChange, error, type = "text", required, placeholder, list }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        list={list}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-error`}
        aria-required={required}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  );
}
