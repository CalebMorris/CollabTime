import { useRef, useState } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { encodePartyRoomUrl } from '../../utils/partyLink'

interface Props {
  roomCode: string
  onEnterRoom: () => void
  onDismiss: () => void
}

export function PartyCreateOverlay({ roomCode, onEnterRoom, onDismiss }: Props) {
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, onDismiss)

  const partyUrl = `${window.location.origin}${window.location.pathname}${encodePartyRoomUrl(roomCode)}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(partyUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        data-testid="overlay-backdrop"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-overlay-title"
        className="relative z-10 w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl mx-4"
      >
        <h2
          id="create-overlay-title"
          className="text-lg font-semibold text-gray-100 mb-1"
        >
          Your Party Room
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Share this code or link to invite others.
        </p>

        {/* Room code display */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 mb-4 text-center">
          <span className="text-xl font-mono font-bold text-indigo-300 select-all">
            {roomCode}
          </span>
        </div>

        {/* Copy buttons */}
        <div className="flex gap-2 mb-4">
          <button
            aria-label="Copy code"
            onClick={handleCopyCode}
            className="min-h-[44px] flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
          >
            {codeCopied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            aria-label="Copy link"
            onClick={handleCopyLink}
            className="min-h-[44px] flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
          >
            {linkCopied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Enter room CTA */}
        <button
          onClick={onEnterRoom}
          className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 mb-4"
        >
          Enter the Room
        </button>

        {/* Privacy notice */}
        <p className="text-xs text-gray-500 text-center">
          Privacy: only proposed times are shared — no timezone data leaves your device.
        </p>
      </div>
    </div>
  )
}
