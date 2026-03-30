"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface UserSectionCardsProps {
  natureCredits: number
  income: number
  reliabilityScore: number
  uploadedCategories: {
    hedgerows: boolean
    waterways: boolean
    soil: boolean
  }
  showUploads?: boolean
  variant?: 'green' | 'blue'
}

export function UserSectionCards({
  natureCredits,
  income,
  reliabilityScore,
  uploadedCategories,
  showUploads = true,
  variant = 'green',
}: UserSectionCardsProps) {
  const uploadCount = [
    uploadedCategories.hedgerows,
    uploadedCategories.waterways,
    uploadedCategories.soil,
  ].filter(Boolean).length

  return (
    <div className={`grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs *:data-[slot=card]:ring-0 *:data-[slot=card]:border-2 ${variant === 'blue' ? '*:data-[slot=card]:border-blue-200 dark:*:data-[slot=card]:border-blue-800' : '*:data-[slot=card]:border-emerald-200 dark:*:data-[slot=card]:border-emerald-800'} lg:px-6 @xl/main:grid-cols-2 dark:*:data-[slot=card]:bg-card ${showUploads ? '@5xl/main:grid-cols-4' : '@5xl/main:grid-cols-3'}`}>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Nature Credits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {natureCredits.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total credits earned across all categories
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Monthly Income</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            &euro;{income.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Revenue increasing steadily <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Income from biodiversity credit sales
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Reliability Score</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {reliabilityScore}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {reliabilityScore >= 60 ? (
                <>
                  <TrendingUpIcon />
                  Good
                </>
              ) : (
                <>
                  <TrendingDownIcon />
                  Needs work
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {reliabilityScore >= 70
              ? "Great reliability"
              : reliabilityScore >= 50
                ? "Good progress"
                : "Room for improvement"}{" "}
            {reliabilityScore >= 50 ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Based on data quality and consistency
          </div>
        </CardFooter>
      </Card>

      {showUploads && <Card className="@container/card">
        <CardHeader>
          <CardDescription>Data Uploads</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {uploadCount}/3
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {uploadCount === 3 ? (
                <>
                  <TrendingUpIcon />
                  Complete
                </>
              ) : (
                <>
                  <TrendingDownIcon />
                  Pending
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {uploadedCategories.hedgerows ? "Hedgerows " : ""}
            {uploadedCategories.waterways ? "Waterways " : ""}
            {uploadedCategories.soil ? "Soil " : ""}
            {uploadCount === 0 && "No data uploaded yet"}
          </div>
          <div className="text-muted-foreground">
            Upload hedgerows, waterways, and soil data
          </div>
        </CardFooter>
      </Card>}
    </div>
  )
}
