import axios from "axios";
import type { Application, Pipeline, PipelineRun } from "@/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

// Applications (read-only for UI, as per exercise)
export async function listApplications(): Promise<Application[]> {
  const { data } = await api.get("/applications/");
  return data;
}

// Pipelines
export async function listPipelines(): Promise<Pipeline[]> {
  const { data } = await api.get("/pipelines/");
  return data;
}

export async function createPipeline(payload: Pipeline): Promise<Pipeline> {
  const { data } = await api.post("/pipelines/", payload);
  return data;
}

export async function getPipeline(id: number): Promise<Pipeline> {
  const { data } = await api.get(`/pipelines/${id}/`);
  return data;
}

export async function updatePipeline(
  id: number,
  payload: Partial<Pipeline>
): Promise<Pipeline> {
  const { data } = await api.put(`/pipelines/${id}/`, payload);
  return data;
}

export async function deletePipeline(id: number): Promise<void> {
  await api.delete(`/pipelines/${id}/`);
}

// Run trigger
export async function runPipeline(application_id: number, pipeline_id: number) {
  const { data } = await api.post("/run/", { application_id, pipeline_id });
  return data as {
    message: string;
    application_id: number;
    pipeline_id: number;
  };
}

// Runs
export async function listRuns(): Promise<PipelineRun[]> {
  const { data } = await api.get("/runs/");
  return data;
}

export async function getRun(id: number): Promise<PipelineRun> {
  const { data } = await api.get(`/runs/${id}/`);
  return data;
}

export { api };
