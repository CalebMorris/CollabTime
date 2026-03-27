import { useTranslation } from 'react-i18next'

interface Props {
  nickname: string
}

export function NicknameDisplay({ nickname }: Props) {
  const { t } = useTranslation()
  return (
    <p className="text-sm text-gray-400">
      {t('nicknameDisplay.prefix')} <span className="font-semibold text-gray-200">{nickname}</span>
    </p>
  )
}
