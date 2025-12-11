import { useEffect, useState, startTransition } from 'react'
import { configLoader } from '../../services/configLoader'
import type { GitDocAIConfig } from '../../services/configLoader'

/**
 * Hook to subscribe to config changes
 * This will trigger re-renders when the config is updated in memory
 */
export const useConfig = () => {
  const [config, setConfig] = useState<GitDocAIConfig | null>(configLoader.getConfig())
  const [updateTrigger, setUpdateTrigger] = useState(0)

  useEffect(() => {
    // Subscribe to config changes
    const unsubscribe = configLoader.subscribe(() => {
      // Use startTransition to avoid flushSync errors in production
      // This marks the state update as non-urgent
      startTransition(() => {
        setConfig(configLoader.getConfig())
        setUpdateTrigger(prev => prev + 1)
      })
    })

    // Cleanup subscription on unmount
    return unsubscribe
  }, [])

  return { config, updateTrigger }
}
