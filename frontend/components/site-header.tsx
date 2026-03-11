import Image from "next/image"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-(--header-height) items-center gap-2 border-b bg-background">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Image src="/logo_notext.png" alt="Basecta logo" width={28} height={28} />
        <h1 className="text-base font-semibold">Basecta</h1>
      </div>
    </header>
  )
}
