import { useState, useEffect } from 'react'

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(() => computeInset())

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => setInset(computeInset())
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}

function computeInset(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
}
