import { PipelineForm } from "@/components/PipelineForm";

export default function PipelinesPage() {
  return (
    <div className="p-4">
      <header className="mb-3">
        <h1 className="h4 fw-bold mb-1">Pipeline Builder</h1>
        <p className="text-body-secondary small mb-0">
          Add/remove/reorder steps, edit params, configure terminal rules.
        </p>
      </header>

      <section>
        <PipelineForm />
      </section>
    </div>
  );
}
