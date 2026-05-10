import { useNavigate } from 'react-router-dom'
import { useShortcuts } from '../lib/keyboard/shortcuts'
import { getRunningEntry, startTimer, stopTimer } from '../lib/db/timeEntries'
import { useToast } from './ui/Toast'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'

export function GlobalShortcuts() {
  const navigate = useNavigate()
  const toast = useToast()
  const { atLeast } = useDetailLevel()

  useShortcuts([
    {
      key: ' ',
      description: 'Timer starten/stoppen',
      handler: async () => {
        try {
          const running = await getRunningEntry()
          if (running) {
            await stopTimer()
            toast.success('Timer gestoppt')
          } else {
            await startTimer({})
            toast.success('Timer gestartet')
          }
        } catch (err) {
          toast.error((err as Error).message)
        }
      },
    },
    {
      key: 'n',
      description: 'Neuer Eintrag',
      handler: () => navigate('/entry/new'),
    },
    {
      key: 't',
      description: 'Heute',
      handler: () => navigate('/'),
    },
    {
      key: 'e',
      description: 'Einträge',
      handler: () => navigate('/entries'),
    },
    {
      key: 'p',
      description: 'Projekte',
      handler: () => atLeast('standard') && navigate('/projects'),
    },
    {
      key: 'r',
      description: 'Reports',
      handler: () => atLeast('standard') && navigate('/reports'),
    },
    {
      key: ',',
      description: 'Einstellungen',
      handler: () => navigate('/settings'),
    },
  ])

  return null
}
