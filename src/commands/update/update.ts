import { execSync } from 'child_process'
import { resolve } from 'path'
import type { ToolUseContext } from '../../Tool.js'
import type { LocalCommandResult } from '../../types/command.js'

export async function call(
  _args: string,
  _context: ToolUseContext,
): Promise<LocalCommandResult> {
  const cwd = process.cwd()

  try {
    // Fetch updates from origin
    execSync('git fetch origin', {
      cwd,
      stdio: 'pipe',
    })

    // Get the number of commits behind origin/main
    const behindCount = execSync('git rev-list HEAD..origin/main --count', {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim()

    if (behindCount === '0') {
      return {
        type: 'text',
        value: 'Open Claude Code is already up to date.',
      }
    }

    // Get latest commit message
    const latestCommit = execSync(
      'git log -1 --pretty=format:"%h - %s" origin/main',
      {
        cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
      },
    ).trim()

    // Show update available message with commit info
    console.log(`Update available!`)
    console.log(`New Update: ${latestCommit}`)
    console.log('Running update...')

    // Run the appropriate update script based on OS
    const updateScript = resolve(cwd, process.platform === 'win32' ? 'update.bat' : 'update.sh')
    if (process.platform === 'win32') {
      execSync(`cmd /c "${updateScript}"`, {
        stdio: 'inherit',
        cwd,
      })
    } else {
      execSync(`bash "${updateScript}"`, {
        stdio: 'inherit',
        cwd,
      })
    }

    return { type: 'text', value: '' }
  } catch (error) {
    return {
      type: 'text',
      value: `Failed to check for updates or run update: ${error}`,
    }
  }
}
