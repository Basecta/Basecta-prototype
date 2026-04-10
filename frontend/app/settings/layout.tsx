import { SiteHeader } from "@/components/site-header"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
      <SiteHeader showSidebarTrigger={false} />
      <main className="pt-(--header-height) min-h-screen">
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
