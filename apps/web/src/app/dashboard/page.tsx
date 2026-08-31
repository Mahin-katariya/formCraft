"use client";

import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { trpc, trpcWithRefresh } from "@/lib/trpc";

type Form = {
  id: string;
  title: string;
  slug: string;
  status: string;
  description: string | null;
  createdAt: string | null;
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      const result = await trpcWithRefresh(() =>
        trpc.form.listAllFormsCreatedByUser.query()
      );
      setForms(result.data as Form[]);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  async function handleLogout() {
    await logout();
    router.push("/auth");
  }

  async function handleCreateForm(e: React.FormEvent) {
    e.preventDefault();
    if (!newFormTitle.trim()) return;
    setCreating(true);
    try {
      await trpcWithRefresh(() =>
        trpc.form.createForm.mutate({ title: newFormTitle.trim() })
      );
      setNewFormTitle("");
      setShowCreateModal(false);
      await fetchForms();
    } catch {
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteForm(id: string) {
    setDeletingId(id);
    try {
      await trpcWithRefresh(() => trpc.form.deleteForm.mutate({ id }));
      await fetchForms();
    } catch {
    } finally {
      setDeletingId(null);
    }
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

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="bg-page font-sans min-h-screen">
      {/* Header */}
      <header className="border-b border-border-card bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md">
              <DoveIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-heading text-lg tracking-tight">
              PigeonForm
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-heading hidden sm:block">
                {user?.displayName ?? user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-body font-semibold hover:text-heading transition-colors uppercase tracking-widest"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-heading">Your Forms</h1>
            <p className="text-sm text-body mt-1">
              Create, manage, and track your forms.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="pill-button dark-btn px-6 py-2.5 font-bold text-sm flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            New Form
          </button>
        </div>

        {/* Forms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface rounded-2xl border border-border-card p-6 animate-pulse"
              >
                <div className="h-5 bg-slate-100 rounded-lg w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded-lg w-1/2 mb-6" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
              </div>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DoveIcon className="w-8 h-8 text-label" />
            </div>
            <h2 className="text-lg font-bold text-heading mb-2">
              No forms yet
            </h2>
            <p className="text-sm text-body mb-6 max-w-sm mx-auto">
              Create your first form to start collecting responses.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="pill-button dark-btn px-6 py-2.5 font-bold text-sm inline-flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Create your first form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-surface rounded-2xl border border-border-card p-6 hover:shadow-md transition-all duration-300 group cursor-pointer"
                onClick={() => router.push(`/forms/${form.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold text-heading group-hover:text-accent transition-colors line-clamp-1">
                    {form.title}
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ml-2 ${getStatusColor(form.status)}`}
                  >
                    {form.status}
                  </span>
                </div>

                {form.description && (
                  <p className="text-sm text-body line-clamp-2 mb-4">
                    {form.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-card">
                  <span className="text-xs text-label">
                    {formatDate(form.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteForm(form.id);
                      }}
                      disabled={deletingId === form.id}
                      className="text-xs text-label hover:text-error font-semibold transition-colors p-1"
                    >
                      {deletingId === form.id ? (
                        <span className="text-body">...</span>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Form Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl p-8 w-full max-w-md border border-border-card animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-heading mb-1">
              Create a new form
            </h2>
            <p className="text-sm text-body mb-6">
              Give your form a title to get started.
            </p>
            <form onSubmit={handleCreateForm}>
              <label className="block text-[11px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                Form Title
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Customer Feedback"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                className="w-full bg-input-bg border border-transparent rounded-xl py-3 px-5 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium mb-5"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold text-body hover:text-heading border border-border-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="pill-button dark-btn flex-1 py-2.5 font-bold text-sm"
                >
                  {creating ? "Creating..." : "Create Form"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
