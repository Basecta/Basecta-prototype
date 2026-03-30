"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { Search, X } from "lucide-react"
import { useHubFilter, FilterType } from "@/app/hub/hub-filter-context"

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All Dashboards",      value: "all"      },
  { label: "Farm Dashboards",     value: "farm"     },
  { label: "Manager Dashboards",  value: "manager"  },
  { label: "Investor Dashboards", value: "investor" },
]

export function HubSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string; email: string } | null>(null)
  const { search, setSearch, activeFilter, setActiveFilter } = useHubFilter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2 px-2">

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search dashboards…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-8 pr-8 py-1.5 text-sm placeholder:text-muted-foreground hover:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-sm text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter options */}
            <div className="flex flex-col gap-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`w-full text-left rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                    activeFilter === f.value
                      ? "bg-primary text-primary-foreground font-medium hover:bg-primary/80"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name:   user?.username || "User",
            email:  user?.email    || "",
            avatar: "",
          }}
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
