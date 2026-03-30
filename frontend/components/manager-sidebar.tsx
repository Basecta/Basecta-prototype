"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { LayoutDashboardIcon } from "lucide-react"

export function ManagerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ username: string; email: string } | null>(null)
  const [dashboardHref, setDashboardHref] = useState('/manager-dashboard')

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))
  }, [])

  useEffect(() => {
    const match = pathname.match(/^\/manager-dashboard\/([^/]+)$/)
    if (match) {
      localStorage.setItem('currentManagerDashboardId', match[1])
      setDashboardHref(`/manager-dashboard/${match[1]}`)
    } else {
      const savedId = localStorage.getItem('currentManagerDashboardId')
      if (savedId) setDashboardHref(`/manager-dashboard/${savedId}`)
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" render={<Link href={dashboardHref} />}>
                  <LayoutDashboardIcon />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.username || "Manager",
            email: user?.email || "",
            avatar: "",
          }}
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
