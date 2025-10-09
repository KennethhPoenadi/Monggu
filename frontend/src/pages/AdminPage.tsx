import React, { useState, useEffect, useCallback } from "react";
import { type Reward } from "../types/reward";

interface AdminPageProps {
  user_id: number;
}

type RewardCreate = {
  name: string;
  description: string;
  points_required: number;
  reward_type: "Gift" | "Voucher" | "Discount" | "Badge";
  value: number;
};

const AdminPage: React.FC<AdminPageProps> = ({ user_id }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState<RewardCreate>({
    name: "",
    description: "",
    points_required: 0,
    reward_type: "Gift",
    value: 0,
  });

  // --- utils ---
  const handleGlow = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  // --- data ---
  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/accounts/${user_id}/admin-status`
      );
      const data = await response.json();
      if (data.status === "success") setIsAdmin(!!data.is_panitia);
    } catch (err) {
      console.error("Error checking admin status:", err);
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  }, [user_id]);

  const loadRewards = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/rewards/");
      const data = await response.json();
      if (data.status === "success") setRewards(data.rewards || []);
    } catch (err) {
      console.error("Error loading rewards:", err);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (isAdmin) loadRewards();
  }, [isAdmin, loadRewards]);

  // --- actions ---
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      formData.points_required <= 0
    ) {
      alert("Please fill all required fields with valid values.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/rewards/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Reward created successfully!");
        setShowCreateForm(false);
        setFormData({
          name: "",
          description: "",
          points_required: 0,
          reward_type: "Gift",
          value: 0,
        });
        loadRewards();
      } else {
        alert(`Error: ${data.detail || "Failed to create reward"}`);
      }
    } catch (err) {
      console.error("Error creating reward:", err);
      alert("Failed to create reward");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async (rewardId: number) => {
    if (!confirm("Delete this reward?")) return;
    try {
      const res = await fetch(`http://localhost:8000/rewards/${rewardId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Reward deleted.");
        loadRewards();
      } else {
        alert(`Error: ${data.detail || "Failed to delete"}`);
      }
    } catch (err) {
      console.error("Error deleting reward:", err);
      alert("Failed to delete reward");
    }
  };

  // --- gated states ---
  if (checkingAuth) {
    return (
      <div className="grid min-h-[calc(100vh-120px)] place-items-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-6 py-4 shadow-xl">
          Checking permissions…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-[calc(100vh-120px)] place-items-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-rose-200">Access Denied</h1>
          <p className="mt-2 text-rose-200/80">
            You don’t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // --- main ---
  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* dekor blob */}
      <svg
        className="pointer-events-none absolute -right-20 -top-20 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/30"
        />
      </svg>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        {/* Header */}
        <section className="flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Admin — Rewards Management
            </h1>
            <p className="mt-1 text-slate-300">
              Create, review, and manage rewards for users.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold shadow-lg hover:bg-emerald-700 hover:shadow-emerald-500/20"
          >
            + Add Reward
          </button>
        </section>

        {/* List */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 md:p-8 shadow-lg backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold">
              All Rewards <span className="text-slate-400">({rewards.length})</span>
            </h2>
          </div>

          {rewards.length === 0 ? (
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-10 text-center text-slate-300">
              No rewards found. Create your first reward!
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((r) => (
                <div
                  key={r.reward_id}
                  onMouseMove={handleGlow}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl"
                >
                  {/* glow */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,.12), transparent 40%)",
                    }}
                  />

                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {r.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {r.description}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        r.is_active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      {r.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Points Required</span>
                      <span className="font-semibold text-emerald-300">
                        {r.points_required.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className="font-semibold text-violet-300">
                        {r.reward_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Value</span>
                      <span className="font-semibold text-sky-300">
                        {r.value}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Created</span>
                      <span className="text-slate-300">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleDeleteReward(r.reward_id)}
                      className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h3 className="text-lg font-semibold">Create New Reward</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-2xl leading-none text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Reward Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Points Required *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.points_required}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        points_required: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Reward Type *
                  </label>
                  <select
                    value={formData.reward_type}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        reward_type: e.target.value as RewardCreate["reward_type"],
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    required
                  >
                    <option value="Gift">Gift</option>
                    <option value="Voucher">Voucher</option>
                    <option value="Discount">Discount</option>
                    <option value="Badge">Badge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Value *
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      value: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating…" : "Create Reward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
