import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarPlus, Download } from 'lucide-react'
import { buildIcsContent, buildGoogleCalendarUrl } from '../utils/calendarExport'

interface Props {
  timestamp: number | null
}

export function CalendarExport({ timestamp }: Props) {
  const { t } = useTranslation()
  const [downloaded, setDownloaded] = useState(false)

  if (timestamp === null) return null

  const handleDownload = () => {
    const icsContent = buildIcsContent(timestamp)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'collabtime-event.ics'
    anchor.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const googleCalendarUrl = buildGoogleCalendarUrl(timestamp)

  return (
    <div className="flex items-center gap-2 rounded bg-gray-800 px-3 py-2">
      <CalendarPlus aria-hidden="true" className="w-4 h-4 text-indigo-400 shrink-0" />
      <span className="flex-1 text-sm text-gray-300">{t('calendarExport.calendarEvent')}</span>
      <a
        href={googleCalendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('calendarExport.addToGoogleAriaLabel')}
        className="min-h-[44px] px-3 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs shrink-0 flex items-center gap-1.5"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
          <path fill="#4285F4" d="M21.8 10.6H21V10h-9v4h4.9a5 5 0 0 1-4.9 3 5 5 0 0 1 0-10 5 5 0 0 1 3.2 1.1l2.8-2.8A9 9 0 1 0 12 21a9 9 0 0 0 9-9 9 9 0 0 0-.2-1.4Z"/>
          <path fill="#34A853" d="M5.3 13.7 2.1 16a9 9 0 0 0 9.9 5l-2.8-2.8A5 5 0 0 1 5.3 13.7Z"/>
          <path fill="#FBBC04" d="M5.3 10.3a5 5 0 0 1 2.9-2.9L5.4 4.6A9 9 0 0 0 2.1 8z"/>
          <path fill="#EA4335" d="M12 7a5 5 0 0 1 3.2 1.1l2.8-2.8A9 9 0 0 0 5.4 4.6l2.8 2.8A5 5 0 0 1 12 7Z"/>
        </svg>
        {t('calendarExport.googleCalendar')}
      </a>
      <button
        aria-label={t('calendarExport.downloadIcsAriaLabel')}
        aria-live="polite"
        onClick={handleDownload}
        className="min-h-[44px] px-3 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs shrink-0 flex items-center gap-1.5"
      >
        {downloaded
          ? t('calendarExport.downloaded')
          : <><Download aria-hidden="true" className="w-3.5 h-3.5" />{t('calendarExport.downloadIcs')}</>
        }
      </button>
    </div>
  )
}
