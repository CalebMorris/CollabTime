import type { RoomPhase } from '../../room/roomProtocol'

interface Props {
  timestamp: number | null
  roomPhase: RoomPhase | null
  onPropose: () => void
}

export function ProposeCtaBar({ timestamp, roomPhase, onPropose }: Props) {
  const disabled = timestamp === null || roomPhase !== 'active'

  return (
    <button
      onClick={onPropose}
      disabled={disabled}
      className="min-h-[56px] w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 text-lg font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Propose This Time
    </button>
  )
}
