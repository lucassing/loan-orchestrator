export type Status = "APPROVED" | "REJECTED" | "NEEDS_REVIEW";

export type Application = {
  id: number;
  applicant_name: string;
  amount: string; // decimal as string from DRF
  monthly_income: string;
  declared_debts: string;
  country: string;
  loan_purpose: string;
  status: Status;
  created_at: string;
};

export type PipelineStep = {
  id?: number;
  step_type:
    | "dti_rule"
    | "amount_policy"
    | "risk_scoring"
    | "sentiment_check"
    | string;
  order: number;
  params: Record<string, any>;
};

export type TerminalRule = {
  id?: number;
  order: number;
  condition: string;
  final_status: Status;
};

export type Pipeline = {
  id?: number;
  name: string;
  is_active: boolean;
  description?: string | null;
  steps: PipelineStep[];
  terminal_rules: TerminalRule[];
};

export type StepLog = {
  step_type: string;
  outcome: string;
  detail: Record<string, any>;
  execution_time: string;
};

export type PipelineRun = {
  id: number;
  application: number;
  pipeline: number;
  start_time: string;
  end_time: string | null;
  final_status: Status | null;
  step_logs: StepLog[];
};
