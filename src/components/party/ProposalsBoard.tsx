import { useState, useEffect, useRef } from 'react'
import type { Participant, Proposal } from '../../room/roomProtocol'
import { ParticipantRow } from './ParticipantRow'
import { ConsensusMeter } from './ConsensusMeter'

interface Props {
  participants: Participant[]
  proposals: Proposal[]
  ownParticipantToken: string | null
  viewerTimezone: string
  isLocked: boolean
}

export function ProposalsBoard({
  participants,
  proposals,
  ownParticipantToken,
  viewerTimezone,
  isLocked,
}: Props) {
  const proposalByToken = new Map(proposals.map((p) => [p.participantToken, p]))
  const connectedCount = participants.filter((p) => p.isConnected).length
  // Only connected participants' proposals count toward consensus
  const activeProposals = proposals.filter((p) => {
    const participant = participants.find((pt) => pt.participantToken === p.participantToken)
    return participant?.isConnected ?? false
  })

  // Track which proposal was most recently updated for animation
  const [recentlyProposed, setRecentlyProposed] = useState<string | null>(null)
  const prevProposalsRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const currentProposals = new Map(proposals.map((p) => [p.participantToken, p.epochMs]))

    // Find any participant whose epochMs changed (new or updated proposal)
    for (const [token, epochMs] of currentProposals) {
      const prevEpochMs = prevProposalsRef.current.get(token)
      if (prevEpochMs === undefined || prevEpochMs !== epochMs) {
        setRecentlyProposed(token)
        const timer = setTimeout(() => setRecentlyProposed(null), 600)
        prevProposalsRef.current = currentProposals
        return () => clearTimeout(timer)
      }
    }

    prevProposalsRef.current = currentProposals
  }, [proposals])

  return (
    <section
      aria-labelledby="proposals-heading"
      aria-live="polite"
      aria-atomic="false"
      className="flex flex-col gap-2"
    >
      <h2
        id="proposals-heading"
        className="text-xs font-semibold tracking-widest uppercase text-gray-400"
      >
        Proposals
      </h2>

      <div className="flex flex-col gap-1">
        {participants.map((participant) => (
          <ParticipantRow
            key={participant.participantToken}
            participant={participant}
            proposal={proposalByToken.get(participant.participantToken) ?? null}
            isOwn={participant.participantToken === ownParticipantToken}
            viewerTimezone={viewerTimezone}
            isLocked={isLocked}
            isRecentlyProposed={recentlyProposed === participant.participantToken}
          />
        ))}
      </div>

      {participants.length === 1 && (
        <p className="text-xs text-gray-500 text-center py-2">
          Waiting for others to join... Share your code to invite them.
        </p>
      )}

      <ConsensusMeter proposals={activeProposals} participantCount={connectedCount} />
    </section>
  )
}
