import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { ROOM_CODE_RE } from '../../utils/appUrl'

interface Props {
  initialCode: string | null
  onJoin: (code: string) => void
  onDismiss: () => void
}

export function PartyJoinOverlay({ initialCode, onJoin, onDismiss }: Props) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState(initialCode ?? '')
  const isPreFilled = initialCode !== null
  const isValid = ROOM_CODE_RE.test(inputValue)
  const showError = inputValue.length > 0 && !isValid

  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, onDismiss)

  const handleSubmit = () => {
    if (isValid) onJoin(inputValue)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        data-testid="overlay-backdrop"
        role="presentation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-overlay-title"
        className="relative z-10 w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl mx-4"
      >
        <h2
          id="join-overlay-title"
          className="text-lg font-semibold text-gray-100 mb-1"
        >
          {t('partyJoin.title')}
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          {t('partyJoin.subtitle')}
        </p>

        {/* Code input */}
        <input
          type="text"
          value={inputValue}
          readOnly={isPreFilled}
          onChange={(e) => setInputValue(e.target.value.toLowerCase())}
          placeholder={t('common.roomCodePlaceholder')}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
          aria-label={t('common.roomCodeAriaLabel')}
          aria-invalid={showError}
          aria-describedby={showError ? 'code-error' : undefined}
          className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-mono text-gray-100 placeholder-gray-500 mb-1 focus:outline-none focus:border-indigo-500"
        />

        {/* Inline validation error */}
        {showError && (
          <p
            id="code-error"
            role="alert"
            className="text-xs text-red-400 mb-3"
          >
            {t('partyJoin.formatError')}
          </p>
        )}

        {/* Spacer to keep layout stable when no error */}
        {!showError && <div className="mb-3" />}

        {/* Join CTA */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed mb-4"
        >
          {t('partyJoin.joinButton')}
        </button>

        {/* Privacy notice */}
        <p className="text-xs text-gray-500 text-center">
          {t('common.privacyNotice')}
        </p>
      </div>
    </div>
  )
}
