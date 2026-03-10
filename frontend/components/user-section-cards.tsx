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
  biodiversityCredits: number
  income: number
  reliabilityScore: number
  uploadedCategories: {
    hedgerows: boolean
    waterways: boolean
    soil: boolean
  }
}

export function UserSectionCards({
  biodiversityCredits,
  income,
  reliabilityScore,
  uploadedCategories,
}: UserSectionCardsProps) {
  const uploadCount = [
    uploadedCategories.hedgerows,
    uploadedCategories.waterways,
    uploadedCategories.soil,
  ].filter(Boolean).length

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Biodiversity Credits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {biodiversityCredits.toLocaleString()}
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

      <Card className="@container/card">
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
      </Card>
    </div>
  )
}
