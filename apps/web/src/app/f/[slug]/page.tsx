"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  FieldInput,
  isFieldVisible,
  type RendererField,
} from "@/components/field-renderer";

type PublicForm = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  fields: RendererField[];
};

function fireTrackEvent(formId: string, sessionId: string, eventType: string, duration?: number) {
  trpc.public.trackEvent.mutate({ formId, sessionId, eventType: eventType as 'view' | 'start' | 'complete', duration }).catch(() => {});
}

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<PublicForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sessionId = useMemo(
    () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const fetchForm = useCallback(async () => {
    try {
      const result = await trpc.public.getFormBySlug.query({ slug });
      setForm(result as PublicForm);
    } catch {
      setError("This form is not available.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const pageLoadTime = useRef(Date.now());
  const startFired = useRef(false);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  useEffect(() => {
    if (!form) return;
    fireTrackEvent(form.id, sessionId, "view", 0);
  }, [form, sessionId]);

  useEffect(() => {
    if (!form || startFired.current) return;
    function handleInteraction() {
      if (startFired.current || !form) return;
      startFired.current = true;
      fireTrackEvent(form.id, sessionId, "start", Date.now() - pageLoadTime.current);
    }
    document.addEventListener("click", handleInteraction);
    document.addEventListener("keypress", handleInteraction);
    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keypress", handleInteraction);
    };
  }, [form, sessionId]);

  function updateField(fieldId: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);

    const visibleData: Record<string, unknown> = {};
    for (const field of form.fields) {
      if (isFieldVisible(field, formData) && formData[field.id] !== undefined) {
        visibleData[field.id] = formData[field.id];
      }
    }

    try {
      await trpc.public.submitResponse.mutate({
        slug,
        data: visibleData,
        sessionId,
      });
      fireTrackEvent(form.id, sessionId, "complete", Date.now() - pageLoadTime.current);
      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-page font-sans min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-xl px-6">
          <div className="h-8 bg-slate-100 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
          <div className="h-20 bg-slate-100 rounded-2xl mt-6" />
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-20 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="bg-page font-sans min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DoveIcon className="w-8 h-8 text-label" />
          </div>
          <h2 className="text-lg font-bold text-heading mb-2">
            Form not available
          </h2>
          <p className="text-sm text-body max-w-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-page font-sans min-h-screen flex items-center justify-center">
        <div className="text-center px-6 animate-fade-in-up">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-heading mb-2">Thank you!</h2>
          <p className="text-sm text-body max-w-sm mx-auto">
            Your response has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="bg-page font-sans min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-md">
              <DoveIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-heading text-sm tracking-tight">
              PigeonForm
            </span>
          </div>
          <h1 className="text-2xl font-bold text-heading mb-1">{form.title}</h1>
          {form.description && (
            <p className="text-sm text-body">{form.description}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-error font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {form.fields.map((field) => {
            if (!isFieldVisible(field, formData)) return null;
            return (
              <div
                key={field.id}
                className="bg-surface rounded-2xl border border-border-card p-5"
              >
                <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-2 ml-1">
                  {field.label}
                  {field.required && (
                    <span className="text-error ml-0.5">*</span>
                  )}
                </label>
                <FieldInput
                  field={field}
                  value={formData[field.id]}
                  onChange={(val) => updateField(field.id, val)}
                />
              </div>
            );
          })}

          <button
            type="submit"
            disabled={submitting}
            className="pill-button dark-btn w-full py-3 font-bold text-sm mt-4"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

function DoveIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
    >
      <path d="M160.8 96.5c14 17 31 30.9 49.5 42.2c25.9 15.8 56.2 27.1 89.8 27.1c34.1 0 56.4-9.5 76.1-18.6l.2-.1c19-8.8 36.7-17 59.6-17c35.3 0 66.3 20.3 82.4 38.1c8 8.8 13.8 17.6 17.4 24.2c1.8 3.3 3.1 6.1 3.9 8.2c.4 1 .7 1.8 .8 2.3l.2 .6 0 .2 0 .1 0 0 0 0s0 0-39.9 12.1l39.9-12.1c4.1 13.4-.6 27.8-11.6 35.8L384 288l-66.7 53.3L256 448l-56-64-64 32-48-80L0 304l96-112 32-48 32.8-40.5zM256 192a32 32 0 1 0 0-64 32 32 0 1 0 0 64z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
