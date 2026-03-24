interface Props {
  nickname: string
}

export function NicknameDisplay({ nickname }: Props) {
  return (
    <p className="text-sm text-gray-400">
      Your nickname: <span className="font-semibold text-gray-200">{nickname}</span>
    </p>
  )
}
