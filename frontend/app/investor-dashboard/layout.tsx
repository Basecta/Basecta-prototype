"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { InvestorSidebar } from "@/components/investor-sidebar"
import { SiteHeader } from "@/components/site-header"

export default function InvestorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SiteHeader />
      <InvestorSidebar variant="inset" />
      <SidebarInset className="pt-(--header-height)">
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
