// frontend-web/types/license.ts
//
// Espejo del enum `LicenseType` definido en backend/prisma/schema.prisma.
// Si añades un valor en Prisma, añádelo también aquí.

export type LicenseType = 'BETA' | 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'

/** Lista ordenada de licencias para pintar selectores. */
export const LICENSE_TYPES: LicenseType[] = [
  'BETA',
  'FREE',
  'BASIC',
  'PRO',
  'ENTERPRISE',
]

/**
 * Fallback de etiquetas por si en algún contexto (tests, scripts sueltos)
 * el componente se usa sin provider de next-intl. En la UI real siempre
 * se usan las traducciones de `messages/{locale}.json → Licenses.types`.
 */
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