"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { logoutAuth } from "@/lib/auth-store"

export function InvestorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string; email: string } | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = async () => {
    await logoutAuth()
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent />
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.username || "Investor",
            email: user?.email || "",
            avatar: "",
          }}
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
