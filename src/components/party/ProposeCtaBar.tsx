import type { RoomPhase } from '../../room/roomProtocol'

interface Props {
  timestamp: number | null
  roomPhase: RoomPhase | null
  keyboardInset: number
  onPropose: () => void
}

export function ProposeCtaBar({ timestamp, roomPhase, keyboardInset, onPropose }: Props) {
  const disabled = timestamp === null || roomPhase !== 'active'

  return (
    <div
      className="fixed left-0 right-0 z-20 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm px-4 py-3"
      style={{ bottom: keyboardInset }}
    >
      <button
        onClick={onPropose}
        disabled={disabled}
        className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Propose This Time
      </button>
    </div>
  )
}
