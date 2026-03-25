"use client";

import React from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/comp/AppSidebar";
import Documents from "@/components/comp/Documents";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="p-4 w-full ">
        <SidebarTrigger />

        <Documents />
      </main>
    </SidebarProvider>
  );
};

export default Dashboard;
