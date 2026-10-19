# AI Harness Implementation Plan

Implement the user-approved provider-neutral AI harness for the GPC production analysis workflow and the local analysis app. DeepSeek V4 Pro is the default provider, AI remains disabled until a server-side key is configured, and all external requests pseudonymize known case identifiers before transmission.

## Tasks

1. Build and test the shared provider-neutral harness, pseudonymization, structured response validation, and safe error mapping.
2. Enable native `/analysis` proposals through the harness without overwriting human drafts.
3. Route legacy drafting, wording review, citation coverage, and legal QA through the harness.
4. Integrate the local `analysis-app`, environment loading, and disabled-state UI.
5. Verify tests, typecheck, lint, production build, local app build, UI detector, review, and Preview deployment with AI disabled.

## Constraints

- Preserve `OPENAI_API_KEY` for embeddings only.
- No automatic provider fallback and no web or other tools.
- No production database migration.
- No real case data in automated or live smoke tests.
- Keep the original checkout and its dirty files untouched.
