"use client";

import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { trpc, trpcWithRefresh } from "@/lib/trpc";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  FieldInput,
  isFieldVisible,
  type RendererField,
} from "@/components/field-renderer";

const FIELD_TYPES = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "date", label: "Date" },
  { value: "single_select", label: "Single Select" },
  { value: "multi_select", label: "Multi Select" },
  { value: "rating", label: "Rating" },
] as const;

type FieldType = (typeof FIELD_TYPES)[number]["value"];

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean | null;
  placeholder: string | null;
  options: string[] | null;
  position: string;
  conditionFieldId: string | null;
  conditionOperator: string | null;
  conditionValue: string | null;
};

type FormResponse = {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  sessionId: string | null;
  submittedAt: string | null;
};

type Form = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  responseLimit: number | null;
  expiresAt: string | null;
};

export default function FormEditorPage() {
  return (
    <ProtectedRoute>
      <FormEditorContent />
    </ProtectedRoute>
  );
}

function FormEditorContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("short_text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([""]);
  const [addingField, setAddingField] = useState(false);

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState<FieldType>("short_text");
  const [editRequired, setEditRequired] = useState(false);
  const [editPlaceholder, setEditPlaceholder] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>([""]);
  const [savingField, setSavingField] = useState(false);

  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});

  const [activeTab, setActiveTab] = useState<"fields" | "responses" | "insights">("fields");
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [responsesTotal, setResponsesTotal] = useState(0);
  const [responsesPage, setResponsesPage] = useState(1);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [exporting, setExporting] = useState(false);
  const responsesPageSize = 20;

  type Analytics = {
    answers: { visits: number; submissions: number; uniqueRespondents: number; avgVisitDuration: number };
    dropoffs: { started: number; completions: number; completionRate: number; avgCompletionDuration: number };
    distributions: { fieldId: string; fieldLabel: string; fieldType: string; distribution: { value: string; count: number }[] }[];
    responsesOverTime: { date: string; count: number }[];
  };
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchForm = useCallback(async () => {
    try {
      const result = await trpcWithRefresh(() =>
        trpc.form.getFormById.query({ id: formId })
      );
      setForm(result as Form);
    } catch {
      setError("Form not found");
    }
  }, [formId]);

  const fetchFields = useCallback(async () => {
    try {
      const result = await trpcWithRefresh(() =>
        trpc.field.listByForm.query({ formId })
      );
      setFields(result as Field[]);
    } catch {
      setFields([]);
    }
  }, [formId]);

  const fetchResponses = useCallback(async (page = 1) => {
    setResponsesLoading(true);
    try {
      const result = await trpcWithRefresh(() =>
        trpc.response.listByForm.query({ formId, page, pageSize: responsesPageSize })
      );
      setResponses(result.responses as FormResponse[]);
      setResponsesTotal(result.total);
      setResponsesPage(page);
    } catch {
      setResponses([]);
      setResponsesTotal(0);
    } finally {
      setResponsesLoading(false);
    }
  }, [formId, responsesPageSize]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchForm(), fetchFields()]);
      setLoading(false);
    }
    load();
  }, [fetchForm, fetchFields]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const result = await trpcWithRefresh(() =>
        trpc.analytics.getByForm.query({ formId })
      );
      setAnalytics(result as Analytics);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (activeTab === "responses") fetchResponses(1);
    if (activeTab === "insights") fetchAnalytics();
  }, [activeTab, fetchResponses, fetchAnalytics]);

  async function handleAddField(e: React.FormEvent) {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;
    setAddingField(true);
    try {
      const input: {
        formId: string;
        label: string;
        type: FieldType;
        required?: boolean;
        placeholder?: string;
        options?: string[];
      } = {
        formId,
        label: newFieldLabel.trim(),
        type: newFieldType,
      };
      if (newFieldRequired) input.required = true;
      if (newFieldPlaceholder.trim())
        input.placeholder = newFieldPlaceholder.trim();
      if (hasOptions(newFieldType)) {
        const opts = newFieldOptions.map((o) => o.trim()).filter(Boolean);
        if (opts.length > 0) input.options = opts;
      }
      await trpcWithRefresh(() => trpc.field.createField.mutate(input));
      resetAddForm();
      await fetchFields();
    } catch {
    } finally {
      setAddingField(false);
    }
  }

  function resetAddForm() {
    setNewFieldLabel("");
    setNewFieldType("short_text");
    setNewFieldRequired(false);
    setNewFieldPlaceholder("");
    setNewFieldOptions([""]);
    setShowAddField(false);
  }

  function startEditing(field: Field) {
    setEditingFieldId(field.id);
    setEditLabel(field.label);
    setEditType(field.type as FieldType);
    setEditRequired(field.required ?? false);
    setEditPlaceholder(field.placeholder ?? "");
    setEditOptions(
      field.options && (field.options as string[]).length > 0
        ? (field.options as string[])
        : [""]
    );
  }

  async function handleSaveField(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFieldId || !editLabel.trim()) return;
    setSavingField(true);
    try {
      const input: {
        id: string;
        label?: string;
        type?: FieldType;
        required?: boolean;
        placeholder?: string;
        options?: string[];
      } = {
        id: editingFieldId,
        label: editLabel.trim(),
        type: editType,
        required: editRequired,
      };
      if (editPlaceholder.trim()) input.placeholder = editPlaceholder.trim();
      if (hasOptions(editType)) {
        const opts = editOptions.map((o) => o.trim()).filter(Boolean);
        if (opts.length > 0) input.options = opts;
      }
      await trpcWithRefresh(() => trpc.field.updateField.mutate(input));
      setEditingFieldId(null);
      await fetchFields();
    } catch {
    } finally {
      setSavingField(false);
    }
  }

  async function handleDeleteField(id: string) {
    setDeletingFieldId(id);
    try {
      await trpcWithRefresh(() => trpc.field.deleteField.mutate({ id }));
      await fetchFields();
    } catch {
    } finally {
      setDeletingFieldId(null);
    }
  }

  async function handlePublish() {
    if (!form) return;
    setPublishing(true);
    try {
      await trpcWithRefresh(() =>
        trpc.form.publishForm.mutate({ id: form.id })
      );
      await fetchForm();
    } catch {
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!form) return;
    setUnpublishing(true);
    try {
      await trpcWithRefresh(() =>
        trpc.form.unpublishForm.mutate({ id: form.id })
      );
      await fetchForm();
    } catch {
    } finally {
      setUnpublishing(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/auth");
  }

  async function handleExportCsv() {
    if (!form) return;
    setExporting(true);
    try {
      let allResponses: FormResponse[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const result = await trpcWithRefresh(() =>
          trpc.response.listByForm.query({ formId, page, pageSize: 100 })
        );
        allResponses = allResponses.concat(result.responses as FormResponse[]);
        hasMore = allResponses.length < result.total;
        page++;
      }

      const fieldIds = fields.map((f) => f.id);
      const headers = ["Submitted At", ...fields.map((f) => f.label)];

      const csvRows = [headers.join(",")];
      for (const resp of allResponses) {
        const data = resp.data as Record<string, unknown>;
        const row = [
          resp.submittedAt ? new Date(resp.submittedAt).toLocaleString() : "",
          ...fieldIds.map((id) => {
            const val = data[id];
            if (val === undefined || val === null) return "";
            const str = Array.isArray(val) ? val.join("; ") : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          }),
        ];
        csvRows.push(row.join(","));
      }

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.title.replace(/[^a-z0-9]/gi, "_")}_responses.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExporting(false);
    }
  }

  function hasOptions(type: string) {
    return type === "single_select" || type === "multi_select";
  }

  function getFieldTypeLabel(type: string) {
    return FIELD_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  if (loading) {
    return (
      <div className="bg-page font-sans min-h-screen">
        <header className="border-b border-border-card bg-surface">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md">
                <DoveIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-heading text-lg tracking-tight">
                PigeonForm
              </span>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-100 rounded-lg w-1/3" />
            <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
            <div className="h-32 bg-slate-100 rounded-2xl mt-6" />
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="bg-page font-sans min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-heading mb-2">
            {error ?? "Form not found"}
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="pill-button dark-btn px-6 py-2.5 font-bold text-sm mt-4"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-page font-sans min-h-screen">
      {/* Header */}
      <header className="border-b border-border-card bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-label hover:text-heading transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md">
              <DoveIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-heading text-lg tracking-tight">
              PigeonForm
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-heading hidden sm:block">
              {user?.displayName ?? user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-body font-semibold hover:text-heading transition-colors uppercase tracking-widest"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Form Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-heading">{form.title}</h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusColor(form.status)}`}
              >
                {form.status}
              </span>
            </div>
            {form.description && (
              <p className="text-sm text-body">{form.description}</p>
            )}
            {form.status === "published" && form.slug && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/f/${form.slug}`
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-medium mt-2 transition-colors"
              >
                {copied ? (
                  <CheckIcon className="w-3.5 h-3.5" />
                ) : (
                  <ClipboardIcon className="w-3.5 h-3.5" />
                )}
                <span className="font-mono">
                  {copied ? "Copied!" : `/f/${form.slug}`}
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {fields.length > 0 && (
              <button
                onClick={() => {
                  setPreviewData({});
                  setShowPreview(true);
                }}
                className="pill-button px-5 py-2 font-bold text-sm border border-border-card text-body hover:text-heading transition-colors flex items-center gap-1.5"
              >
                <EyeIcon className="w-4 h-4" />
                Preview
              </button>
            )}
            {form.status === "draft" && (
              <button
                onClick={handlePublish}
                disabled={publishing || fields.length === 0}
                className="pill-button dark-btn px-5 py-2 font-bold text-sm"
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
            )}
            {form.status === "published" && (
              <button
                onClick={handleUnpublish}
                disabled={unpublishing}
                className="pill-button px-5 py-2 font-bold text-sm border border-border-card text-body hover:text-heading transition-colors"
              >
                {unpublishing ? "Unpublishing..." : "Unpublish"}
              </button>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 mb-6 border-b border-border-card">
          <button
            onClick={() => setActiveTab("fields")}
            className={`px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px ${
              activeTab === "fields"
                ? "border-accent text-accent"
                : "border-transparent text-label hover:text-heading"
            }`}
          >
            Fields ({fields.length})
          </button>
          <button
            onClick={() => setActiveTab("responses")}
            className={`px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px ${
              activeTab === "responses"
                ? "border-accent text-accent"
                : "border-transparent text-label hover:text-heading"
            }`}
          >
            Responses
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px ${
              activeTab === "insights"
                ? "border-accent text-accent"
                : "border-transparent text-label hover:text-heading"
            }`}
          >
            Insights
          </button>
        </div>

        {/* Responses Tab */}
        {activeTab === "responses" && (
          <div className="mb-6">
            {selectedResponse ? (
              <div className="bg-surface rounded-2xl border border-border-card p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setSelectedResponse(null)}
                    className="flex items-center gap-1.5 text-sm font-bold text-label hover:text-heading transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to list
                  </button>
                  <span className="text-xs text-label">
                    {selectedResponse.submittedAt
                      ? new Date(selectedResponse.submittedAt).toLocaleString()
                      : ""}
                  </span>
                </div>
                <div className="space-y-4">
                  {fields.map((field) => {
                    const val = (selectedResponse.data as Record<string, unknown>)[field.id];
                    if (val === undefined || val === null) return null;
                    return (
                      <div key={field.id}>
                        <p className="text-[11px] font-bold text-label uppercase tracking-widest mb-1 ml-1">
                          {field.label}
                        </p>
                        <p className="text-sm font-medium text-heading bg-input-bg rounded-xl py-3 px-4">
                          {Array.isArray(val) ? val.join(", ") : String(val)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : responsesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface rounded-2xl border border-border-card p-5 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded-lg w-1/3 mb-2" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  </div>
                ))}
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-2xl border border-border-card">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TableIcon className="w-7 h-7 text-label" />
                </div>
                <h3 className="text-base font-bold text-heading mb-2">No responses yet</h3>
                <p className="text-sm text-body max-w-xs mx-auto">
                  Responses will appear here once people start submitting your form.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium text-label">
                    {responsesTotal} response{responsesTotal !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={handleExportCsv}
                    disabled={exporting}
                    className="pill-button px-4 py-2 font-bold text-xs border border-border-card text-body hover:text-heading transition-colors flex items-center gap-1.5"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    {exporting ? "Exporting..." : "Export CSV"}
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface border-b border-border-card">
                        <th className="text-left text-[11px] font-bold text-label uppercase tracking-widest px-5 py-3">
                          #
                        </th>
                        {fields.slice(0, 4).map((field) => (
                          <th
                            key={field.id}
                            className="text-left text-[11px] font-bold text-label uppercase tracking-widest px-5 py-3"
                          >
                            {field.label}
                          </th>
                        ))}
                        <th className="text-left text-[11px] font-bold text-label uppercase tracking-widest px-5 py-3">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map((resp, i) => {
                        const data = resp.data as Record<string, unknown>;
                        return (
                          <tr
                            key={resp.id}
                            onClick={() => setSelectedResponse(resp)}
                            className="border-b border-border-card last:border-b-0 hover:bg-accent/5 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-3.5 text-label font-medium">
                              {(responsesPage - 1) * responsesPageSize + i + 1}
                            </td>
                            {fields.slice(0, 4).map((field) => {
                              const val = data[field.id];
                              const display =
                                val === undefined || val === null
                                  ? "—"
                                  : Array.isArray(val)
                                    ? val.join(", ")
                                    : String(val);
                              return (
                                <td
                                  key={field.id}
                                  className="px-5 py-3.5 text-heading font-medium truncate max-w-[200px]"
                                >
                                  {display}
                                </td>
                              );
                            })}
                            <td className="px-5 py-3.5 text-label text-xs">
                              {resp.submittedAt
                                ? new Date(resp.submittedAt).toLocaleString()
                                : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {responsesTotal > responsesPageSize && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-label">
                      Page {responsesPage} of {Math.ceil(responsesTotal / responsesPageSize)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchResponses(responsesPage - 1)}
                        disabled={responsesPage <= 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border-card text-body hover:text-heading transition-colors disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchResponses(responsesPage + 1)}
                        disabled={responsesPage >= Math.ceil(responsesTotal / responsesPageSize)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border-card text-body hover:text-heading transition-colors disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="mb-6">
            {analyticsLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-surface rounded-2xl border border-border-card p-5 animate-pulse">
                      <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                      <div className="h-7 bg-slate-100 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              </div>
            ) : !analytics ? (
              <div className="text-center py-16 bg-surface rounded-2xl border border-border-card">
                <p className="text-sm text-body">No analytics data available.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-bold text-label uppercase tracking-widest mb-3">Answers</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetricCard label="Visits" value={analytics.answers.visits} />
                    <MetricCard label="Submissions" value={analytics.answers.submissions} />
                    <MetricCard label="Unique Visitors" value={analytics.answers.uniqueRespondents} />
                    <MetricCard label="Avg Duration" value={`${analytics.answers.avgVisitDuration}s`} />
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-label uppercase tracking-widest mb-3">Drop-offs</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetricCard label="Started" value={analytics.dropoffs.started} />
                    <MetricCard label="Completions" value={analytics.dropoffs.completions} />
                    <MetricCard label="Completion Rate" value={`${Math.round(analytics.dropoffs.completionRate * 100)}%`} />
                    <MetricCard label="Avg Completion" value={`${analytics.dropoffs.avgCompletionDuration}s`} />
                  </div>
                </div>

                {analytics.responsesOverTime.length > 0 && (
                  <div className="bg-surface rounded-2xl border border-border-card p-5">
                    <h3 className="text-[11px] font-bold text-label uppercase tracking-widest mb-4">Responses Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.responsesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e5e5)" />
                        <XAxis dataKey="date" tick={{fontSize: 11}} />
                        <YAxis allowDecimals={false} tick={{fontSize: 11}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{r: 3}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {analytics.distributions.map((dist) => (
                  <div key={dist.fieldId} className="bg-surface rounded-2xl border border-border-card p-5">
                    <h3 className="text-[11px] font-bold text-label uppercase tracking-widest mb-1">{dist.fieldLabel}</h3>
                    <p className="text-xs text-body mb-4">{dist.fieldType.replace("_", " ")}</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dist.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e5e5)" />
                        <XAxis dataKey="value" tick={{fontSize: 11}} />
                        <YAxis allowDecimals={false} tick={{fontSize: 11}} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fields Section */}
        {activeTab === "fields" && <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold text-label uppercase tracking-widest">
              Fields ({fields.length})
            </h2>
            {!showAddField && (
              <button
                onClick={() => setShowAddField(true)}
                className="pill-button dark-btn px-4 py-2 font-bold text-xs flex items-center gap-1.5"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Field
              </button>
            )}
          </div>

          {/* Add Field Form */}
          {showAddField && (
            <div className="bg-surface rounded-2xl border border-border-card p-6 mb-4 animate-fade-in-up">
              <h3 className="text-base font-bold text-heading mb-4">
                New Field
              </h3>
              <form onSubmit={handleAddField} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                      Label
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Your Name"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      className="w-full bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                      Type
                    </label>
                    <select
                      value={newFieldType}
                      onChange={(e) =>
                        setNewFieldType(e.target.value as FieldType)
                      }
                      className="w-full bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium appearance-none"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    placeholder="Optional placeholder text"
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    className="w-full bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                  />
                </div>

                {hasOptions(newFieldType) && (
                  <div>
                    <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                      Options
                    </label>
                    <div className="space-y-2">
                      {newFieldOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const next = [...newFieldOptions];
                              next[i] = e.target.value;
                              setNewFieldOptions(next);
                            }}
                            className="flex-1 bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                          />
                          {newFieldOptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewFieldOptions(
                                  newFieldOptions.filter((_, j) => j !== i)
                                )
                              }
                              className="text-label hover:text-error p-1.5 transition-colors"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setNewFieldOptions([...newFieldOptions, ""])
                        }
                        className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 ml-1"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        Add option
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="w-4 h-4 rounded accent-accent"
                    />
                    <span className="text-sm font-medium text-body">
                      Required
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetAddForm}
                    className="flex-1 py-2.5 rounded-full text-sm font-bold text-body hover:text-heading border border-border-card transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingField}
                    className="pill-button dark-btn flex-1 py-2.5 font-bold text-sm"
                  >
                    {addingField ? "Adding..." : "Add Field"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Fields List */}
          {fields.length === 0 && !showAddField ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-border-card">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FieldIcon className="w-7 h-7 text-label" />
              </div>
              <h3 className="text-base font-bold text-heading mb-2">
                No fields yet
              </h3>
              <p className="text-sm text-body mb-5 max-w-xs mx-auto">
                Add fields to build your form — text inputs, selects, ratings,
                and more.
              </p>
              <button
                onClick={() => setShowAddField(true)}
                className="pill-button dark-btn px-5 py-2.5 font-bold text-sm inline-flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add your first field
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-surface rounded-2xl border border-border-card p-5 hover:shadow-sm transition-all duration-300 group"
                >
                  {editingFieldId === field.id ? (
                    <form onSubmit={handleSaveField} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                            Label
                          </label>
                          <input
                            type="text"
                            required
                            autoFocus
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                            Type
                          </label>
                          <select
                            value={editType}
                            onChange={(e) =>
                              setEditType(e.target.value as FieldType)
                            }
                            className="w-full bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium appearance-none"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          placeholder="Optional placeholder text"
                          value={editPlaceholder}
                          onChange={(e) => setEditPlaceholder(e.target.value)}
                          className="w-full bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                        />
                      </div>

                      {hasOptions(editType) && (
                        <div>
                          <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                            Options
                          </label>
                          <div className="space-y-2">
                            {editOptions.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  required
                                  placeholder={`Option ${i + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const next = [...editOptions];
                                    next[i] = e.target.value;
                                    setEditOptions(next);
                                  }}
                                  className="flex-1 bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                                />
                                {editOptions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditOptions(
                                        editOptions.filter((_, j) => j !== i)
                                      )
                                    }
                                    className="text-label hover:text-error p-1.5 transition-colors"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setEditOptions([...editOptions, ""])
                              }
                              className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 ml-1"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                              Add option
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editRequired}
                            onChange={(e) => setEditRequired(e.target.checked)}
                            className="w-4 h-4 rounded accent-accent"
                          />
                          <span className="text-sm font-medium text-body">
                            Required
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingFieldId(null)}
                          className="flex-1 py-2 rounded-full text-sm font-bold text-body hover:text-heading border border-border-card transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingField}
                          className="pill-button dark-btn flex-1 py-2 font-bold text-sm"
                        >
                          {savingField ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-bold text-label w-6 text-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-heading truncate">
                              {field.label}
                            </span>
                            {field.required && (
                              <span className="text-error text-xs font-bold">
                                *
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-label bg-slate-50 px-2 py-0.5 rounded-full">
                              {getFieldTypeLabel(field.type)}
                            </span>
                            {field.placeholder && (
                              <span className="text-xs text-label truncate max-w-[200px]">
                                &quot;{field.placeholder}&quot;
                              </span>
                            )}
                          </div>
                          {hasOptions(field.type) &&
                            field.options &&
                            (field.options as string[]).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {(field.options as string[]).map(
                                  (opt, i) => (
                                    <span
                                      key={i}
                                      className="text-[11px] font-medium text-body bg-slate-50 border border-border-card px-2.5 py-0.5 rounded-full"
                                    >
                                      {opt}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          {field.conditionFieldId && (
                            <p className="text-[11px] text-label mt-1.5">
                              <span className="font-semibold">Condition:</span>{" "}
                              {field.conditionOperator} &quot;
                              {field.conditionValue}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(field)}
                          className="text-label hover:text-accent p-1.5 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          disabled={deletingFieldId === field.id}
                          className="text-label hover:text-error p-1.5 transition-colors"
                          title="Delete"
                        >
                          {deletingFieldId === field.id ? (
                            <span className="text-xs text-body">...</span>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>}
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-page overflow-y-auto">
          {/* Preview Banner */}
          <div className="bg-amber-400 text-amber-900">
            <div className="max-w-xl mx-auto px-6 py-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest">
                Preview
              </span>
              <button
                onClick={() => setShowPreview(false)}
                className="text-xs font-bold uppercase tracking-widest hover:text-amber-700 transition-colors flex items-center gap-1"
              >
                Close
                <XCloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

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
              <h1 className="text-2xl font-bold text-heading mb-1">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-sm text-body">{form.description}</p>
              )}
            </div>

            <div className="space-y-5">
              {(fields as RendererField[]).map((field) => {
                if (!isFieldVisible(field, previewData)) return null;
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
                      value={previewData[field.id]}
                      onChange={(val) =>
                        setPreviewData((prev) => ({
                          ...prev,
                          [field.id]: val,
                        }))
                      }
                    />
                  </div>
                );
              })}

              <button
                type="button"
                disabled
                className="pill-button dark-btn w-full py-3 font-bold text-sm mt-4 opacity-50 cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface rounded-2xl border border-border-card p-5">
      <p className="text-[11px] font-bold text-label uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-heading">{value}</p>
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M.99 5.24A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25l.01 9.5A2.25 2.25 0 0 1 16.76 17H3.26A2.25 2.25 0 0 1 1 14.75l-.01-9.5Zm8.26 9.52v-3.5l-2.25.01a.75.75 0 0 1 0-1.5l2.25-.01v-3.5a.75.75 0 0 1 1.5 0v3.5l2.25-.01a.75.75 0 0 1 0 1.5l-2.25.01v3.5a.75.75 0 0 1-1.5 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M13.887 3.182c.396.037.79.08 1.183.128C16.194 3.45 17 4.414 17 5.517V16.75A2.25 2.25 0 0 1 14.75 19h-9.5A2.25 2.25 0 0 1 3 16.75V5.517c0-1.103.806-2.068 1.93-2.207.393-.048.787-.09 1.183-.128A3.001 3.001 0 0 1 9 1h2c1.373 0 2.531.923 2.887 2.182ZM7.5 4A1.5 1.5 0 0 1 9 2.5h2A1.5 1.5 0 0 1 12.5 4v.5h-5V4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XCloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M.99 5.24A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25l.01 9.5A2.25 2.25 0 0 1 16.76 17H3.26A2.25 2.25 0 0 1 1 14.75l-.01-9.5ZM3.25 4.5c-.41 0-.75.34-.75.75v1.25h15v-1.25c0-.41-.34-.75-.75-.75H3.25Zm14.75 3.5H2.01l.005 6.25c0 .41.34.75.75.75h13.5c.41 0 .75-.34.75-.75L17.01 8Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
