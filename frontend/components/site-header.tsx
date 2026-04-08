"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { getNotifications } from "@/lib/api"

function SidebarTriggerWithBadge() {
  const { open } = useSidebar()
  const [hasNotifications, setHasNotifications] = useState(false)

  useEffect(() => {
    getNotifications()
      .then((data: any[]) => setHasNotifications(data.some((n: any) => !n.read)))
      .catch(() => {})
  }, [])

  return (
    <div className="relative shrink-0">
      <SidebarTrigger className="-ml-1" />
      {hasNotifications && !open && (
        <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-red-500 ring-2 ring-background" />
      )}
    </div>
  )
}

export function SiteHeader({ showSidebarTrigger = true }: { showSidebarTrigger?: boolean }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-(--header-height) items-center gap-2 border-b bg-background">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        {showSidebarTrigger ? <SidebarTriggerWithBadge /> : <div className="size-9 -ml-1" />}
        <Link href="/hub" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/basecta_logo_notext.png" alt="Basecta logo" width={28} height={28} />
          <h1 className="text-base font-semibold">Basecta</h1>
        </Link>
      </div>
    </header>
  )
}
