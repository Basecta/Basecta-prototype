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
import { logoutAuth } from "@/lib/auth-store"
import { LayoutDashboardIcon, UploadIcon, Flower } from "lucide-react"

const staticNavItems = [
  { title: "Assets", url: "/data-upload", icon: UploadIcon },
  { title: "Nature Credits", url: "/credits", icon: Flower },
]

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ username: string; email: string } | null>(null)
  const [dashboardHref, setDashboardHref] = useState('/dashboard')

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))
  }, [])

  useEffect(() => {
    const match = pathname.match(/^\/dashboard\/([^/]+)$/)
    if (match) {
      localStorage.setItem('currentFarmDashboardId', match[1])
      setDashboardHref(`/dashboard/${match[1]}`)
    } else {
      const savedId = localStorage.getItem('currentFarmDashboardId')
      if (savedId) setDashboardHref(`/dashboard/${savedId}`)
    }
  }, [pathname])

  const handleLogout = async () => {
    await logoutAuth()
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
              {staticNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.username || "User",
            email: user?.email || "",
            avatar: "",
          }}
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
