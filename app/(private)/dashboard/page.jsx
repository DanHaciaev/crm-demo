"use client";

import React from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/comp/AppSidebar";
import Charts from "@/components/comp/Charts";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="p-4 w-full">
        <SidebarTrigger />

        <Charts />
      </main>
    </SidebarProvider>
  );
};

export default Dashboard;
