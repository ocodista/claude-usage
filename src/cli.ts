#!/usr/bin/env bun
// CLI entry point for standalone binary

import { spawn } from "bun"

const args = process.argv.slice(2)
const command = args[0] || "start"

function openBrowser() {
  const url = "http://localhost:3190"
  const opener =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
      ? "start"
      : "xdg-open"
  spawn([opener, url])
}

async function main() {
  switch (command) {
    case "start":
      // Open browser after a short delay to let server start
      setTimeout(openBrowser, 500)
      // Start the server
      await import("./server/index.ts")
      break

    case "stats":
      // Show quick stats without starting server
      const { getTokenStats } = await import("./server/parser.ts")
      const stats = await getTokenStats()
      console.log("\nClaude Code Usage Stats:")
      console.log(`Total Tokens: ${stats.totalTokens.toLocaleString()}`)
      console.log(`Total Cost: $${stats.totalCostUSD.toFixed(2)}`)
      console.log(`Today's Cost: $${stats.todayCostUSD.toFixed(2)}`)
      console.log(`Sessions: ${stats.totalSessions}`)
      console.log(`Cache Efficiency: ${stats.cacheEfficiency.toFixed(1)}%`)
      process.exit(0)
      break

    case "open":
      openBrowser()
      console.log("Opening http://localhost:3190...")
      process.exit(0)
      break

    case "version":
      const pkg = await import("../package.json")
      console.log(`v${pkg.version}`)
      process.exit(0)
      break

    case "help":
    default:
      console.log(`
Claude Code Usage Dashboard

Usage: claude-code-usage [command]

Commands:
  start       Start dashboard and open browser (default)
  stats       Show quick token statistics
  open        Open dashboard in browser
  version     Show version number
  help        Show this help message

Examples:
  claude-code-usage           # Start and open browser
  claude-code-usage stats     # Quick stats
`)
      process.exit(0)
      break
  }
}

main()
