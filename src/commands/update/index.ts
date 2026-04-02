import type { Command } from '../../commands.js'

const update = {
  type: 'local',
  name: 'update',
  description: 'Update the project by running update.bat',
  aliases: ['upgrade'],
  load: () => import('./update.js'),
} satisfies Command

export default update
