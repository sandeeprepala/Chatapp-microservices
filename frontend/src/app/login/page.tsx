"use client";
import Loading from "../../components/Loading";
import { useAppData, user_service } from "../../context/AppContext";
import axios from "axios";
import { ArrowRight, Loader2, Mail, KeyRound } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const { isAuth, loading: userLoading } = useAppData();

  const handleSubmit = async (
    e: React.FormEvent<HTMLElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginMethod === "otp") {
        const { data } = await axios.post(`${user_service}/api/v1/login`, {
          email,
        });
        toast.success(data.message);
        router.push(`/verify?email=${email}`);
      } else {
        const { data } = await axios.post(`${user_service}/api/v1/login/password`, {
          email,
          password,
        });
        
        // Store token in cookie instead of localStorage
        document.cookie = `token=${data.token}; path=/`;
        
        toast.success("Login successful!");
        window.location.href = "/chat"; // Using window.location to force a full reload
      }
    } catch (error: any) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) return <Loading />;
  if (isAuth) return redirect("/chat");
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
              {loginMethod === "otp" ? (
                <Mail size={40} className="text-white" />
              ) : (
                <KeyRound size={40} className="text-white" />
              )}
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Welcome To Connect
            </h1>
            <p className="text-gray-300 text-lg">
              Choose your login method to continue
            </p>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setLoginMethod("otp")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                loginMethod === "otp"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Login with OTP
            </button>
            <button
              onClick={() => setLoginMethod("password")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                loginMethod === "password"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Password Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {loginMethod === "password" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {loginMethod === "otp" ? "Sending OTP..." : "Logging in..."}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>
                    {loginMethod === "otp"
                      ? "Send Verification Code"
                      : "Login"}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>

            {loginMethod === "password" && (
              <p className="text-center text-gray-400 mt-4">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-blue-500 hover:text-blue-400"
                >
                  Register here
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
