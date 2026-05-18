import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettings } from '../../lib/hooks/useSettings'
import { OnboardingSheet } from './OnboardingSheet'

const PUBLIC_PATHS = new Set(['/willkommen'])

export function Onboarding() {
  const { settings } = useSettings()
  const location = useLocation()
  const [dismissed, setDismissed] = useState(false)
  const onPublicPath = PUBLIC_PATHS.has(location.pathname)
  const open = !settings.onboardingCompleted && !dismissed && !onPublicPath
  return (
    <OnboardingSheet
      open={open}
      initialSettings={settings}
      onClose={() => setDismissed(true)}
    />
  )
}
