"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { HubSidebar } from "@/components/hub-sidebar"
import { SiteHeader } from "@/components/site-header"
import { HubFilterProvider } from "./hub-filter-context"

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <HubFilterProvider>
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SiteHeader />
      <HubSidebar variant="inset" />
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
    </HubFilterProvider>
  )
}
