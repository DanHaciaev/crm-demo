"use client";

import Auth from "@/components/auth/Auth";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen p-4 justify-center bg-zinc-50 font-sans dark:bg-black">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen p-4 justify-center bg-zinc-50 font-sans dark:bg-black">
      <Auth />
    </div>
  );
}