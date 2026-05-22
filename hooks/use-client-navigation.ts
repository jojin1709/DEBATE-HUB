"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

// Helper to patch window.history so that pushState and replaceState emit events.
// This allows other client components on the page to react immediately to URL updates.
const patchHistory = () => {
  if (typeof window === "undefined") return
  if ((window as any)._patchedHistory) return
  (window as any)._patchedHistory = true

  const pushState = window.history.pushState
  window.history.pushState = function (...args) {
    const res = pushState.apply(this, args)
    window.dispatchEvent(new Event("pushstate"))
    window.dispatchEvent(new Event("locationchange"))
    return res
  }

  const replaceState = window.history.replaceState
  window.history.replaceState = function (...args) {
    const res = replaceState.apply(this, args)
    window.dispatchEvent(new Event("replacestate"))
    window.dispatchEvent(new Event("locationchange"))
    return res
  }

  window.addEventListener("popstate", () => {
    window.dispatchEvent(new Event("locationchange"))
  })
}

export function useClientNavigation() {
  const router = useRouter()

  const getParams = useCallback(() => {
    if (typeof window === "undefined") return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  }, [])

  const [searchParams, setSearchParams] = useState<URLSearchParams>(getParams())

  useEffect(() => {
    patchHistory()
    let active = true

    const handleLocationChange = () => {
      setTimeout(() => {
        if (active) {
          setSearchParams(getParams())
        }
      }, 0)
    }

    window.addEventListener("locationchange", handleLocationChange)
    return () => {
      active = false
      window.removeEventListener("locationchange", handleLocationChange)
    }
  }, [getParams])

  const navigate = useCallback((tab: string, category?: string) => {
    if (typeof window === "undefined") return

    // If not on the homepage, perform a standard router navigation to home with query params
    if (window.location.pathname !== "/") {
      const params = new URLSearchParams()
      params.set("tab", tab)
      if (category && category !== "all") {
        params.set("category", category)
      }
      router.push(`/?${params.toString()}`)
      return
    }

    // If on homepage, perform a fast client-side state update using history API
    const params = new URLSearchParams(window.location.search)
    params.set("tab", tab)
    if (category) {
      if (category === "all") {
        params.delete("category")
      } else {
        params.set("category", category)
      }
    } else if (tab === "home") {
      // Clear category when switching back to main home tab to reset filters
      params.delete("category")
    }

    const newUrl = `/?${params.toString()}`
    window.history.pushState(null, "", newUrl)
  }, [router])

  const setCategory = useCallback((category: string) => {
    if (typeof window === "undefined") return

    if (window.location.pathname !== "/") {
      const params = new URLSearchParams()
      params.set("tab", "home")
      if (category !== "all") {
        params.set("category", category)
      }
      router.push(`/?${params.toString()}`)
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (category === "all") {
      params.delete("category")
    } else {
      params.set("category", category)
    }
    const newUrl = `/?${params.toString()}`
    window.history.pushState(null, "", newUrl)
  }, [router])

  const activeTab = searchParams.get("tab") || "home"
  const activeCategory = searchParams.get("category") || "all"

  return {
    activeTab,
    activeCategory,
    navigate,
    setCategory,
    searchParams,
  }
}
