import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ROOM_CODE_RE } from '../../utils/appUrl'

interface Props {
  attemptedCode: string
  onTryDifferent: (code: string) => void
  onStartNew: () => void
  onBackToSolo: () => void
}

export function PartyDeadRoom({ attemptedCode, onTryDifferent, onStartNew, onBackToSolo }: Props) {
  const { t } = useTranslation()
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const isValid = ROOM_CODE_RE.test(inputValue)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">

        {/* Error message */}
        <div className="flex flex-col gap-2">
          <span className="text-4xl" aria-hidden="true">🚪</span>
          <h1 className="text-2xl font-bold text-gray-100">{t('partyDead.heading')}</h1>
          <p className="text-sm text-gray-400">
            {t('partyDead.description')}
          </p>
          <p className="text-xs font-mono text-gray-500 mt-1">{attemptedCode}</p>
        </div>

        {/* Inline code entry (expands on demand) */}
        {showInput && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toLowerCase())}
              placeholder={t('common.roomCodePlaceholder')}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              aria-label={t('common.roomCodeAriaLabel')}
              autoFocus
              className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-mono text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => { if (isValid) onTryDifferent(inputValue) }}
              disabled={!isValid}
              className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('partyDead.joinButton')}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!showInput && (
            <button
              onClick={() => setShowInput(true)}
              className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
            >
              {t('partyDead.tryDifferent')}
            </button>
          )}
          <button
            onClick={onStartNew}
            className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {t('partyDead.startNew')}
          </button>
          <button
            onClick={onBackToSolo}
            className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
          >
            {t('partyDead.goToSolo')}
          </button>
        </div>

      </div>
    </div>
  )
}
