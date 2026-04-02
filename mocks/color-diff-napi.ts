// mocks/color-diff-napi.ts - Mock for the native color-diff-napi module

export type SyntaxTheme = {
  name: string
  colors: Record<string, string>
}

export class ColorDiff {
  constructor(
    private patch: unknown,
    private firstLine: string | null,
    private filePath: string,
    private fileContent: string | undefined
  ) { }

  render(theme: string, width: number, dim: boolean): string[] | null {
    // Return simple line-by-line diff for mock
    const lines: string[] = []
    const patch = this.patch as { lines?: string[] }
    if (patch && Array.isArray(patch.lines)) {
      return patch.lines
    }
    return ['Mock diff output']
  }

  static diff(a: string, b: string): object {
    return {}
  }
}

export class ColorFile {
  constructor(
    private filePath: string,
    private fileContent: string
  ) { }

  render(theme: string, width: number, dim: boolean): string[] | null {
    if (!this.fileContent) {
      return null
    }
    return this.fileContent.split('\n')
  }

  static colorize(path: string, content: string, theme?: string): string {
    return content
  }
}

export function getSyntaxTheme(themeName: string): SyntaxTheme | null {
  return { name: themeName, colors: {} }
}

export default { ColorDiff, ColorFile, getSyntaxTheme }
