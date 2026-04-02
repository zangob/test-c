import type { LocalCommandCall } from '../../types/command.js'
import { execSync } from 'child_process'
import { resolve } from 'path'

export const call: LocalCommandCall = async (_args, _context) => {
  try {
    const updateScript = resolve(process.cwd(), 'update.bat')

    // Run the update.bat script synchronously so user can see output
    execSync(`cmd /c "${updateScript}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    return { type: 'text', value: 'Update completed successfully!' }
  } catch (error) {
    return { type: 'text', value: `Failed to run update script: ${error}` }
  }
}
