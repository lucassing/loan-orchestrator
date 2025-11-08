/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  listPipelines,
  createPipeline,
  getPipeline,
  updatePipeline,
} from "@/api/api";
import { useCallback, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type {
  Pipeline,
  PipelineStep,
  TerminalRule,
  PipelineFormValues,
  JSONValue,
} from "@/types";

function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

// Walk a DRF error payload and call setError for each leaf string/list of strings.
function applyDrfErrors(
  data: any,
  basePath: string,
  setError: (name: any, error: { type?: string; message?: string }) => void,
  firstPathRef: { value: string | null }
) {
  if (Array.isArray(data)) {
    if (data.length && typeof data[0] === "string") {
      const msg = data.join(" ");
      setError(basePath as any, { type: "server", message: msg });
      if (!firstPathRef.value) firstPathRef.value = basePath;
    } else {
      data.forEach((item, idx) => {
        applyDrfErrors(item, `${basePath}.${idx}`, setError, firstPathRef);
      });
    }
    return;
  }

  if (isPlainObject(data)) {
    Object.entries(data).forEach(([k, v]) => {
      const next = basePath ? `${basePath}.${k}` : k;
      applyDrfErrors(v, next, setError, firstPathRef);
    });
    return;
  }

  if (typeof data === "string") {
    setError(basePath as any, { type: "server", message: data });
    if (!firstPathRef.value) firstPathRef.value = basePath;
  }
}

function toFormValues(p: Pipeline): PipelineFormValues {
  return {
    name: p.name ?? "",
    is_active: !!p.is_active,
    description: p.description ?? "",
    steps: (p.steps ?? [])
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        order: s.order,
        step_type: s.step_type as any,
        params_text:
          typeof s.params === "string"
            ? s.params
            : JSON.stringify(s.params ?? {}, null, 2),
      })),
    terminal_rules: (p.terminal_rules ?? [])
      .sort((a, b) => a.order - b.order)
      .map((r) => ({
        order: r.order,
        condition: r.condition ?? "",
        final_status: r.final_status as any,
      })),
  };
}

function parseMaybeJSON(s: string) {
  try {
    return s.trim() ? JSON.parse(s) : {};
  } catch {
    return s;
  }
}

function toApiPayload(values: PipelineFormValues): Pipeline {
  const steps: PipelineStep[] = values.steps.map((s, i) => ({
    order: i + 1,
    step_type: s.step_type,
    params: parseMaybeJSON(s.params_text) as JSONValue | string,
  }));

  const terminal_rules: TerminalRule[] = values.terminal_rules.map(
    (r, i) => ({
      order: i + 1,
      condition: r.condition,
      final_status: r.final_status,
    })
  );

  return {
    name: values.name,
    is_active: values.is_active,
    description: values.description,
    steps,
    terminal_rules,
  };
}

function validateJsonBeforeSubmit(values: PipelineFormValues): string | null {
  for (let i = 0; i < values.steps.length; i++) {
    const txt = values.steps[i].params_text ?? "";
    try {
      if (txt.trim()) JSON.parse(txt);
    } catch {
      return `steps.${i}.params_text`;
    }
  }
  return null;
}

export function usePipelineForm(selectedId: string, setSelectedId: (arg0: string) => void) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const methods = useForm<PipelineFormValues>({
    defaultValues: toFormValues({
      name: "",
      is_active: true,
      description: "",
      steps: [],
      terminal_rules: [],
    } as Pipeline),
    shouldUseNativeValidation: false,
  });

  const { handleSubmit, reset, control, setError, setFocus } = methods;

  const stepsFA = useFieldArray({ control, name: "steps" });
  const rulesFA = useFieldArray({ control, name: "terminal_rules" });

  useEffect(() => {
    (async () => {
      setPipelines(await listPipelines());
    })();
  }, []);

  const loadPipeline = useCallback(
    async (id: string) => {
      if (!id) return;
      const p = await getPipeline(Number(id));
      reset(toFormValues(p));
    },
    [reset]
  );

  const newPipeline = useCallback(() => {
    setSelectedId("");
    reset(
      toFormValues({
        name: "",
        is_active: true,
        description: "",
        steps: [],
        terminal_rules: [],
      } as Pipeline)
    );
  }, [setSelectedId, reset]);

  const onFormSubmit = useCallback(
    async (values: PipelineFormValues) => {
      setMsg(null);
      let newPipelineId: string | null = null;

      const badJsonPath = validateJsonBeforeSubmit(values);
      if (badJsonPath) {
        setError(badJsonPath as any, {
          type: "validate",
          message: "Invalid JSON",
        });
        setFocus(badJsonPath as any);
        return;
      }

      const payload = toApiPayload(values);
      try {
        if (selectedId) {
          await updatePipeline(Number(selectedId), payload);
          setMsg("Pipeline updated.");
        } else {
          const newPipeline: Pipeline = await createPipeline(payload);
          setMsg("Pipeline created.");
          newPipelineId = String(newPipeline.id);
        }
        setPipelines(await listPipelines());

        if (newPipelineId) {
          setSelectedId(newPipelineId);
        }
      } catch (err: any) {
        const serverData = err?.response?.data;
        if (serverData && typeof serverData === "object") {
          const first = { value: null as string | null };
          applyDrfErrors(serverData, "", setError, first);
          if (first.value) setFocus(first.value as any);
        } else {
          setMsg("Error");
        }
      }
    },
    [
      selectedId,
      setSelectedId,
      setError,
      setFocus,
      setMsg,
      setPipelines,
    ]
  );

  const onSubmit = handleSubmit(onFormSubmit);

  return {
    methods,
    pipelines,
    msg,
    onSubmit,
    loadPipeline,
    newPipeline,
    stepsFA,
    rulesFA,
  };
}
