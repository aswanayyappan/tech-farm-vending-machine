# Change / Error Investigation Log: `CHG-YYYYMMDD-<short-slug>`

- **Change ID**: `CHG-YYYYMMDD-XXXX`
- **Component**: `Collection Bin | Vending Machine | Shared Backend | Hardware Driver`
- **Category**: `Function Added | Function Removed | Function Modified | Bug/Error Detected & Fixed`
- **Affected File(s)**: `path/to/affected/file.ts`
- **Associated Function(s)**: `functionName()`
- **Date**: `YYYY-MM-DD`
- **Status**: `Detected | In Progress | Resolved & Verified`

---

## 1. Before State
> Describe in detail the state of the codebase prior to this action.
- **Original Code / Behavior**: What was the system doing?
- **Identified Flaw / Missing Capability**: If a bug or error was detected, what triggered it? What was the error trace or vulnerability? If a new feature, what gap existed?
- **Code Snippet (Before)**:
```typescript
// Previous implementation or problematic code
```

---

## 2. Present State (Diagnosis & Plan)
> Describe what is being diagnosed, examined, or planned right now.
- **Root Cause Analysis**: Why did the error occur or why is this specific modification needed?
- **Impact Assessment**: What modules, functions, or hardware interfaces are affected?
- **Action Plan**: Exact steps taken to add, remove, or fix the function.
- **Security & Memory Review**:
  - Memory alignment / leak risk checked: `Passed | N/A`
  - Input validation & security check: `Passed | N/A`
  - Minimal dependency footprint check: `Passed | N/A`

---

## 3. After State (Implementation & Verification)
> Describe the final state of the codebase after the change was applied.
- **New Code / Resolved Behavior**: What does the code look like now? How does it behave?
- **Code Snippet (After)**:
```typescript
// New or fixed implementation
```
- **Verification & Test Results**:
  - Unit / integration test outcome
  - Edge-case verification
  - Security validation
- **Documentation Updated**:
  - Function doc added/updated in `functions/`: `[Yes/No - Link]`
  - Pipeline connection validated: `[Yes/No]`

