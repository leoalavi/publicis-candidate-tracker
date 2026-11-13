# Technical Write-up: Candidate Tracker

## Overview

Candidate Tracker is a full-stack web application for managing candidates through a recruitment pipeline. It was built with Next.js, React, TypeScript and Tailwind CSS, using Supabase PostgreSQL for data storage and Google Gemini for AI-assisted resume summaries.

The application runs locally and has not been deployed.

## Architecture and Design Choices

I chose Next.js because it allows the frontend and backend to be developed within a single project, keeping the structure straightforward.

- **Frontend:** Three main pages handle the candidate list, add candidate form, and candidate details. React state manages user interactions, while `fetch` communicates with the backend. Filtering and sorting happen in the browser, which is sufficient for a small dataset.
- **Backend:** Next.js Route Handlers manage API requests, database operations and AI integration. Zod validates incoming data before it is processed.
- **Database:** Supabase PostgreSQL stores candidates and their notes in two related tables. Notes are timestamped and append-only. Candidates can be archived without losing their information or permanently deleted.

This structure separates the user interface, API logic and data storage without introducing unnecessary complexity.

## AI Integration

The AI feature uses Google's official `@google/genai` SDK with `gemini-3.5-flash-lite`.

When a summary is requested, the backend retrieves the candidate's resume and sends it to Gemini. The summarisation rules are provided separately from the resume text, which is treated as untrusted input.

Gemini returns structured JSON, which is validated using Zod before the summary is saved. Each summary includes a timestamp and a SHA-256 fingerprint of the original resume. If the resume changes, the application identifies the summary as outdated.

These measures reduce the risk of prompt injection and invalid responses, but cannot guarantee complete protection.

## Security and Testing

All database and Gemini credentials remain server-side. Supabase Row Level Security is enabled, and database operations are handled through the backend API.

Authentication was intentionally excluded because it was outside the assessment scope. The application therefore uses fictional candidate data only.

The project includes **52 automated Vitest tests** covering validation, application logic, API routes and AI integration. Mocked tests verify request handling and expected behaviour without using real AI calls.

Three additional live tests were completed using Gemini with normal, short and adversarial resumes. The results were factual in those tests, and the embedded malicious instruction was not followed. However, these tests do not guarantee consistent behaviour across all inputs.

## Trade-offs and Future Improvements

I prioritised a reliable, working application over adding unnecessary features.

- Filtering and sorting are handled in the browser for simplicity, but would move to the backend for larger datasets.
- Resume uploads currently support `.txt` files. PDF and Word support would require additional text extraction.
- The AI model was changed from `gemini-3.6-flash` to `gemini-3.5-flash-lite` after the original model reached its free-tier quota.

With more time, I would add authentication, rate limiting, server-side pagination, support for more file formats and a candidate editing feature.
