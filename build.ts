// Bun build script for cross-platform binaries
import { $ } from "bun"
import { mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"

const targets = [
  { platform: "darwin", arch: "x64", ext: "" }, // macOS Intel
  { platform: "darwin", arch: "arm64", ext: "" }, // macOS Apple Silicon
  { platform: "linux", arch: "x64", ext: "" }, // Linux
  { platform: "windows", arch: "x64", ext: ".exe" }, // Windows
]

async function buildAll() {
  console.log("Building standalone binaries...\n")

  // Create dist directory if it doesn't exist
  if (!existsSync("./dist")) {
    await mkdir("./dist", { recursive: true })
  }

  for (const target of targets) {
    const outfile = `./dist/claude-code-usage-${target.platform}-${target.arch}${target.ext}`

    console.log(`Building ${target.platform}-${target.arch}...`)

    try {
      await $`bun build ./src/cli.ts --compile --target=bun-${target.platform}-${target.arch} --outfile=${outfile}`
      console.log(`✓ Built ${outfile}\n`)
    } catch (error) {
      console.error(`✗ Failed to build ${target.platform}-${target.arch}`)
      console.error(error)
    }
  }

  console.log("All binaries built successfully!")
}

buildAll()
