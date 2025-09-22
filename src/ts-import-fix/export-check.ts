import fs from "node:fs/promises"
import path from "node:path"
import pc from "picocolors"
import { attempt, err, isErr } from "ts-explicit-errors"
import ts from "typescript"

export async function checkExports(filePaths: string[]) {
  const EXPORT_ERRORS: string[] = []

  const exportCheckResult = await attempt(() => {
    const filePromises = filePaths.map(async (filePath) => {
      const filePathParts = path.parse(filePath)
      if (filePathParts.name === "index") return

      const sourceCode = await fs.readFile(filePath, "utf8")
      const sourceFile = ts.createSourceFile(filePathParts.base, sourceCode, ts.ScriptTarget.Latest, true)

      const exportDeclarations: ts.ExportDeclaration[] = []

      const visit = (node: ts.Node) => {
        if (ts.isExportDeclaration(node)) exportDeclarations.push(node)
        ts.forEachChild(node, visit)
      }
      visit(sourceFile)

      if (exportDeclarations.length === 0) return

      const exportDeclarationText = exportDeclarations.map((declaration) => declaration.getText()).join("\n")
      EXPORT_ERRORS.push(`${pc.redBright("✗")} ${pc.blue(filePath)}\n${pc.dim(exportDeclarationText)}\n`)
    })

    return Promise.all(filePromises)
  })

  if (isErr(exportCheckResult)) return err("something went wrong when checking exports", exportCheckResult)
  if (EXPORT_ERRORS.length > 0) return err(`found export declarations:\n${EXPORT_ERRORS.join("\n")}`, undefined)

  return
}
