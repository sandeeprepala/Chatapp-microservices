"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import { user_service } from "../../context/AppContext";
import Cookie from "js-cookie";
import { 
  User, 
  Mail, 
  Calendar, 
  Edit3, 
  RefreshCw, 
  Shield,
  CheckCircle,
  XCircle
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: ""
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = Cookie.get("token");
      const { data } = await axios.get(`${user_service}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(data);
      setEditForm({
        name: data.name,
        email: data.email
      });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      toast.error("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchUser();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSave = async () => {
    try {
      const token = Cookie.get("token");
      await axios.put(`${user_service}/api/v1/update/user`, {
        name:editForm.name
      },
        {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => prev ? { ...prev, name: editForm.name } : null);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: user?.name || "",
      email: user?.email || ""
    });
    setIsEditing(false);
  };

  const getAccountAge = () => {
    if (!user) return "0 days";
    const created = new Date(user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  if (loading) return <Loading />;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No User Data Found</h2>
        <p className="text-gray-400 mb-6">Unable to load your profile information.</p>
        <button
          onClick={fetchUser}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-blue-500 bg-clip-text text-transparent mb-4">
            User Profile
          </h1>
          <p className="text-gray-400">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <p className="text-gray-300 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-400" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  ) : (
                    <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white">
                      {user.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  ) : (
                    <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-400" />
                Account Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Member Since</div>
                  <div className="text-white font-semibold flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Account Age</div>
                  <div className="text-white font-semibold">
                    {getAccountAge()}
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Last Updated</div>
                  <div className="text-white font-semibold">
                    {new Date(user.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">User ID</div>
                  <div className="text-white font-mono text-sm truncate" title={user._id}>
                    {user._id}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-gray-800/30 px-6 py-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Profile last fetched: {new Date().toLocaleTimeString()}
              </span>
              <span className="text-green-400 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;