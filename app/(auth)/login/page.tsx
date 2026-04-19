"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import {
  Eye, EyeOff, Lock, Mail, Shield,
  Users, UserCheck, ChevronRight,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const demoCredentials = [
  {
    role: "Admin",
    email: "admin@sunwayglobalschool.edu",
    password: "admin123",
    icon: Shield,
    color: "from-sky-600 to-blue-600",
    bg: "bg-sky-50 border-sky-200",
    textColor: "text-sky-700",
    description: "Full system access",
  },
  {
    role: "Staff",
    email: "staff@sunwayglobalschool.edu",
    password: "staff123",
    icon: UserCheck,
    color: "from-emerald-600 to-teal-600",
    bg: "bg-emerald-50 border-emerald-200",
    textColor: "text-emerald-700",
    description: "Teacher portal",
  },
  {
    role: "Parent",
    email: "parent@sunwayglobalschool.edu",
    password: "parent123",
    icon: Users,
    color: "from-purple-600 to-violet-600",
    bg: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    description: "Parent portal",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        // Fetch session to get the actual role
        const { getSession } = await import("next-auth/react");
        const sess = await getSession();
        const role = (sess?.user as { role?: string })?.role;
        if (role === "admin") router.push("/admin");
        else if (role === "staff") router.push("/staff");
        else if (role === "parent") router.push("/parent");
        else router.push("/parent");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue("email", email);
    setValue("password", password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-100 rounded-full opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-100 rounded-full opacity-50" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-amber-100 rounded-full opacity-30" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(14,165,233,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & School Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-50 to-blue-50 border-2 border-blue-100 shadow-md flex items-center justify-center p-1">
              <Image src="/logo.png" alt="Sunway Global School" width={88} height={88} priority className="object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sunway Global School</h1>
          <p className="text-sm text-gray-500 mt-1">School Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to access your portal</p>
          </div>

          {/* Demo Credentials */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillDemo(cred.email, cred.password)}
                  className={`${cred.bg} border rounded-xl p-3 text-center hover:shadow-md transition-all duration-200 hover:scale-105`}
                >
                  <div
                    className={`w-8 h-8 bg-gradient-to-br ${cred.color} rounded-lg flex items-center justify-center mx-auto mb-1.5 shadow-sm`}
                  >
                    <cred.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className={`text-xs font-semibold ${cred.textColor}`}>{cred.role}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cred.description}</p>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Click a role to auto-fill</p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-medium">Or enter manually</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-700 text-white py-3 rounded-xl font-semibold text-sm hover:from-sky-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-sky-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sunway Global School © 2025 • Academic Year 2024-2025
        </p>
      </div>
    </div>
  );
}
