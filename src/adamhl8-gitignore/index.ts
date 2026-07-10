#!/usr/bin/env bun

import path from "node:path"

import bun from "bun"

const GITIGNORE_BASE_PATH = path.resolve(import.meta.dir, "../configs/gitignore.base")
const END_MARKER =
  "# The above patterns are managed by @adamhl8/configs. Anything manually added above this line will be replaced."

/** Rebuilds the managed region above the marker, keeping what's below it (the whole file when there's no marker). */
const mergeGitignore = (currentContent: string, blockBody: string): string => {
  const block = [blockBody, END_MARKER].filter(Boolean).join("\n")
  const existingContent = (currentContent.split(END_MARKER).at(-1) ?? "").trim()
  return existingContent ? `${block}\n\n${existingContent}\n` : `${block}\n`
}

const gitignorePath = ".gitignore"
const blockBody = (await bun.file(GITIGNORE_BASE_PATH).text()).trim()
const currentContentFile = bun.file(gitignorePath)
const currentContent = (await currentContentFile.exists()) ? await currentContentFile.text() : ""

const merged = mergeGitignore(currentContent, blockBody)
if (merged !== currentContent) await bun.write(gitignorePath, merged)
