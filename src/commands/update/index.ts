import type { Command } from '../../commands.js'

const update = {
  type: 'local',
  name: 'update',
  description: 'Update the project (runs update.bat on Windows, update.sh on Linux/macOS)',
  aliases: ['upgrade'],
  load: () => import('./update.js'),
} satisfies Command

export default update
