import fs from "node:fs/promises"
import path from "node:path"

import { createCoverageMap } from "@vitest/istanbul-lib-coverage"
import type { CoverageMapData } from "@vitest/istanbul-lib-coverage"
import { create as createReport, createContext } from "@vitest/istanbul-lib-report"
import { createSourceMapStore } from "@vitest/istanbul-lib-source-maps"
import bun from "bun"

const isCoverageMapData = (value: unknown): value is CoverageMapData => typeof value === "object" && value !== null

/** Merges the coverage from every process in `rawDir`, maps it back to the source, and writes a text and lcov report. */
export const reportCoverage = async (rawDir: string, reportDir: string) => {
  const rawFiles = await fs.readdir(rawDir)
  if (rawFiles.length === 0) return

  const rawCoverages = await Promise.all(
    rawFiles.map(async (rawFile): Promise<unknown> => bun.file(path.join(rawDir, rawFile)).json()),
  )
  const coverageMap = createCoverageMap({})
  for (const rawCoverage of rawCoverages) if (isCoverageMapData(rawCoverage)) coverageMap.merge(rawCoverage)

  const sourceCoverageMap = await createSourceMapStore().transformCoverage(coverageMap)
  const context = createContext({ dir: reportDir, coverageMap: sourceCoverageMap })
  createReport("text").execute(context)
  createReport("lcovonly").execute(context)
}
