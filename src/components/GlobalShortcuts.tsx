import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShortcuts, type ShortcutBinding } from '../lib/keyboard/shortcuts'
import { getRunningEntry, startTimer, stopTimer } from '../lib/db/timeEntries'
import { useToast } from './ui/Toast'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'
import { Sheet } from './ui/Sheet'

export function GlobalShortcuts() {
  const navigate = useNavigate()
  const toast = useToast()
  const { atLeast } = useDetailLevel()
  const [helpOpen, setHelpOpen] = useState(false)

  const bindings: ShortcutBinding[] = [
    {
      key: ' ',
      description: 'Timer starten / stoppen',
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
      handler: () => {
        if (atLeast('standard')) navigate('/projects')
        else toast.show('Projekte ab Stufe „Standard" verfügbar.')
      },
    },
    {
      key: 'r',
      description: 'Reports',
      handler: () => {
        if (atLeast('standard')) navigate('/reports')
        else toast.show('Reports ab Stufe „Standard" verfügbar.')
      },
    },
    {
      key: 'i',
      description: 'Rechnung',
      handler: () => {
        if (atLeast('proplus')) navigate('/invoice')
        else toast.show('Rechnungen ab Stufe „Pro+" verfügbar.')
      },
    },
    {
      key: ',',
      description: 'Einstellungen',
      handler: () => navigate('/settings'),
    },
    {
      key: '?',
      description: 'Tastatur-Shortcuts anzeigen',
      handler: () => setHelpOpen(true),
    },
  ]

  useShortcuts(bindings)

  return (
    <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Tastatur-Shortcuts" size="sm">
      <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
        {bindings
          .filter((b) => b.key !== '?')
          .map((b) => (
            <li key={b.key} className="flex items-center justify-between gap-3">
              <span>{b.description}</span>
              <kbd className="kbd">{labelForKey(b.key)}</kbd>
            </li>
          ))}
        <li className="flex items-center justify-between gap-3">
          <span>Diese Übersicht öffnen</span>
          <kbd className="kbd">?</kbd>
        </li>
      </ul>
    </Sheet>
  )
}

function labelForKey(key: string): string {
  if (key === ' ') return 'Leertaste'
  if (key === ',') return ','
  return key.toUpperCase()
}
