import React from 'react'
import Feather from '@expo/vector-icons/Feather'

type Props = {
  width?: number
  height?: number
  color?: string
}

export default function EyeIcon({ width = 20, height = 20, color = '#000' }: Props) {
  const size = Math.min(width, height)
  return <Feather name="eye" size={size} color={color} />
}

