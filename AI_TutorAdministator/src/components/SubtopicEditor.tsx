// SubtopicEditor.tsx
import React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSubtopic } from "../api/supabase";
import { useAdmin } from "../store/adminStore";

const Schema = z.object({
  title: z.string().min(1),
  order_index: z.number().int().min(1),
  theory: z.string().optional(),
  rules: z.string().optional(),
});
type FormData = z.infer<typeof Schema>;

export default function SubtopicEditor() {
  const { selectedSub, updateSubtopicLocal } = useAdmin();

  const form = useForm<FormData>({
    resolver: zodResolver(Schema) as Resolver<FormData>,
    defaultValues: {
      title: selectedSub?.title ?? "",
      order_index: selectedSub?.order_index ?? 1,
      theory: selectedSub?.theory ?? "",
      rules: selectedSub?.rules ?? "",
    },
    mode: "onBlur",
  });

  React.useEffect(() => {
    form.reset({
      title: selectedSub?.title ?? "",
      order_index: selectedSub?.order_index ?? 1,
      theory: selectedSub?.theory ?? "",
      rules: selectedSub?.rules ?? "",
    });
  }, [selectedSub, form]);

  if (!selectedSub) return <div>Select a subtopic on the left to edit.</div>;

  const input: React.CSSProperties = { width: "100%", padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 12 }}>
        <div>
          <label>Title</label>
          <input {...form.register("title")} style={input} />
        </div>
        <div>
          <label>Order</label>
          <input type="number" {...form.register("order_index", { valueAsNumber: true })} style={input} />
        </div>
      </div>

      <div>
        <label>Theory</label>
        <textarea rows={6} {...form.register("theory")} style={input} placeholder="Concept explanation…" />
      </div>

      <div>
        <label>Rules</label>
        <textarea rows={4} {...form.register("rules")} style={input} placeholder="Key rules / formulas…" />
      </div>

      <button
  type="button"
  onClick={form.handleSubmit(async (values) => {
    if (!selectedSub) return;
    // Persist
    await updateSubtopic(selectedSub.id, {
      title: values.title,
      theory: values.theory ?? "",
      rules: values.rules ?? "",
    });
    alert("Saved");
  })}
  style={{
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#111827",
    color: "white",
    cursor: selectedSub ? "pointer" : "not-allowed",
    opacity: selectedSub ? 1 : 0.6,
  }}
  disabled={!selectedSub || form.formState.isSubmitting}
>
  Save Subtopic
</button>
    </div>
  );
}
