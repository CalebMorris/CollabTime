import { useTranslation } from 'react-i18next'
import type { Participant } from '../../room/roomProtocol'
import { ConversionDisplay } from '../ConversionDisplay'
import { ShareLink } from '../ShareLink'
import { CalendarExport } from '../CalendarExport'
import { DiscordExport } from '../DiscordExport'

interface Props {
  confirmedMs: number
  participants: Participant[]
  timezone: string
  onNewSession: () => void
  onBackToSolo: () => void
}

export function PartyExportScreen({
  confirmedMs,
  participants,
  timezone,
  onNewSession,
  onBackToSolo,
}: Props) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-lg font-bold tracking-tight text-emerald-400">{t('lockInModal.heading')}</h1>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Confirmed time */}
        <section aria-labelledby="export-time-heading">
          <h2
            id="export-time-heading"
            className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3"
          >
            {t('partyExport.yourTime')}
          </h2>
          <ConversionDisplay timestamp={confirmedMs} timezone={timezone} />
        </section>

        {/* Export tools */}
        <section aria-labelledby="export-share-heading" className="flex flex-col gap-3">
          <h2
            id="export-share-heading"
            className="text-xs font-semibold tracking-widest uppercase text-gray-400"
          >
            {t('common.shareAndExport')}
          </h2>
          <ShareLink timestamp={confirmedMs} />
          <CalendarExport timestamp={confirmedMs} />
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
            <DiscordExport timestamp={confirmedMs} timezone={timezone} />
          </div>
        </section>

        {/* Participants */}
        {participants.length > 0 && (
          <section aria-labelledby="export-party-heading">
            <h2
              id="export-party-heading"
              className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3"
            >
              {t('partyExport.onBoard')}
            </h2>
            <ul className="flex flex-col gap-2">
              {participants.map((p) => (
                <li
                  key={p.participantToken}
                  className="flex items-center gap-2 text-sm text-gray-200"
                >
                  <span className="text-emerald-400 font-semibold">✓</span>
                  <span>{p.nickname}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onNewSession}
            className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {t('partyExport.newSession')}
          </button>
          <button
            onClick={onBackToSolo}
            className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
          >
            {t('partyExport.backToSolo')}
          </button>
        </div>

      </div>
    </div>
  )
}
