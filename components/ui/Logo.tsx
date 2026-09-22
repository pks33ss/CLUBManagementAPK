import Image from 'next/image'

type LogoVariant = 'full' | 'mark' | 'square'
type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
  priority?: boolean
}

const LOGO_PATHS: Record<LogoVariant, string> = {
  full: '/logo-full.svg',
  mark: '/logo-mark.svg',
  square: '/logo-mark-square.svg',
}

const LOGO_RATIOS: Record<LogoVariant, number> = {
  full: 600 / 350,   // 1.71
  mark: 600 / 300,   // 2.0
  square: 1,         // 1.0
}

const SIZES: Record<LogoSize, { height: number }> = {
  sm: { height: 24 },
  md: { height: 32 },
  lg: { height: 48 },
  xl: { height: 80 },
}

export function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  priority = false,
}: LogoProps) {
  const { height } = SIZES[size]
  const width = Math.round(height * LOGO_RATIOS[variant])

  return (
    <Image
      src={LOGO_PATHS[variant]}
      alt="FPM Sports"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}