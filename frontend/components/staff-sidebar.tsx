"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { logoutStaffAuth } from "@/lib/staff-auth-store"
import { getStaffNotifications } from "@/lib/api"
import { LayoutDashboardIcon, LeafIcon, ClipboardListIcon, UsersIcon, SettingsIcon } from "lucide-react"

const NAV_ITEMS: { label: string; href: string; icon: React.ElementType; roles: string[] }[] = [
  { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboardIcon, roles: ["admin", "ecologist", "surveyor"] },
  { label: "Surveys", href: "/staff/surveys", icon: ClipboardListIcon, roles: ["admin", "ecologist", "surveyor"] },
  { label: "Biodiversity Data", href: "/staff/biodiversity", icon: LeafIcon, roles: ["admin", "ecologist"] },
  { label: "Users", href: "/staff/users", icon: UsersIcon, roles: ["admin"] },
]

export function StaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [staff, setStaff] = useState<{ full_name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    const staffData = localStorage.getItem("staff")
    if (staffData) setStaff(JSON.parse(staffData))
  }, [])

  const handleLogout = async () => {
    await logoutStaffAuth()
    localStorage.removeItem("staff")
    router.push("/staff/login")
  }

  const visibleItems = staff
    ? NAV_ITEMS.filter(item => item.roles.includes(staff.role))
    : []

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Staff Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton tooltip={item.label} render={<Link href={item.href} />}>
                    <item.icon />
                    <span>{item.label}</span>
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
            name: staff?.full_name || "Staff",
            email: staff?.email || "",
            avatar: "",
          }}
          onLogout={handleLogout}
          fetchNotifications={getStaffNotifications}
          notificationsHref="/staff/notifications"
          settingsHref="/staff/settings"
        />
      </SidebarFooter>
    </Sidebar>
  )
}
