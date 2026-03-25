import { useState, useCallback, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Landing } from "@/pages/landing"
import { Dashboard } from "@/pages/dashboard"
import { QuestView } from "@/pages/quest"
import { Profile } from "@/pages/profile"
import { NotFound } from "@/pages/not-found"
import { CreateQuest } from "@/pages/create-quest"

const VALID_PAGES = ["landing", "dashboard", "profile", "create-quest"] as const
type Page = (typeof VALID_PAGES)[number] | "quest" | "404"

interface AppState {
  page: Page
  questId: number | null
}

function pathToPage(pathname: string): { page: Page; questId: number | null } {
  const clean = pathname === "" || pathname === "/" ? "/" : pathname

  if (clean === "/") return { page: "landing", questId: null }
  if (clean === "/dashboard") return { page: "dashboard", questId: null }
  if (clean === "/profile") return { page: "profile", questId: null }
  if (clean === "/create-quest") return { page: "create-quest", questId: null }

  const qMatch = clean.match(/^\/quest\/(\d+)$/)
  if (qMatch) return { page: "quest", questId: Number(qMatch[1]) }

  return { page: "404", questId: null }
}

function pageToPath(page: Page, questId: number | null): string {
  if (page === "landing") return "/"
  if (page === "quest" && questId !== null) return `/quest/${questId}`
  return `/${page}`
}

export default function App() {
  const [state, setState] = useState<AppState>(() => pathToPage(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => {
      setState(pathToPage(window.location.pathname))
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navigate = useCallback((p: string) => {
    const page = (VALID_PAGES as readonly string[]).includes(p) ? (p as Page) : "404"
    const path = pageToPath(page, null)
    window.history.pushState({}, "", path)
    setState({ page, questId: null })
  }, [])

  const onSelectQuest = useCallback((id: number) => {
    const path = pageToPath("quest", id)
    window.history.pushState({}, "", path)
    setState({ page: "quest", questId: id })
  }, [])

  return (
    <Layout onNavigate={navigate} activePage={state.page === "quest" ? "dashboard" : state.page}>
      {state.page === "quest" && state.questId !== null ? (
        <QuestView questId={state.questId} onBack={() => navigate("dashboard")} />
      ) : state.page === "landing" ? (
        <Landing onNavigate={navigate} />
      ) : state.page === "dashboard" ? (
        <Dashboard 
          onSelectQuest={onSelectQuest} 
          onCreateQuest={() => navigate("create-quest")} 
        />
      ) : state.page === "create-quest" ? (
         <CreateQuest onBack={() => navigate("dashboard")} />
      ) : state.page === "profile" ? (
        <Profile />
      ) : (
        <NotFound onNavigate={navigate} />
      )}
    </Layout>
  )
}
