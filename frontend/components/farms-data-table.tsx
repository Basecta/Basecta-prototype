"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronRightIcon } from "lucide-react"

interface Farm {
  id: string
  name: string
  owner: string
  location: string
  biodiversityCredits: number
  income: number
  reliabilityScore: number
}

interface FarmsDataTableProps {
  farms: Farm[]
}

function getReliabilityBadge(score: number) {
  if (score >= 70) {
    return <Badge variant="outline" className="text-green-600 border-green-300">High</Badge>
  }
  if (score >= 50) {
    return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Medium</Badge>
  }
  return <Badge variant="outline" className="text-red-600 border-red-300">Low</Badge>
}

export function FarmsDataTable({ farms }: FarmsDataTableProps) {
  return (
    <div className="px-4 lg:px-6">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Farm Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Reliability</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {farms.map((farm) => (
              <TableRow key={farm.id} className="group cursor-pointer">
                <TableCell>
                  <Link
                    href={`/manager-dashboard/farm/${farm.id}`}
                    className="font-medium hover:underline cursor-pointer"
                  >
                    {farm.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {farm.owner}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {farm.location}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {farm.biodiversityCredits.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  &euro;{farm.income.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="tabular-nums">{farm.reliabilityScore}%</span>
                    {getReliabilityBadge(farm.reliabilityScore)}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/manager-dashboard/farm/${farm.id}`}
                    className="text-muted-foreground group-hover:text-foreground cursor-pointer"
                  >
                    <ChevronRightIcon className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {farms.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No farms currently under your management.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
