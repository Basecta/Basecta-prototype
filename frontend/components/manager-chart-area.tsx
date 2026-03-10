"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface DataPoint {
  month: string
  value: number
}

interface ManagerChartAreaProps {
  avgBiodiversityData: DataPoint[]
  avgReliabilityData: DataPoint[]
  totalIncomeData: DataPoint[]
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ManagerChartArea({
  avgBiodiversityData,
  avgReliabilityData,
  totalIncomeData,
}: ManagerChartAreaProps) {
  const [activeMetric, setActiveMetric] = React.useState("biodiversity")

  const dataMap: Record<string, { data: DataPoint[]; title: string; description: string }> = {
    biodiversity: {
      data: avgBiodiversityData,
      title: "Average Biodiversity Credits",
      description: "Average biodiversity credits across all managed farms",
    },
    reliability: {
      data: avgReliabilityData,
      title: "Average Reliability Score",
      description: "Average reliability score trend for managed farms",
    },
    income: {
      data: totalIncomeData,
      title: "Total Income Per Month",
      description: "Combined monthly income from all managed farms",
    },
  }

  const active = dataMap[activeMetric]

  return (
    <div className="px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>{active.title}</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              {active.description}
            </span>
            <span className="@[540px]/card:hidden">Trend data</span>
          </CardDescription>
          <CardAction>
            <ToggleGroup
              multiple={false}
              value={activeMetric ? [activeMetric] : []}
              onValueChange={(value) => {
                setActiveMetric(value[0] ?? "biodiversity")
              }}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
            >
              <ToggleGroupItem value="biodiversity">Credits</ToggleGroupItem>
              <ToggleGroupItem value="reliability">Reliability</ToggleGroupItem>
              <ToggleGroupItem value="income">Income</ToggleGroupItem>
            </ToggleGroup>
            <Select
              value={activeMetric}
              onValueChange={(value) => {
                if (value !== null) {
                  setActiveMetric(value)
                }
              }}
            >
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select metric"
              >
                <SelectValue placeholder="Credits" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="biodiversity" className="rounded-lg">Credits</SelectItem>
                <SelectItem value="reliability" className="rounded-lg">Reliability</SelectItem>
                <SelectItem value="income" className="rounded-lg">Income</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={active.data}>
              <defs>
                <linearGradient id="fillManagerValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="value"
                type="natural"
                fill="url(#fillManagerValue)"
                stroke="var(--color-value)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
