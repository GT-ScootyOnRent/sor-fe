import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useLoginMutation } from "../store/api/authApi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";
import { markPasswordChanged, resetPasswordChangeFlag } from "../store/slices/adminAuthSlice";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  // If already logged in as admin/superadmin → go to admin panel
  // If already logged in as user → do NOT auto-enter admin — stay on page
  if (isAuthenticated && user) {
    if (user.userType === "admin" || user.userType === "superadmin") {
      return <Navigate to="/dashboard" replace />;
    }
    // user.userType === "user": fall through — let them attempt admin login
    // (they'll fail at role check in handleSubmit)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const response = await login({
        type: "admin",
        identifier: identifier.trim(),
        password: password.trim(),
      }).unwrap();

      if (response.success && response.token && response.userData) {
        const userData = response.userData as any;
        const userType = response.userType?.toLowerCase() as "admin" | "superadmin";

        // Double-check role on frontend too
        if (userType !== "admin" && userType !== "superadmin") {
          setError("Access denied. This login is for admins only.");
          return;
        }

        // Store hasChangedPassword from backend response (localStorage + Redux)
        if (userData.hasChangedPassword) {
          dispatch(markPasswordChanged());
        } else {
          dispatch(resetPasswordChangeFlag());
        }

        dispatch(
          setCredentials({
            user: {
              id: userData.id,
              name: userData.username ?? userData.email ?? "Admin",
              email: userData.email,
              phone: userData.number ?? "",
              userType: userType,
              cityId: userData.cityId,
            },
            token: response.token,
            refreshToken: response.refreshToken ?? undefined,
          })
        );

        toast.success("Login successful!");
        navigate("/dashboard", { replace: true });
      } else {
        setError(response.message ?? "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err?.data?.message ?? "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">Sign in to your admin dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@scootyonrent.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary-600 hover:text-primary-700 transition"
              >
                Forgot password?
              </button>
            </div>
            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
