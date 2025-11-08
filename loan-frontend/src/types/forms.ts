import type { Status, StepType } from "./domain";

export type FormStep = {
  order: number;
  step_type: StepType;
  params_text: string;
};

export type FormRule = {
  order: number;
  condition: string;
  final_status: Status;
};

export type PipelineFormValues = {
  name: string;
  is_active: boolean;
  description: string;
  steps: FormStep[];
  terminal_rules: FormRule[];
};
