"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/comp/AppSidebar";
import UserPage from "@/components/comp/User";
import { Button } from "@/components/ui/button";
import client from "@/app/api/client";

export default function User() {
  const handleSignOut = async () => {
    await client.auth.signOut();
    // Optional: redirect user after sign-out
    window.location.href = "/";
  };

  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="py-4 px-5 w-full">
        <div className="flex items-center justify-between">
          <SidebarTrigger />

          <Button onClick={handleSignOut}>Sign out</Button>
        </div>

        <UserPage />
      </main>
    </SidebarProvider>
  );
}
