'use client';

import { signOut } from "next-auth/react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="mt-3 text-xl">Welcome! You are authenticated.</p>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-6 px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
      >
        Sign out
      </button>
    </div>
  );
}