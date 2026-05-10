import { useState } from 'react'
import { useSettings } from '../../lib/hooks/useSettings'
import { OnboardingSheet } from './OnboardingSheet'

export function Onboarding() {
  const { settings } = useSettings()
  const [dismissed, setDismissed] = useState(false)
  const open = !settings.onboardingCompleted && !dismissed
  return (
    <OnboardingSheet
      open={open}
      initialSettings={settings}
      onClose={() => setDismissed(true)}
    />
  )
}
