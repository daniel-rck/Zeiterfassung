import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { WelcomePage } from '../Welcome'

function renderWelcome() {
  return render(
    <MemoryRouter>
      <WelcomePage />
    </MemoryRouter>,
  )
}

describe('WelcomePage', () => {
  it('renders the hero headline', () => {
    renderWelcome()
    expect(
      screen.getByRole('heading', { level: 1, name: /Zeit erfassen/i }),
    ).toBeInTheDocument()
  })

  it('renders both primary CTAs (Hero + Final) that link to the app root', () => {
    renderWelcome()
    const ctas = screen.getAllByRole('link', { name: /Jetzt loslegen/i })
    expect(ctas).toHaveLength(2)
    ctas.forEach((cta) => {
      expect(cta).toHaveAttribute('href', '/')
    })
  })

  it('renders the four detail levels', () => {
    renderWelcome()
    expect(screen.getByRole('heading', { name: 'Basis' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Standard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pro+' })).toBeInTheDocument()
  })

  it('links to the GitHub repository', () => {
    renderWelcome()
    const githubLinks = screen.getAllByRole('link', { name: /GitHub/i })
    expect(githubLinks.length).toBeGreaterThan(0)
    githubLinks.forEach((link) => {
      expect(link).toHaveAttribute(
        'href',
        expect.stringContaining('github.com/daniel-rck/Zeiterfassung'),
      )
    })
  })
})
