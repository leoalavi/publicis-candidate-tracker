# Deployment Design

This application currently runs locally and has not been deployed. The following design outlines how it could be hosted for a small recruitment team using AWS and the existing Supabase database.

## Architecture

```text
Recruiter's Browser
        |
       HTTPS
        |
        v
AWS Amplify Hosting (Sydney)
  - Next.js frontend
  - API routes
  - HTTPS and CDN
        |
        +----------------------+
        |                      |
        v                      v
Supabase PostgreSQL       Google Gemini API
(AWS Sydney region)       (gemini-3.5-flash-lite)
```

AWS Amplify would connect to the GitHub repository and build the application whenever changes are pushed to the main branch. Application logs could be monitored through Amazon CloudWatch.

## Services and Design Choices

- **AWS Amplify Hosting:** Hosts the Next.js frontend and backend API routes. I chose this approach because it avoids managing a separate server and simplifies deployment.
- **Supabase PostgreSQL:** Keeps the existing database integration without requiring major code changes. The Pro plan provides daily backups and avoids the inactivity pauses of the free plan.
- **Google Gemini API:** Generates candidate summaries through the existing server-side integration. A paid API tier could support higher usage, subject to quotas and billing.
- **Secrets management:** Database credentials and the Gemini API key would remain server-side. AWS Secrets Manager or an appropriately configured server-side secret mechanism could be used. The deployment configuration would need to be checked to ensure credentials are not exposed in browser files or build artifacts.

Amazon RDS for PostgreSQL is another option, but it would require changing the existing Supabase database integration. For this project, keeping Supabase is simpler.

## Estimated Monthly Cost (USD)

Assumptions: 10 recruiters, approximately 20,000 application requests, 500 AI summaries per month, and less than 1 GB of stored data.

| Service | Estimated monthly cost |
|---|---:|
| AWS Amplify Hosting | $1–5 |
| Supabase Pro (one Micro project) | $25 |
| Google Gemini API | Under $1 |
| AWS Secrets Manager (optional) | $0–1.20 |
| Amazon CloudWatch | $0–2 |
| **Estimated total** | **$27–35** |

These are approximate planning estimates, not a confirmed quote. Actual costs depend on traffic, compute usage, token consumption, billing settings and applicable free-tier allowances.

## Security and Future Improvements

Before handling real candidate information, the application would need authentication, role-based access controls and appropriate database access policies.

I would also add rate limiting to the AI endpoint, monitor errors and API usage, and review privacy requirements for sending resumes to an external AI provider.

As usage grows, server-side filtering and pagination would help keep candidate searches efficient.

The database could be hosted in Sydney, but Gemini's data-processing location and retention terms would need separate verification before using real candidate information.
