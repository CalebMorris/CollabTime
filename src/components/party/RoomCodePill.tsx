interface Props {
  roomCode: string
}

export function RoomCodePill({ roomCode }: Props) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-sm font-mono text-gray-200">
      {roomCode}
    </span>
  )
}
