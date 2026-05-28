import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../Toast'

function Trigger() {
  const toast = useToast()
  return (
    <>
      <button onClick={() => toast.show('First', { duration: 1000 })}>
        show-first
      </button>
      <button onClick={() => toast.show('Second', { duration: 1000 })}>
        show-second
      </button>
    </>
  )
}

describe('Toast auto-dismiss', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not reset an existing toast timer when a new toast is shown', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByText('show-first'))
    expect(screen.getByText('First')).toBeInTheDocument()

    // 600ms into First's 1000ms lifetime, a second toast appears.
    act(() => void vi.advanceTimersByTime(600))
    fireEvent.click(screen.getByText('show-second'))
    expect(screen.getByText('Second')).toBeInTheDocument()

    // 500ms later (1100ms total) First's timer has elapsed and it is gone,
    // while Second (shown at 600ms) is still visible. Before the fix the new
    // toast restarted First's timer, so it would still be present here.
    act(() => void vi.advanceTimersByTime(500))
    expect(screen.queryByText('First')).not.toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})
