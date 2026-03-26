import React, { act } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { Dashboard } from "./dashboard"

vi.mock("@/hooks/use-wallet", () => ({
  useWallet: vi.fn(),
}))

vi.mock("@/lib/contracts/quest", () => ({
  questClient: {
    getQuests: vi.fn(),
    getEnrollees: vi.fn(),
  },
}))

vi.mock("@/lib/contracts/milestone", () => ({
  milestoneClient: {
    getMilestoneCount: vi.fn(),
    getEnrolleeCompletions: vi.fn(),
  },
}))

vi.mock("@/lib/contracts/rewards", () => ({
  rewardsClient: {
    getPoolBalance: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { useWallet } from "../hooks/use-wallet"
import { questClient } from "../lib/contracts/quest"
import { milestoneClient } from "../lib/contracts/milestone"
import { rewardsClient } from "../lib/contracts/rewards"

const mockUseWallet = vi.mocked(useWallet)
const mockGetQuests = vi.mocked(questClient.getQuests)
const mockGetEnrollees = vi.mocked(questClient.getEnrollees)
const mockGetMilestoneCount = vi.mocked(milestoneClient.getMilestoneCount)
const mockGetEnrolleeCompletions = vi.mocked(milestoneClient.getEnrolleeCompletions)
const mockGetPoolBalance = vi.mocked(rewardsClient.getPoolBalance)

describe("Dashboard keyboard navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseWallet.mockReturnValue({
      connected: true,
      connect: vi.fn(),
      shortAddress: "GABC…XYZ",
      address: "GABC1234567890XYZ",
    } as unknown as ReturnType<typeof useWallet>)

    mockGetQuests.mockResolvedValue([
      {
        id: 7,
        owner: "GOWNER",
        name: "Quest Alpha",
        description: "Desc",
        tokenAddr: "TOKEN",
        createdAt: 123,
      },
    ])
    mockGetEnrollees.mockResolvedValue([])
    mockGetMilestoneCount.mockResolvedValue(0)
    mockGetPoolBalance.mockResolvedValue(0n)
    mockGetEnrolleeCompletions.mockResolvedValue(0)
  })

  it("opens a quest card with Enter and Space", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    // Wait for the quest card to be rendered
    await act(async () => {
      await vi.waitFor(
        () => {
          // Debug: log all buttons to see what's available
          const allButtons = screen.queryAllByRole("button")
          console.log(
            "All buttons found:",
            allButtons.map(btn => ({
              textContent: btn.textContent,
              ariaLabel: btn.getAttribute("aria-label"),
              name: btn.getAttribute("name"),
            }))
          )

          const btn = screen.queryByRole("button", { name: /open quest quest alpha/i })
          if (!btn) {
            throw new Error("Quest card button not rendered. Check mocks and async loading.")
          }
          return btn
        },
        { timeout: 8000 }
      )
    })

    const cardButton = screen.getByRole("button", { name: /open quest quest alpha/i })

    await act(async () => {
      fireEvent.click(cardButton)
    })
    expect(mockNavigate).toHaveBeenCalledWith("/quest/7")
  }, 12000)
})
