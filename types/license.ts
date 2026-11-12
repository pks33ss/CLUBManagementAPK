// frontend-web/types/license.ts

export type LicenseType = 'BETA' | 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'

export const LICENSE_TYPES: LicenseType[] = [
  'BETA',
  'FREE',
  'BASIC',
  'PRO',
  'ENTERPRISE',
]

export const LICENSE_TYPE_LABELS_ES: Record<LicenseType, string> = {
  BETA: 'Beta',
  FREE: 'Gratis',
  BASIC: 'Básica',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
}

export const LICENSE_TYPE_LABELS_EN: Record<LicenseType, string> = {
  BETA: 'Beta',
  FREE: 'Free',
  BASIC: 'Basic',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
}

// ✅ NUEVO — Deporte restringido (solo aplica a licencia BETA)
export type Sport =
  | 'BASKETBALL'
  | 'PADEL'
  | 'FOOTBALL'
  | 'HANDBALL'
  | 'VOLLEYBALL'
  | 'TENNIS'

export const SPORTS: Sport[] = [
  'BASKETBALL',
  'PADEL',
  'FOOTBALL',
  'HANDBALL',
  'VOLLEYBALL',
  'TENNIS',
]