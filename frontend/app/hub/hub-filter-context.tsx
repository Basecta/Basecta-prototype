"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

export type FilterType = "all" | "farm" | "manager" | "investor"

interface HubFilterContextType {
  search: string
  setSearch: (v: string) => void
  activeFilter: FilterType
  setActiveFilter: (v: FilterType) => void
}

const HubFilterContext = createContext<HubFilterContextType | undefined>(undefined)

const SEARCH_KEY = "hub-filter-search"
const FILTER_KEY = "hub-filter-active"

function readSession<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  const v = sessionStorage.getItem(key)
  return v !== null ? (v as unknown as T) : fallback
}

export function HubFilterProvider({ children }: { children: ReactNode }) {
  const [search, setSearchRaw] = useState("")
  const [activeFilter, setActiveFilterRaw] = useState<FilterType>("all")

  useEffect(() => {
    setSearchRaw(readSession(SEARCH_KEY, ""))
    setActiveFilterRaw(readSession(FILTER_KEY, "all") as FilterType)
  }, [])

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v)
    sessionStorage.setItem(SEARCH_KEY, v)
  }, [])

  const setActiveFilter = useCallback((v: FilterType) => {
    setActiveFilterRaw(v)
    sessionStorage.setItem(FILTER_KEY, v)
  }, [])

  return (
    <HubFilterContext.Provider value={{ search, setSearch, activeFilter, setActiveFilter }}>
      {children}
    </HubFilterContext.Provider>
  )
}

export function useHubFilter() {
  const ctx = useContext(HubFilterContext)
  if (!ctx) throw new Error("useHubFilter must be used within HubFilterProvider")
  return ctx
}
