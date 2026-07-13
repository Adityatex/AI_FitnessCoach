"use client";

import { loginAction, signUpAction } from "@/app/auth/actions";
import { Dumbbell } from "lucide-react";
import { useActionState, useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginFormAction, isLoginPending] = useActionState(loginAction, null);
  const [signUpState, signUpFormAction, isSignUpPending] = useActionState(signUpAction, null);

  const error = mode === "login" ? loginState?.error : signUpState?.error;
  const isPending = mode === "login" ? isLoginPending : isSignUpPending;
  const formAction = mode === "login" ? loginFormAction : signUpFormAction;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-brand mb-3">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Coach Atlas</h1>
          <p className="text-sm text-gray-500 mt-1">AI Fitness & Nutrition Coach</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              mode === "login"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              mode === "signup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>
          )}

          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-semibold rounded-full shadow-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center text-sm"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Get Started"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
