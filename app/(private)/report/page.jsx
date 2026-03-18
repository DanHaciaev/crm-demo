import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/comp/AppSidebar";
import GitReport from "@/components/comp/GitReport";

export default function Report() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="py-4 px-5 w-full">
        <SidebarTrigger />

        <span className="ml-10 text-xl absolute top-4">Report</span>

        <GitReport />
      </main>
    </SidebarProvider>
  );
}
