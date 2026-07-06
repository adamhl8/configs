#!/usr/bin/env nub

import fs from "node:fs"
import path from "node:path"

const GITIGNORE_BASE_PATH = path.resolve(import.meta.dirname, "../configs/gitignore.base")
const END_MARKER =
  "# The above patterns are managed by @adamhl8/configs. Anything manually added above this line will be replaced."

/** Rebuilds the managed region above the marker, keeping what's below it (the whole file when there's no marker). */
const mergeGitignore = (currentContent: string, blockBody: string): string => {
  const block = [blockBody, END_MARKER].filter(Boolean).join("\n")
  const existingContent = (currentContent.split(END_MARKER).at(-1) ?? "").trim()
  return existingContent ? `${block}\n\n${existingContent}\n` : `${block}\n`
}

const gitignorePath = ".gitignore"
const blockBody = fs.readFileSync(GITIGNORE_BASE_PATH, "utf8").trim()
const currentContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : ""

const merged = mergeGitignore(currentContent, blockBody)
if (merged !== currentContent) fs.writeFileSync(gitignorePath, merged)
