import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const TAB_LOGIN = "login";
const TAB_REGISTER = "register";

const AuthPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(TAB_LOGIN);

  const tabFromUrl = searchParams.get("tab");
  useEffect(() => {
    if (tabFromUrl === TAB_REGISTER || tabFromUrl === TAB_LOGIN) {
      setTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchTab = (newTab) => {
    setTab(newTab);
    setError("");
    setSearchParams(newTab === TAB_REGISTER ? { tab: TAB_REGISTER } : {});
  };

  const handleLoginChange = (e) => {
    setLoginForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterChange = (e) => {
    setRegisterForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Login failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (registerForm.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register(
        registerForm.name,
        registerForm.email,
        registerForm.password
      );
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center px-4 py-8">
        <div className="card w-full max-w-md rounded-2xl border-slate-200/80 bg-white p-0 shadow-xl shadow-slate-200/50">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => switchTab(TAB_LOGIN)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                tab === TAB_LOGIN
                  ? "border-b-2 border-primary text-primary"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchTab(TAB_REGISTER)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                tab === TAB_REGISTER
                  ? "border-b-2 border-primary text-primary"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Register
            </button>
          </div>

          <div className="p-6">
            {tab === TAB_LOGIN && (
              <form
                onSubmit={handleLoginSubmit}
                className="animate-fade-in space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                {error && <p className="text-xs text-alert">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded-lg py-2.5"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
                <p className="text-center text-xs text-slate-600">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchTab(TAB_REGISTER)}
                    className="font-semibold text-primary underline hover:no-underline"
                  >
                    Register
                  </button>
                </p>
              </form>
            )}

            {tab === TAB_REGISTER && (
              <form
                onSubmit={handleRegisterSubmit}
                className="animate-fade-in space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={6}
                  />
                </div>
                {error && <p className="text-xs text-alert">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded-lg py-2.5"
                >
                  {loading ? "Creating account..." : "Register"}
                </button>
                <p className="text-center text-xs text-slate-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchTab(TAB_LOGIN)}
                    className="font-semibold text-primary underline hover:no-underline"
                  >
                    Login
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
