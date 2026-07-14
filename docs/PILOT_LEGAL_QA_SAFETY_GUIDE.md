# Pilot Legal Q&A Safety Guide

## 1. Purpose of Legal Q&A
To assist Legal Officers in finding relevant jurisprudence, regulations, and legal reasoning quickly using a Retrieval-Augmented Generation (RAG) system.

## 2. What Legal Q&A Can Do
- Search through uploaded knowledge library documents.
- Summarize findings based *only* on retrieved text.
- Provide citations for the retrieved text.

## 3. What Legal Q&A Cannot Do
- Provide definitive legal rulings.
- Replace human legal analysis.
- Access external internet sources outside the uploaded library.

## 4. Source/Citation Requirement
- Every claim made by the Legal Q&A must include a citation to a specific uploaded document.

## 5. No-Source Behavior
- If the system cannot find a relevant source, it is programmed to state: "Insufficient information found in the knowledge library." It will not invent an answer.

## 6. How to Verify Answers
- Click the provided citation link.
- Read the source document in its original context.
- Confirm the AI's summary accurately reflects the source.

## 7. How to Detect Unsupported Answers
- If an answer sounds plausible but lacks a specific citation, treat it as hallucinated. Do not use it.
- **Example of Hallucination**: "Under Section 42 of the State Liability Act, you must..." with no source link, or a source link that leads to a document that does not contain "Section 42".
- **Action**: Always click the source link. If the retrieved text does not support the AI's claim, disregard the answer.

## 8. What to Do When Sources Conflict
- Escalate to manual legal review and consult senior officers. The AI cannot resolve complex legal conflicts.

## 9. What to Do When the Answer Says Insufficient Information
- Conduct manual research using traditional legal databases or upload the missing relevant documents to the Knowledge Library.

## 10. Forbidden Usage During Pilot
- Do not use the Legal Q&A to draft final official rulings without modification and verification.
- Do not copy-paste answers directly into communications with external parties.
- "No Source Found" means the query requires manual legal research outside the RAG system.

## 11. Manual Legal Review Requirement
- All outputs require manual review by a qualified Legal Officer.

## 12. Examples of Safe Questions
- "What are the criteria for an appeal under Section X based on recent rulings?"
- "Find cases similar to [Fact Pattern] involving [Subject]."

## 13. Examples of Unsafe Questions
- "Should I rule in favor of the plaintiff in Case X?" (Requires legal judgment).
- "What is the penalty for X?" (If the regulation isn't in the library, it might fail or hallucinate if guardrails fail).

## 14. Required Warning Statement for Users
**WARNING**: AI-assisted legal answers are for search and drafting support only. Users must verify all legal references, facts, and reasoning against official source documents before relying on the output.
