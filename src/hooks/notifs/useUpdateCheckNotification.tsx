import { useEffect, useState } from 'react'
import { useNotifications } from '../../context/notifications.js'
import { Text } from '../../ink.js'
import { execSync } from 'child_process'
import { logForDebugging } from '../../utils/debug.js'
import { getIsRemoteMode } from '../../bootstrap/state.js'

/**
 * Hook that quietly checks for updates in the background on startup.
 * If an update is available, displays a notification in the bottom right
 * prompting the user to run /update.
 */
export function useUpdateCheckNotification() {
  const { addNotification } = useNotifications()
  const [updateInfo, setUpdateInfo] = useState<{
    behindCount: string
    latestCommit: string
  } | null>(null)

  // Check for updates in the background on mount
  useEffect(() => {
    if (getIsRemoteMode()) {
      return
    }

    const checkForUpdates = () => {
      try {
        const cwd = process.cwd()

        // Fetch updates from origin silently (suppress output)
        execSync('git fetch origin', {
          cwd,
          stdio: 'pipe',
        })

        // Get the number of commits behind origin/main
        const behindCount = execSync(
          'git rev-list HEAD..origin/main --count',
          {
            cwd,
            encoding: 'utf-8',
            stdio: 'pipe',
          },
        ).trim()

        if (behindCount === '0') {
          logForDebugging('Update check: Already up to date')
          return
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

        logForDebugging(
          `Update check: ${behindCount} update(s) available - ${latestCommit}`,
        )

        setUpdateInfo({ behindCount, latestCommit })
      } catch (error) {
        // Silently fail - don't bother user if check fails
        logForDebugging(`Update check failed: ${error}`)
      }
    }

    // Run check after a short delay to not impact startup performance
    const timer = setTimeout(checkForUpdates, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Show notification when update is detected
  useEffect(() => {
    if (getIsRemoteMode()) {
      return
    }

    if (!updateInfo) {
      return
    }

    addNotification({
      key: 'update-available',
      jsx: (
        <>
          <Text color="yellow">New Update available!</Text>
          <Text dimColor={true}>
            {' '}
            {updateInfo.behindCount} commit(s) behind · Latest:{' '}
            {updateInfo.latestCommit}
          </Text>
          <Text dimColor={true}> Run /update to apply</Text>
        </>
      ),
      priority: 'low',
      timeoutMs: 15000,
    })

    logForDebugging(
      `Showing update notification: ${updateInfo.behindCount} update(s) available`,
    )
  }, [updateInfo, addNotification])
}
