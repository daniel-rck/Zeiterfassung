import { describe, it, expect } from 'vitest'
import { parseDuration, roundDurationSec } from '../duration'

describe('parseDuration', () => {
  it('parses HH:MM', () => {
    expect(parseDuration('01:30')).toBe(5400)
    expect(parseDuration('1:30')).toBe(5400)
    expect(parseDuration('10:05')).toBe(36300)
  })

  it('parses HH:MM:SS', () => {
    expect(parseDuration('1:30:15')).toBe(5415)
  })

  it('parses h/m/s combinations', () => {
    expect(parseDuration('1h 30m')).toBe(5400)
    expect(parseDuration('1h30m')).toBe(5400)
    expect(parseDuration('90m')).toBe(5400)
    expect(parseDuration('45s')).toBe(45)
    expect(parseDuration('2h')).toBe(7200)
  })

  it('parses decimal hours', () => {
    expect(parseDuration('1.5')).toBe(5400)
    expect(parseDuration('0,75')).toBe(2700)
    expect(parseDuration('2')).toBe(7200)
  })

  it('returns null for unparseable input', () => {
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('1h x')).toBeNull()
  })
})

describe('roundDurationSec', () => {
  it('returns input when rounding disabled', () => {
    expect(roundDurationSec(123, 0)).toBe(123)
  })

  it('rounds to 15 minutes', () => {
    expect(roundDurationSec(60 * 7, 15)).toBe(0)
    expect(roundDurationSec(60 * 8, 15)).toBe(15 * 60)
    expect(roundDurationSec(60 * 22, 15)).toBe(15 * 60)
    expect(roundDurationSec(60 * 23, 15)).toBe(30 * 60)
  })

  it('rounds to 5 minutes', () => {
    expect(roundDurationSec(60 * 2, 5)).toBe(0)
    expect(roundDurationSec(60 * 3, 5)).toBe(5 * 60)
    expect(roundDurationSec(60 * 7, 5)).toBe(5 * 60)
  })
})
