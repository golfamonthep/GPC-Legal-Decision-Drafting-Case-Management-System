# Archive Execution UI State Machine

This document defines the client-side state machine for the Archive Execution UI component (`ArchivePreviewPanel.tsx`) located on the Records Retention page.

## States

### 1. Idle
- **Condition**: User lands on the page. No cases are selected or input field is empty.
- **UI State**: "Preview Archive Impact" button is disabled. Execution section is hidden.
- **Allowed Transitions**:
  - Enter case IDs -> transitions to **Selection Ready**.

### 2. Selection Ready
- **Condition**: User has entered one or more case IDs.
- **UI State**: "Preview Archive Impact" button is enabled (if user has `PREVIEW_ARCHIVE` permission).
- **Allowed Transitions**:
  - Click Preview -> transitions to **Preview Loading**.

### 3. Preview Loading
- **Condition**: In-flight `POST /api/records-retention/archive/preview` request.
- **UI State**: Preview button shows loading indicator. Input is disabled. Execution section is hidden.
- **Allowed Transitions**:
  - Request success -> transitions to **Preview Evaluated (Eligible/Blocked)**.
  - Request error -> transitions to **Preview Failed**.

### 4. Preview Failed
- **Condition**: Preview endpoint returned an error (e.g. 401, 403, 500) or network failed.
- **UI State**: Shows red error banner.
- **Allowed Transitions**:
  - Click Preview again -> **Preview Loading**.

### 5. Preview Evaluated (Blocked)
- **Condition**: Preview succeeded, but `eligibleCount === 0`.
- **UI State**: Shows blocked count and reasons for each case. Execution section remains hidden or execute button is disabled.
- **Allowed Transitions**:
  - Change case selection -> **Selection Ready**.

### 6. Preview Evaluated (Eligible)
- **Condition**: Preview succeeded, and `eligibleCount > 0`.
- **UI State**: Shows impact preview. Execution section (Reason, Policy Reference, Confirmation Phrase) is visible.
- **Allowed Transitions**:
  - User fills all required fields correctly -> **Confirmation Ready**.

### 7. Confirmation Ready
- **Condition**: `reason` is not empty AND `confirmationPhrase` exactly matches required Thai/English phrase (e.g., "ARCHIVE PILOT CASES" or "ยืนยันจัดเก็บสำนวน").
- **UI State**: "Execute" button is enabled.
- **Allowed Transitions**:
  - Click Execute -> **Execution Loading**.

### 8. Execution Loading
- **Condition**: In-flight `POST /api/records-retention/archive/execute` request.
- **UI State**: All inputs and buttons disabled. "Execute" button shows loading.
- **Allowed Transitions**:
  - Request success -> **Execution Success**.
  - Request error (400, 401, 403, 409, 423, 500) -> **Execution Failed**.

### 9. Execution Success
- **Condition**: Execution endpoint returned `ok: true`.
- **UI State**: Shows green success banner. Displays `archivedCount` and `archiveBatchId`. Mentions audit log recorded. Form is reset.
- **Allowed Transitions**:
  - None for this batch. User must enter new IDs to start over -> **Idle**.

### 10. Execution Failed
- **Condition**: Execution endpoint returned an error.
- **UI State**: Shows red error banner with sanitized message. If 423 (Environment Blocked), shows specific environment error. Execution button re-enabled if fields still valid.
- **Allowed Transitions**:
  - Fix inputs and Click Execute -> **Execution Loading**.

## Environment Gates
Independent of the flow above, an **Environment Status** check (`GET /api/records-retention/archive/environment`) runs on component mount.
- If `executionEnabled` is `false` (e.g., in Production):
  - The entire Execution section is replaced by a "Production Execution Disabled" warning banner.
  - Users can still run Dry-Run Previews (States 1-5), but can never transition to States 6-9.
- Destructive **delete/purge** actions do not exist in this state machine.
