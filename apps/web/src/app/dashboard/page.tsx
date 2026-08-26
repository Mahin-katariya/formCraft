"use client";

import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { useRouter } from "next/navigation";

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

  async function handleLogout() {
    await logout();
    router.push("/auth");
  }

  return (
    <div className="bg-page font-sans min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface rounded-3xl shadow-lg p-8 border border-border-card">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-heading">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-body font-semibold hover:text-heading transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-heading">
                Welcome, {user?.displayName ?? user?.email}
              </p>
              <p className="text-sm text-body">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                user?.emailVerified ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-body">
              {user?.emailVerified ? "Email verified" : "Email not verified"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
