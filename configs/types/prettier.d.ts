declare const _default: {
  printWidth: number
  semi: false
  plugins: string[]
  tailwindStylesheet: string
  overrides: (
    | {
        files: string
        options: {
          trailingComma: "none"
          parser?: never
        }
      }
    | {
        files: string
        options: {
          parser: "astro"
          trailingComma?: never
        }
      }
  )[]
}
export default _default
