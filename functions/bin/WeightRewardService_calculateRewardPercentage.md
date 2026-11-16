# Function: `WeightRewardService.calculateRewardPercentage`

- **Module / File**: `packages/bin-backend/src/services/weight-reward.service.ts`
- **Component**: `Collection Bin Reward Calculation Engine`
- **Author / Agent**: `Antigravity`
- **Date Created**: `2026-11-11`

---

## 1. Why Was This Function Added? (Rationale)
Implements the business rule converting measured diaper mass into an earned discount percentage. Enforces minimum mass requirements (50g threshold to filter non-diaper debris) and applies a safe mathematical ceiling (25% maximum discount per individual diaper) to protect business margins.

## 2. Importance & Criticality
- **System Role**: Mathematical rule engine determining the customer's financial reward.
- **Impact of Failure**: Issuing 0% discount on valid diapers or issuing runaway discounts ($>25\%$).

## 3. Function Signature & Contracts

```typescript
public calculateRewardPercentage(weightGrams: number): number
```

### Parameters
| Name | Type | Required | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `weightGrams` | `number` | Yes | Mass measured by the load cell in grams | Must be $\ge 50\text{g}$ |

### Return Value
- **Type**: `number` (Percentage value between `5.0` and `25.0`).

### Thrown Exceptions
- `ValidationError`: When weight is below the $50\text{g}$ qualification threshold.

---

## 4. Pipeline Integration & Connection

### Upstream Callers & Data Source
- **Trigger**: Weighing phase completed.
- **Caller**: `WeightRewardService.processDisposalAndIssueReward()`

### Downstream Targets & Consumers
- **Next Stage**: Embedded into `Reward` document and printed onto physical receipt.

### Integration Flow Diagram
```mermaid
flowchart LR
    A["Measured Weight (grams)"] --> B["WeightRewardService.calculateRewardPercentage()"]
    B -->|Check Threshold (>= 50g)| C["5% Base + 1% per 50g"]
    C -->|Cap at 25% Max| D["Final Percentage Discount"]
```

---

## 5. Memory Alignment & Resource Optimization
- Pure function with constant time arithmetic execution.
- **Time Complexity**: $O(1)$.
- **Space Complexity**: $O(1)$.

