// ============================================
// ICONOS SVG DE LA PIZARRA TÁCTICA
// ============================================

interface IconProps {
  size?: number
}

const baseProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function IconCursor({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  )
}

export function IconPencil({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

export function IconArrow({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="9 5 19 5 19 15" />
    </svg>
  )
}

export function IconCurvedArrow({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M5 19c0-7 7-12 14-12" />
      <polyline points="14 3 19 7 14 11" />
    </svg>
  )
}

/**
 * Flecha de bote recta: línea con onda y punta al final.
 * Dibujamos la onda explícitamente para que se vea clara a 20x20.
 */
export function IconBounceArrow({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      {/* Onda horizontal con 2 senos completos. */}
      <path d="M3 12 Q 5 6, 7 12 T 11 12 T 15 12 T 19 12" />
      {/* Punta de flecha apuntando a la derecha. */}
      <polyline points="16 8 20 12 16 16" />
    </svg>
  )
}

/**
 * Flecha de bote curva: curva bezier con onda superpuesta y punta al final.
 */
export function IconBounceCurvedArrow({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      {/* Arco base (curva) en trazo discontinuo para indicar la trayectoria */}
      <path d="M3 20 Q 8 10 20 5" strokeDasharray="2 2" opacity="0.4" />
      {/* Onda a lo largo del arco */}
      <path d="M4 19 Q 5 16, 6.5 18 T 9 16 T 11.5 14 T 14 11 T 17 8" />
      {/* Punta de flecha apuntando arriba-derecha */}
      <polyline points="15 5 20 4 19 9" />
    </svg>
  )
}

export function IconLine({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  )
}

export function IconCircle({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

export function IconRect({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  )
}

export function IconPlayer({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconCone({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M12 3l6 16H6l6-16z" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  )
}

/**
 * Balón de baloncesto: círculo + línea horizontal + dos arcos laterales
 * que simulan las costuras.
 */
export function IconBall({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <circle cx="12" cy="12" r="9" />
      {/* Línea horizontal */}
      <line x1="3" y1="12" x2="21" y2="12" />
      {/* Costura izquierda (arco hacia dentro) */}
      <path d="M 12 3 C 8 8, 8 16, 12 21" />
      {/* Costura derecha (arco hacia dentro) */}
      <path d="M 12 3 C 16 8, 16 16, 12 21" />
    </svg>
  )
}

export function IconText({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )
}

export function IconEraser({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M20 20H7L3 16a2 2 0 010-3l10-10a2 2 0 013 0l5 5a2 2 0 010 3l-9 9" />
    </svg>
  )
}

export function IconUndo({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.36 2.64L3 13" />
    </svg>
  )
}

export function IconRedo({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 019-9 9 9 0 016.36 2.64L21 13" />
    </svg>
  )
}

export function IconDuplicate({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

export function IconFront({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 21h12a2 2 0 002-2V7" />
    </svg>
  )
}

export function IconBack({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <rect x="7" y="7" width="14" height="14" rx="2" />
      <path d="M3 17V5a2 2 0 012-2h12" />
    </svg>
  )
}

export function IconTrash({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}