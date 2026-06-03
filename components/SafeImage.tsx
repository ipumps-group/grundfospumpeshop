'use client'

import { useState } from 'react'

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string
}

export default function SafeImage({ fallback = '', className = '', ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed && fallback) {
    return <>{fallback}</>
  }

  return (
    <img
      {...props}
      className={failed ? `${className} hidden` : className}
      onError={() => setFailed(true)}
    />
  )
}
