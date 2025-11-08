export type Status = "APPROVED" | "REJECTED" | "NEEDS_REVIEW";
export type StepType =
  | "dti_rule"
  | "amount_policy"
  | "risk_scoring"
  | "sentiment_check";

export type JSONValue =
    | string
    | number
    | boolean
    | null
    | JSONValue[]
    | { [k: string]: JSONValue };