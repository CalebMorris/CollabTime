import { describe, it, expect } from 'vitest'
import i18n from './index'

describe('i18n', () => {
  it('default language resolves English strings', () => {
    expect(i18n.t('textImport.parseButton')).toBe('Parse')
  })

  it('Spanish resource bundle is loaded', () => {
    const esBundle = i18n.getResourceBundle('es', 'translation')
    expect(esBundle).toBeDefined()
    expect((esBundle as Record<string, unknown>).textImport).toBeDefined()
  })

  it('Spanish parseButton key exists', () => {
    expect(i18n.t('textImport.parseButton', { lng: 'es' })).toBe('Analizar')
  })

  it('allOnBoard interpolates participantCount', () => {
    expect(i18n.t('lockInModal.allOnBoard', { participantCount: 4 })).toBe('All 4 on board')
  })

  it('agreeStatus interpolates agreeing and total', () => {
    expect(i18n.t('consensusMeter.agreeStatus', { agreeing: 2, total: 4 })).toBe('2 of 4 agree')
  })

  it('reconnecting banner interpolates secondsRemaining', () => {
    expect(i18n.t('reconnectingBanner.reconnecting', { secondsRemaining: 24 })).toBe('Reconnecting... 24s')
  })

  it('timezoneSelect singular resultCount', () => {
    expect(i18n.t('timezoneSelect.resultCount', { count: 1 })).toBe('1 timezone found')
  })

  it('timezoneSelect plural resultCount', () => {
    expect(i18n.t('timezoneSelect.resultCount', { count: 3 })).toBe('3 timezones found')
  })

  it('discordExport copyFormatAriaLabel interpolates label', () => {
    expect(i18n.t('discordExport.copyFormatAriaLabel', { label: 'Short Date/Time' })).toBe('Copy Short Date/Time')
  })

  it('partyRoom errorCode interpolates errorCode', () => {
    expect(i18n.t('partyRoom.errorCode', { errorCode: 'ROOM_NOT_FOUND' })).toBe('Error: ROOM_NOT_FOUND')
  })

  it('Spanish agreeStatus interpolates correctly', () => {
    expect(i18n.t('consensusMeter.agreeStatus', { agreeing: 2, total: 4, lng: 'es' })).toBe('2 de 4 de acuerdo')
  })

  it('fallback language is English', () => {
    const fallback = i18n.options.fallbackLng
    const langs = Array.isArray(fallback) ? fallback : [fallback]
    expect(langs).toContain('en')
  })
})
