# Microsoft Graph DOCX/PDF Parser Evaluation

*This document evaluates potential parser options. No library is installed or implemented in this phase.*

## Evaluation for DOCX

### Option A: `mammoth`
1. **Supported file type:** `.docx`
2. **Server-side compatibility:** Yes (Next.js Node runtime)
3. **Bundle/runtime risk:** Low
4. **Security risk:** Low (No remote execution)
5. **Extraction quality:** High for raw text
6. **Handles malformed files?** Fails safely in most cases
7. **Handles encrypted files?** Fails
8. **Exposes metadata?** Usually just raw document text
9. **Page limits support:** No native support (needs stream/length check)
10. **Length limit support:** Yes (can truncate resulting string)
11. **License/maintenance:** (Placeholder: review MIT/ISC)
12. **Recommendation:** Recommended
13. **Reason:** Lightweight, robust, well-suited for simple server-side text extraction.

### Option B: Unzip + XML text extraction
1. **Supported file type:** `.docx`
2. **Server-side compatibility:** Yes
3. **Bundle/runtime risk:** Medium (requires robust ZIP parsing)
4. **Security risk:** Medium (Zip bomb vulnerability risk)
5. **Extraction quality:** Good for raw text
6. **Handles malformed files?** Varies by ZIP parser
7. **Handles encrypted files?** Fails
8. **Exposes metadata?** Yes, easily accessible if parsing `core.xml` etc.
9. **Page limits support:** No
10. **Length limit support:** Yes
11. **License/maintenance:** (Placeholder)
12. **Recommendation:** Not recommended
13. **Reason:** Unnecessary complexity and security risks (Zip bombs) when dedicated libraries exist.

### Option C: Microsoft Graph conversion/export
1. **Supported file type:** Various Office types
2. **Server-side compatibility:** Yes (via API)
3. **Bundle/runtime risk:** None
4. **Security risk:** Low
5. **Extraction quality:** Perfect (Microsoft native)
6. **Handles malformed files?** Handled by Microsoft Graph
7. **Handles encrypted files?** Yes (if token permits)
8. **Exposes metadata?** Yes
9. **Page limits support:** Unknown
10. **Length limit support:** No native support
11. **License/maintenance:** Standard Graph API
12. **Recommendation:** Not recommended (for this phase)
13. **Reason:** Adds API complexity and potential latency. Better to process simple text locally in staging first.

## Evaluation for PDF

### Option A: `pdf-parse`
1. **Supported file type:** `.pdf`
2. **Server-side compatibility:** Yes
3. **Bundle/runtime risk:** Medium (large bundle)
4. **Security risk:** Low
5. **Extraction quality:** Good for text-layer PDFs
6. **Handles malformed files?** Can throw exceptions
7. **Handles encrypted files?** Fails unless password provided
8. **Exposes metadata?** Yes
9. **Page limits support:** Yes (can pass `max` pages)
10. **Length limit support:** Yes
11. **License/maintenance:** (Placeholder: review MIT)
12. **Recommendation:** Recommended
13. **Reason:** Simple server-side text layer extraction.

### Option B: `pdfjs-dist`
1. **Supported file type:** `.pdf`
2. **Server-side compatibility:** Yes (but complex setup for Node)
3. **Bundle/runtime risk:** High (large, complex)
4. **Security risk:** Low
5. **Extraction quality:** Excellent
6. **Handles malformed files?** Very robust
7. **Handles encrypted files?** Fails safely
8. **Exposes metadata?** Yes
9. **Page limits support:** Yes
10. **Length limit support:** Yes
11. **License/maintenance:** (Placeholder: review Apache 2.0)
12. **Recommendation:** Not recommended
13. **Reason:** Too complex and heavy for a simple staging extraction prototype.

### Option C: External OCR Service
1. **Supported file type:** Scanned `.pdf`
2. **Server-side compatibility:** N/A (External)
3. **Bundle/runtime risk:** N/A
4. **Security risk:** High (Sending sensitive data to external APIs)
5. **Extraction quality:** Varies
6. **Handles malformed files?** N/A
7. **Handles encrypted files?** N/A
8. **Exposes metadata?** N/A
9. **Page limits support:** N/A
10. **Length limit support:** N/A
11. **License/maintenance:** N/A
12. **Recommendation:** Not recommended / Out of scope
13. **Reason:** OCR is explicitly not approved in this phase.
