import { useState, useEffect, useCallback } from "react"
import { 
  Wallet, 
  Plus, 
  Sparkles, 
  Coins, 
  Users, 
  Target, 
  ChevronRight,
  AlertCircle,
  Loader2,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/hooks/use-wallet"
import { formatTokens } from "@/lib/utils"
import { questClient, type QuestInfo } from "@/lib/contracts/quest"

interface DashboardProps {
  onSelectQuest: (id: number) => void
  onCreateQuest: () => void
}

interface QuestWithStats extends QuestInfo {
  enrolleeCount: number
  milestoneCount: number
  poolBalance: bigint
  completedCount: number
  isOwned: boolean
}

export function Dashboard({ onSelectQuest, onCreateQuest }: DashboardProps) {
  const { connected, connect, shortAddress, address } = useWallet()
  const [filter, setFilter] = useState<"all" | "owned" | "enrolled">("all")
  const [quests, setQuests] = useState<QuestWithStats[]>([])
  const [totalEarnings, setTotalEarnings] = useState<bigint>(0n)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuests = useCallback(async () => {
    if (!address) return
    setLoading(true)
    setError(null)
    try {
      const allQuests = await questClient.getQuests()
      const stats = await Promise.all(
        allQuests.map(async (q) => {
          const [enrollees] = await Promise.all([
            questClient.getEnrollees(q.id),
            // Mocking some values for now as per project current status
            Promise.resolve([]), 
            Promise.resolve(0n)
          ])
          
          return {
            ...q,
            enrolleeCount: enrollees.length,
            milestoneCount: 3, // Mock
            poolBalance: 100n * BigInt(Math.floor(Math.random() * 10)), // Mock
            completedCount: q.owner === address ? 0 : 1, // Mock
            isOwned: q.owner === address
          }
        })
      )
      setQuests(stats)
      setTotalEarnings(stats.reduce((acc, q) => acc + (q.isOwned ? 0n : q.poolBalance / 10n), 0n))
    } catch (err) {
      console.error("Failed to fetch quests:", err)
      setError("Failed to load quests from the network.")
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (connected && address) {
      fetchQuests()
    }
  }, [connected, address, fetchQuests])

  const filteredQuests = quests.filter((q) => {
    if (filter === "owned") return q.isOwned
    if (filter === "enrolled") return !q.isOwned
    return true
  })

  // We group all return elements into a single return with one parent div to avoid JSX parsing ambiguity
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {!connected ? (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-dots pointer-events-none" />
          <div className="relative px-4 max-w-lg mx-auto w-full">
            <div className="bg-white border-[3px] border-black shadow-[8px_8px_0_#000] overflow-hidden animate-scale-in">
              <div className="bg-primary border-b-[3px] border-black px-6 py-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider">Dashboard</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-destructive border border-black rounded-full" />
                  <span className="text-xs font-bold text-black">Disconnected</span>
                </div>
              </div>
              <div className="p-8 sm:p-10 text-center">
                <div className="w-20 h-20 bg-primary border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center mb-6 mx-auto">
                  <Wallet className="h-8 w-8 text-black" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black mb-3 text-black">
                  Connect Wallet
                </h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
                  Please connect your Freighter wallet to manage your learning journeys and earnings.
                </p>
                <Button size="lg" onClick={connect} className="shimmer-on-hover border-black border-2 font-black uppercase">
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          <div className="relative bg-primary border-[3px] border-black shadow-[6px_6px_0_#000] p-6 sm:p-8 overflow-hidden">
             <div className="absolute inset-0 bg-diagonal-lines pointer-events-none opacity-20" />
             <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-black" />
                      <span className="text-xs font-black uppercase tracking-widest text-black/70">Welcome to your studio</span>
                   </div>
                   <h1 className="text-3xl sm:text-4xl font-black tabular-nums text-black">
                      {shortAddress}
                   </h1>
                   <div className="flex items-center gap-4 mt-3">
                      <p className="text-xs font-bold opacity-70 uppercase tracking-tighter">
                         {quests.length} Active curricula
                      </p>
                      <div className="h-4 w-[2px] bg-black/20" />
                      <p className="text-sm font-black text-green-800">
                         {formatTokens(Number(totalEarnings))} USDC Staked
                      </p>
                   </div>
                </div>
                <Button variant="secondary" className="shimmer-on-hover px-8 border-black border-2 font-black uppercase group" onClick={onCreateQuest}>
                   <Plus className="h-5 w-5 mr-1 group-hover:rotate-90 transition-transform" />
                   New Quest
                </Button>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b-4 border-black border-dashed">
             <h2 className="text-xl font-black uppercase tracking-widest text-black/80">Active Tracks</h2>
             <div className="flex bg-white border-[3px] border-black shadow-[4px_4px_0_#000]">
                {(["all", "owned", "enrolled"] as const).map((f) => (
                   <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all capitalize border-r-[3px] border-black last:border-r-0 ${
                         filter === f ? "bg-primary text-black" : "bg-white text-black/60 hover:bg-secondary/20"
                      }`}
                   >
                      {f}
                   </button>
                ))}
             </div>
          </div>

          {loading ? (
             <div className="py-24 flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-secondary border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center mb-6">
                   <Loader2 className="h-8 w-8 animate-spin text-black" />
                </div>
                <p className="font-black uppercase tracking-widest text-muted-foreground animate-bounce">Buffering mainnet...</p>
             </div>
          ) : error ? (
             <Card className="border-[3px] border-destructive shadow-[6px_6px_0_#e11d48] bg-white mt-8">
                <CardContent className="py-16 flex flex-col items-center text-center">
                   <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                   <h3 className="text-2xl font-black mb-2 uppercase">RPC Timeout</h3>
                   <p className="text-muted-foreground mb-8 max-w-sm">{error}</p>
                   <Button onClick={fetchQuests} className="bg-destructive hover:bg-destructive/90 text-white border-black border-2 font-black uppercase px-12 stagger-0">
                      Reconnect
                   </Button>
                </CardContent>
             </Card>
          ) : (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {filteredQuests.map((q, i) => (
                   <Card
                      key={q.id}
                      className="neo-lift cursor-pointer group animate-fade-in-up border-black border-[3px] shadow-[4px_4px_0_#000] hover:shadow-[10px_10px_0_#000] active:shadow-[2px_2px_0_#000] transition-all bg-white"
                      style={{ animationDelay: `${i * 100}ms` }}
                      onClick={() => onSelectQuest(q.id)}
                   >
                      <CardHeader className="p-6 pb-2">
                         <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <CardTitle className="text-xl font-black group-hover:text-primary transition-colors truncate">
                                     {q.name}
                                  </CardTitle>
                                  <Badge variant={q.isOwned ? "default" : "secondary"} className="border-black border-2 font-black uppercase text-[10px] tracking-tight py-0.5">
                                     {q.isOwned ? "Maintainer" : "Learner"}
                                  </Badge>
                               </div>
                               <p className="text-sm text-black/60 font-bold line-clamp-1 italic">
                                  {q.description}
                               </p>
                            </div>
                            <div className="w-10 h-10 bg-secondary border-[3px] border-black flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                               <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                            </div>
                         </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-2">
                         <div className="flex flex-wrap items-center gap-3 text-sm mb-6">
                            <Badge variant="secondary" className="gap-2 border-black border-2 py-1.5 px-3 bg-white hover:bg-white/50 transition-none">
                               <Users className="h-3.5 w-3.5" />
                               <span className="font-black tabular-nums">{q.enrolleeCount}</span>
                            </Badge>
                            <Badge variant="secondary" className="gap-2 border-black border-2 py-1.5 px-3 bg-white hover:bg-white/50 transition-none">
                               <Target className="h-3.5 w-3.5" />
                               <span className="font-black tabular-nums">{q.milestoneCount}</span>
                            </Badge>
                            <Badge variant="default" className="gap-2 border-black border-2 py-1.5 px-3 shadow-[2px_2px_0_#000]">
                               <Coins className="h-3.5 w-3.5" />
                               <span className="font-black tabular-nums">{formatTokens(Number(q.poolBalance))}</span>
                            </Badge>
                         </div>

                         {q.milestoneCount > 0 && !q.isOwned && (
                            <div className="space-y-2 mt-4 pt-4 border-t-2 border-dashed border-black/20">
                               <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest leading-none mb-1">
                                  <span>Curriculum Status</span>
                                  <span className="tabular-nums">{q.completedCount}/{q.milestoneCount} Steps</span>
                               </div>
                               <Progress value={(q.completedCount / q.milestoneCount) * 100} className="h-3 border-2 border-black" />
                            </div>
                         )}
                      </CardContent>
                   </Card>
                ))}

                {filteredQuests.length === 0 && (
                   <div className="md:col-span-2 py-12 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-secondary border-[3px] border-black shadow-[6px_6px_0_#000] flex items-center justify-center mb-6">
                         <Search className="h-8 w-8 text-black opacity-30" />
                      </div>
                      <h3 className="text-2xl font-black uppercase mb-2">No Quests</h3>
                      <p className="text-muted-foreground flex items-center gap-2">
                         {filter === 'all' ? 'Try creating a new quest to get started.' : `You haven't ${filter === 'owned' ? 'created' : 'joined'} any quests yet.`}
                      </p>
                   </div>
                )}
             </div>
          )}
        </div>
      )}
    </div>
  )
}
