import { describe, expect, it } from 'vitest'
import { isInstrument } from './candle.ts'

describe('isInstrument', () => {
  it.each(['MES', 'NQ'])('accepts %s', (value) => {
    expect(isInstrument(value)).toBe(true)
  })

  it.each([
    { label: 'an unknown symbol', value: 'ES' },
    { label: 'an empty string', value: '' },
    { label: 'lowercase', value: 'mes' },
    { label: 'mixed case', value: 'Nq' },
    { label: 'surrounding spaces', value: ' MES ' },
    { label: 'undefined', value: undefined },
    { label: 'null', value: null },
    { label: 'a number', value: 0 },
    { label: 'an array with a valid symbol', value: ['MES'] },
  ])('rejects $label', ({ value }) => {
    expect(isInstrument(value)).toBe(false)
  })
})
