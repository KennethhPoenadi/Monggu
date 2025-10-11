import React, { useState, useEffect, useCallback } from "react";
import { RewardType, type Reward, type UserReward } from "../../types/reward";

interface RewardPageProps {
  user_id: number;
}

const RewardPage: React.FC<RewardPageProps> = ({ user_id }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userRank, setUserRank] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"available" | "claimed">("available");

  // --- load data
  const loadRewards = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/rewards/?user_id=${user_id}`);
      const data = await response.json();
      console.log("Rewards response:", data); // Debug log
      if (data.status === "success") {
        const updatedRewards = data.rewards.map((reward: Reward) => ({
          ...reward,
          can_claim: userPoints >= reward.points_required, // Check if user has enough points
        }));
        setRewards(updatedRewards);
      } else {
        console.error("Failed to load rewards:", data);
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
    }
  }, [user_id, userPoints]);

  const loadUserRewards = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/rewards/user/${user_id}`);
      const data = await response.json();
      if (data.status === "success") setUserRewards(data.user_rewards);
    } catch (error) {
      console.error("Error loading user rewards:", error);
    }
  }, [user_id]);

  const loadUserPoints = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/rewards/user/${user_id}/points`);
      const data = await response.json();
      console.log("User points response:", data); // Debug log
      if (data.status === "success") {
        setUserPoints(data.points);
        setUserRank(data.rank);
      } else {
        console.error("Failed to load user points:", data);
      }
    } catch (error) {
      console.error("Error loading user points:", error);
    }
  }, [user_id]);

  useEffect(() => {
    loadUserPoints();
  }, [loadUserPoints]);

  useEffect(() => {
    loadRewards();
    loadUserRewards();
  }, [loadRewards, loadUserRewards]);

  // --- actions
  const claimReward = async (rewardId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/rewards/claim/${rewardId}?user_id=${user_id}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.status === "success") {
        alert(data.message);
        loadRewards();
        loadUserRewards();
        loadUserPoints();
      } else {
        alert("Error claiming reward: " + data.detail);
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Error claiming reward");
    } finally {
      setLoading(false);
    }
  };

  // --- ui helpers
  const getRewardIcon = (type: RewardType) => {
    switch (type) {
      case RewardType.DISCOUNT:
        return "💰";
      case RewardType.FREE_ITEM:
        return "🎁";
      case RewardType.VOUCHER:
        return "🎫";
      case RewardType.BADGE:
        return "🏅";
      default:
        return "🎉";
    }
  };

  // chip warna gelap
  const chipClass = (type: RewardType) => {
    switch (type) {
      case RewardType.DISCOUNT:
        return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
      case RewardType.FREE_ITEM:
        return "bg-violet-500/15 text-violet-300 border border-violet-500/30";
      case RewardType.VOUCHER:
        return "bg-sky-500/15 text-sky-300 border border-sky-500/30";
      case RewardType.BADGE:
        return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
      default:
        return "bg-slate-700/40 text-slate-200 border border-slate-600/60";
    }
  };

  // color glow mengikuti tipe reward (rgba)
  const glowRGBA = (type: RewardType) => {
    switch (type) {
      case RewardType.DISCOUNT:
        return "rgba(16,185,129,.12)"; // emerald-500
      case RewardType.FREE_ITEM:
        return "rgba(139,92,246,.12)"; // violet-500
      case RewardType.VOUCHER:
        return "rgba(56,189,248,.12)"; // sky-400
      case RewardType.BADGE:
        return "rgba(245,158,11,.12)"; // amber-500
      default:
        return "rgba(148,163,184,.12)"; // slate-400
    }
  };

  // follow-mouse glow handlers
  const handleGlowMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  const handleGlowLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.removeProperty("--x");
    el.style.removeProperty("--y");
  };

  const handleUseReward = async (userRewardId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/rewards/user-reward/${userRewardId}/use`,
        { method: "PUT" }
      );
      const data = await response.json();
      if (data.status === "success") {
        alert("Reward marked as used!");
        loadUserRewards();
      } else {
        alert("Error using reward: " + data.detail);
      }
    } catch (error) {
      console.error("Error using reward:", error);
      alert("Error using reward");
    }
  };



  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* dekor blob */}
      <svg
        className="pointer-events-none absolute -right-24 -top-24 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-violet-500/25"
        />
      </svg>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER + POINTS */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-violet-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              🏆 Rewards
            </h1>
            <p className="mt-2 text-slate-300">Earn, claim, and track your rewards</p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
              <div className="text-slate-300">Current Rank</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-100">{userRank || "-"}</div>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-100"
                style={{
                  background:
                    "radial-gradient(500px circle at 10% 10%, rgba(139,92,246,.10), transparent 40%)",
                }}
              />
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
              <div className="text-slate-300">Your Points</div>
              <div className="mt-1 text-3xl font-extrabold text-slate-100">
                {userPoints.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">points available</div>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-100"
                style={{
                  background:
                    "radial-gradient(500px circle at 90% 20%, rgba(56,189,248,.10), transparent 40%)",
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveTab("available")}
              className={`rounded-2xl px-6 py-3 font-semibold transition-all ${
                activeTab === "available"
                  ? "bg-sky-600 text-white shadow hover:bg-sky-700"
                  : "border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-900"
              }`}
            >
              Available Rewards ({rewards.length})
            </button>
            <button
              onClick={() => setActiveTab("claimed")}
              className={`rounded-2xl px-6 py-3 font-semibold transition-all ${
                activeTab === "claimed"
                  ? "bg-emerald-600 text-white shadow hover:bg-emerald-700"
                  : "border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-900"
              }`}
            >
              My Rewards ({userRewards.length})
            </button>
          </div>
        </section>

        {/* LOADING */}
        {loading && (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-violet-500" />
            <p className="mt-4 text-slate-300">Loading...</p>
          </div>
        )}

        {/* AVAILABLE */}
        {!loading && activeTab === "available" && (
          <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <div
                key={reward.reward_id}
                onMouseMove={handleGlowMove}
                onMouseLeave={handleGlowLeave}
                className={`group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  !reward.can_claim ? "opacity-60" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), ${glowRGBA(
                      reward.reward_type
                    )}, transparent 40%)`,
                  }}
                />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-sky-500 text-2xl">
                    {getRewardIcon(reward.reward_type)}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${chipClass(reward.reward_type)}`}>
                    {String(reward.reward_type)}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-slate-100">{reward.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{reward.description}</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-400">{reward.value}</p>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    Points: {reward.points_required.toLocaleString()}
                  </span>
                  <span className={`font-semibold ${
                    userPoints >= reward.points_required ? "text-emerald-400" : "text-red-400"
                  }`}>
                    You have: {userPoints.toLocaleString()}
                  </span>
                </div>

                {reward.user_reward_id ? (
                  <div className="mt-4 rounded-lg border border-emerald-700 bg-emerald-900/40 px-4 py-2 text-center text-emerald-300">
                    ✓ Already Claimed
                  </div>
                ) : reward.can_claim ? (
                  <button
                    onClick={() => claimReward(reward.reward_id)}
                    disabled={loading}
                    className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? "Claiming..." : "Claim Reward"}
                  </button>
                ) : (
                  <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-center text-slate-400">
                    Need {(reward.points_required - userPoints).toLocaleString()} more points
                  </div>
                )}
              </div>
            ))}

            {rewards.length === 0 && (
              <div className="col-span-full rounded-3xl border border-slate-700/60 bg-slate-900/70 p-16 text-center shadow-xl">
                <div className="mb-6 text-8xl">🎁</div>
                <h3 className="mb-3 text-2xl font-bold text-slate-100">No rewards available</h3>
                <p className="text-slate-400">New rewards will be added soon!</p>
              </div>
            )}
          </section>
        )}

        {/* CLAIMED */}
        {!loading && activeTab === "claimed" && (
          <section className="mt-8 space-y-4">
            {userRewards.map((ur) => (
              <div
                key={ur.user_reward_id}
                onMouseMove={handleGlowMove}
                onMouseLeave={handleGlowLeave}
                className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), ${glowRGBA(
                      ur.reward_type
                    )}, transparent 40%)`,
                  }}
                />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 text-2xl">
                      {getRewardIcon(ur.reward_type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{ur.name}</h3>
                      <p className="text-slate-300">{ur.description}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${chipClass(ur.reward_type)}`}>
                          {String(ur.reward_type)}
                        </span>
                        <span>•</span>
                        <span>Claimed: {new Date(ur.claimed_at).toLocaleDateString()}</span>
                        {ur.used_at && (
                          <>
                            <span>•</span>
                            <span>Used: {new Date(ur.used_at).toLocaleDateString()}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Value: {ur.value}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {ur.is_used ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-sm text-slate-300">
                        ✓ Used
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUseReward(ur.user_reward_id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        Mark as Used
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {userRewards.length === 0 && (
              <div className="grid place-items-center rounded-3xl border border-slate-700/60 bg-slate-900/70 p-16 text-center shadow-xl">
                <div className="mb-6 text-8xl">🏆</div>
                <h3 className="mb-3 text-2xl font-bold text-slate-100">No rewards claimed yet</h3>
                <p className="text-slate-400">
                  Start earning points by making donations and claim your first reward!
                </p>
                <button
                  onClick={() => setActiveTab("available")}
                  className="mt-5 rounded-2xl bg-sky-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-sky-700"
                >
                  Browse Available Rewards
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default RewardPage;
