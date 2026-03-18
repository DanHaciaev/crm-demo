import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/comp/AppSidebar"
import { AppTable } from "@/components/comp/AppTable"

export default function Clients() {
    return (
        <SidebarProvider>
            <AppSidebar />

            <main className="py-4 px-5 w-full">
                <SidebarTrigger />

                <span className="ml-10 text-xl absolute top-4">
                    Clients
                </span>

                <AppTable />

            </main>
        </SidebarProvider>
    )
}