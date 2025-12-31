#!/usr/bin/env bun
// CLI entry point for standalone binary

import { spawn } from "bun"

const args = process.argv.slice(2)
const command = args[0] || "start"

async function main() {
  switch (command) {
    case "start":
      console.log("Starting Claude Usage Dashboard...")
      // Start the server
      await import("./server/index.ts")
      break

    case "stats":
      // Show quick stats without starting server
      const { getTokenStats } = await import("./server/parser.ts")
      const stats = await getTokenStats()
      console.log("\nClaude Usage Stats:")
      console.log(`Total Tokens: ${stats.totalTokens.toLocaleString()}`)
      console.log(`Total Cost: $${stats.totalCostUSD.toFixed(2)}`)
      console.log(`Today's Cost: $${stats.todayCostUSD.toFixed(2)}`)
      console.log(`Sessions: ${stats.totalSessions}`)
      console.log(`Cache Efficiency: ${stats.cacheEfficiency.toFixed(1)}%`)
      process.exit(0)
      break

    case "open":
      // Open browser to dashboard
      const url = "http://localhost:3456"
      const opener =
        process.platform === "darwin"
          ? "open"
          : process.platform === "win32"
          ? "start"
          : "xdg-open"
      spawn([opener, url])
      console.log(`Opening ${url}...`)
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
Claude Usage Dashboard v1.0.0

Usage: claude-usage [command]

Commands:
  start       Start the dashboard server (default)
  stats       Show quick token statistics
  open        Open dashboard in browser
  version     Show version number
  help        Show this help message

Examples:
  claude-usage                # Start server
  claude-usage stats          # Quick stats
  claude-usage open           # Open in browser
`)
      process.exit(0)
      break
  }
}

main()
