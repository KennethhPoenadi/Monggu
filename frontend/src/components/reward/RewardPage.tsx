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
  const [activeTab, setActiveTab] = useState<"available" | "claimed">(
    "available"
  );

  // Load available rewards
  const loadRewards = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/rewards/?user_id=${user_id}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
    }
  }, [user_id]);

  // Load user's claimed rewards
  const loadUserRewards = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/rewards/user/${user_id}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setUserRewards(data.user_rewards);
      }
    } catch (error) {
      console.error("Error loading user rewards:", error);
    }
  }, [user_id]);

  // Load user points
  const loadUserPoints = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/rewards/user/${user_id}/points`
      );
      const data = await response.json();
      if (data.status === "success") {
        setUserPoints(data.points);
        setUserRank(data.rank);
      }
    } catch (error) {
      console.error("Error loading user points:", error);
    }
  }, [user_id]);

  useEffect(() => {
    loadRewards();
    loadUserRewards();
    loadUserPoints();
  }, [loadRewards, loadUserRewards, loadUserPoints]);

  // Claim reward
  const claimReward = async (rewardId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/rewards/claim/${rewardId}?user_id=${user_id}`,
        {
          method: "POST",
        }
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

  // Use reward
  const handleUseReward = async (userRewardId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/rewards/user-reward/${userRewardId}/use`,
        {
          method: "PUT",
        }
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

  // Get reward type icon
  const getRewardIcon = (type: RewardType) => {
    switch (type) {
      case RewardType.Discount:
        return "💰";
      case RewardType.Gift:
        return "🎁";
      case RewardType.Voucher:
        return "🎫";
      case RewardType.Badge:
        return "🏅";
      default:
        return "🎉";
    }
  };

  // Get reward type color
  const getRewardColor = (type: RewardType) => {
    switch (type) {
      case RewardType.Discount:
        return "bg-green-100 text-green-800";
      case RewardType.Gift:
        return "bg-purple-100 text-purple-800";
      case RewardType.Voucher:
        return "bg-blue-100 text-blue-800";
      case RewardType.Badge:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Points */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Rewards</h1>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Points</h2>
                <p className="text-blue-100">Current Rank: {userRank}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {userPoints.toLocaleString()}
                </div>
                <div className="text-blue-100">points available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-6 py-2 rounded-lg transition-colors ${
                activeTab === "available"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Available Rewards ({rewards.length})
            </button>
            <button
              onClick={() => setActiveTab("claimed")}
              className={`px-6 py-2 rounded-lg transition-colors ${
                activeTab === "claimed"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              My Rewards ({userRewards.length})
            </button>
          </div>
        </div>

        {/* Available Rewards Tab */}
        {activeTab === "available" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <div
                key={reward.reward_id}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">
                    {getRewardIcon(reward.reward_type)}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRewardColor(
                      reward.reward_type
                    )}`}
                  >
                    {reward.reward_type}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {reward.name}
                </h3>
                <p className="text-gray-600 mb-4">{reward.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-blue-600">
                    {reward.points_required.toLocaleString()} points
                  </div>
                  {reward.value > 0 && (
                    <div className="text-sm text-gray-500">
                      Value: {reward.value.toLocaleString()}
                    </div>
                  )}
                </div>

                {reward.user_reward_id ? (
                  <div className="bg-green-100 text-green-800 text-center py-2 rounded-lg">
                    ✅ Already Claimed
                  </div>
                ) : reward.can_claim ? (
                  <button
                    onClick={() => claimReward(reward.reward_id)}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Claiming..." : "Claim Reward"}
                  </button>
                ) : (
                  <div className="bg-gray-100 text-gray-600 text-center py-2 rounded-lg">
                    Need{" "}
                    {(reward.points_required - userPoints).toLocaleString()}{" "}
                    more points
                  </div>
                )}
              </div>
            ))}

            {rewards.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No rewards available
                </h3>
                <p className="text-gray-500">New rewards will be added soon!</p>
              </div>
            )}
          </div>
        )}

        {/* Claimed Rewards Tab */}
        {activeTab === "claimed" && (
          <div className="space-y-4">
            {userRewards.map((userReward) => (
              <div
                key={userReward.user_reward_id}
                className="bg-white rounded-lg shadow-sm border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {getRewardIcon(userReward.reward_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{userReward.name}</h3>
                      <p className="text-gray-600">{userReward.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>
                          Claimed:{" "}
                          {new Date(userReward.claimed_at).toLocaleDateString()}
                        </span>
                        {userReward.used_at && (
                          <span>
                            Used:{" "}
                            {new Date(userReward.used_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getRewardColor(
                        userReward.reward_type
                      )}`}
                    >
                      {userReward.reward_type}
                    </div>
                    {userReward.value > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        Value: {userReward.value.toLocaleString()}
                      </div>
                    )}

                    {userReward.is_used ? (
                      <div className="mt-2 bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm">
                        ✓ Used
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handleUseReward(userReward.user_reward_id)
                        }
                        className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Mark as Used
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {userRewards.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No rewards claimed yet
                </h3>
                <p className="text-gray-500">
                  Start earning points by making donations and claim your first
                  reward!
                </p>
                <button
                  onClick={() => setActiveTab("available")}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Available Rewards
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardPage;
