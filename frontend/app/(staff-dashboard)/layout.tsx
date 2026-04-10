import type { Metadata } from "next"
import { StaffDashboardClientLayout } from "./client-layout"

export const metadata: Metadata = {
  title: "Basecta Staff Portal",
}

export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <StaffDashboardClientLayout>{children}</StaffDashboardClientLayout>
}
