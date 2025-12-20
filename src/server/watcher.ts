import chokidar from "chokidar"
import { join } from "node:path"

const CLAUDE_DIR = join(process.env.HOME ?? "", ".claude")
const STATS_FILE = join(CLAUDE_DIR, "stats-cache.json")
const PROJECTS_DIR = join(CLAUDE_DIR, "projects")

type ChangeCallback = () => void

export function createWatcher(onChange: ChangeCallback): chokidar.FSWatcher {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const DEBOUNCE_MS = 150

  const debouncedOnChange = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      onChange()
      debounceTimer = null
    }, DEBOUNCE_MS)
  }

  const watcher = chokidar.watch([STATS_FILE, join(PROJECTS_DIR, "**/*.jsonl")], {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  })

  watcher
    .on("change", debouncedOnChange)
    .on("add", debouncedOnChange)
    .on("error", (error) => console.error("Watcher error:", error))

  return watcher
}
