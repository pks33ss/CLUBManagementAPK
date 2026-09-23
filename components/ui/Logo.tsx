import Image from 'next/image'

type LogoVariant = 'full' | 'mark' | 'square'

interface LogoProps {
  variant?: LogoVariant
  /** Altura en píxeles. El ancho se calcula automáticamente manteniendo la proporción. */
  height?: number
  className?: string
  priority?: boolean
}

const LOGO_PATHS: Record<LogoVariant, string> = {
  full: '/logo-full.png',
  mark: '/logo-mark.png',
  square: '/logo-mark-square.png',
}

export function Logo({
  variant = 'full',
  height = 40,
  className = '',
  priority = false,
}: LogoProps) {
  return (
    <Image
      src={LOGO_PATHS[variant]}
      alt="FPM Sports"
      width={0}
      height={0}
      sizes="100vw"
      style={{ height: `${height}px`, width: 'auto' }}
      className={className}
      priority={priority}
    />
  )
}