"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, ArrowRight, Lock, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("aman@forge.app");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/home");
      }
    } catch (err) {
      setError("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col justify-center items-center px-2">
      <div className="w-full max-w-[360px] bg-surface-raised border border-border rounded-card-lg p-6 sm:p-8 shadow-card relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-lime/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime to-[#9FE050] flex items-center justify-center shadow-glowLime mb-3">
            <Flame className="w-6 h-6 text-bg fill-bg" />
          </div>
          <h1 className="font-space text-2xl font-bold text-text">Forge</h1>
          <p className="text-xs text-text-dim mt-1">Sign in to your fitness & diet tracker</p>
        </div>

        {error && (
          <div className="bg-coral/10 border border-coral/30 rounded-xl p-2.5 mb-4 text-xs text-coral font-mono text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs text-text-dim mb-1 font-medium">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-text focus:outline-none focus:border-lime transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-dim mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-text focus:outline-none focus:border-lime transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-lime text-bg font-space font-bold text-sm shadow-glowLime hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <span>{loading ? "Signing in..." : "Enter Forge"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-dim">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-lime hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

