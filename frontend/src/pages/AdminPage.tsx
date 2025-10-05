import React, { useState, useEffect, useCallback } from "react";
import { type Reward } from "../types/reward";

interface AdminPageProps {
  user_id: number;
}

interface RewardCreate {
  name: string;
  description: string;
  points_required: number;
  reward_type: string;
  value: number;
}

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

  // Check if user is admin
  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/users/${user_id}/admin-status`);
      const data = await response.json();
      if (data.status === "success") {
        setIsAdmin(data.isadmin);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  }, [user_id]);

  // Load all rewards
  const loadRewards = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/rewards/");
      const data = await response.json();
      if (data.status === "success") {
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (isAdmin) {
      loadRewards();
    }
  }, [isAdmin, loadRewards]);

  // Create new reward
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || formData.points_required <= 0) {
      alert("Please fill all required fields with valid values.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/rewards/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
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
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      console.error("Error creating reward:", error);
      alert("Failed to create reward");
    } finally {
      setLoading(false);
    }
  };

  // Delete reward
  const handleDeleteReward = async (rewardId: number) => {
    if (!confirm("Are you sure you want to delete this reward?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/rewards/${rewardId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.status === "success") {
        alert("Reward deleted successfully!");
        loadRewards();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert("Failed to delete reward");
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard - Rewards Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Add New Reward
        </button>
      </div>

      {/* Create Reward Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Create New Reward</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reward Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points Required *
                </label>
                <input
                  type="number"
                  value={formData.points_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, points_required: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reward Type *
                </label>
                <select
                  value={formData.reward_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, reward_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Gift">Gift</option>
                  <option value="Voucher">Voucher</option>
                  <option value="Discount">Discount</option>
                  <option value="Badge">Badge</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value *
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Reward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rewards List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Rewards ({rewards.length})</h2>
        {rewards.length === 0 ? (
          <p className="text-gray-500">No rewards found. Create your first reward!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <div key={reward.reward_id} className="bg-white p-4 rounded-lg shadow border">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg">{reward.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points Required:</span>
                    <span className="font-medium text-blue-600">{reward.points_required} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-purple-600">{reward.reward_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium text-green-600">{reward.value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${reward.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {reward.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-xs text-gray-500">
                      {new Date(reward.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={() => handleDeleteReward(reward.reward_id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;