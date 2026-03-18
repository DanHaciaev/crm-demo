import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/comp/AppSidebar";
import { UsersTable } from "@/components/comp/Users";

export default function Tasks() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="py-4 px-5 w-full">
        <SidebarTrigger />

        <span className="ml-10 text-xl absolute top-4">Users</span>

        <UsersTable />
      </main>
    </SidebarProvider>
  );
}
