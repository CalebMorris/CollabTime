import type { Proposal } from '../../room/roomProtocol'

interface Props {
  proposals: Proposal[]
  participantCount: number
}

function floorToMinute(epochMs: number): number {
  return Math.floor(epochMs / 60_000) * 60_000
}

function countAgreeing(proposals: Proposal[]): number {
  if (proposals.length === 0) return 0
  const counts = new Map<number, number>()
  for (const p of proposals) {
    const key = floorToMinute(p.epochMs)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Math.max(...counts.values())
}

export function ConsensusMeter({ proposals, participantCount }: Props) {
  const total = participantCount
  const agreeing = countAgreeing(proposals)
  const ratio = total === 0 ? 0 : agreeing / total
  const allAgree = total > 0 && ratio === 1

  return (
    <div className="flex flex-col gap-1">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-xs text-gray-400"
      >
        {agreeing} of {total} agree
      </p>
      <div
        role="progressbar"
        aria-label="Consensus"
        aria-valuenow={agreeing}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-1 w-full rounded-full bg-gray-700 overflow-hidden"
      >
        <div
          data-testid="consensus-bar-fill"
          className={`h-full rounded-full transition-all duration-300 ${
            allAgree ? 'bg-emerald-500 motion-safe:animate-pulse' : 'bg-indigo-500'
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}
