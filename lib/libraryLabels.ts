// frontend-web/lib/libraryLabels.ts

'use client'

import { useTranslations } from 'next-intl'

export type LibraryBadgeVariant =
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'

export type CategoryOption = { value: string; label: string }
export type DifficultyOption = { value: string; label: string }

export const CATEGORY_VALUES = [
  'CALENTAMIENTO',
  'TÉCNICA',
  'TÁCTICA',
  'FÍSICO',
] as const

export const DIFFICULTY_VALUES = ['FÁCIL', 'MEDIO', 'DIFÍCIL'] as const

export function categoryVariant(category: string | null): LibraryBadgeVariant {
  switch (category) {
    case 'CALENTAMIENTO':
      return 'info'
    case 'TÉCNICA':
      return 'success'
    case 'TÁCTICA':
      return 'warning'
    case 'FÍSICO':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function difficultyVariant(
  difficulty: string | null,
): Exclude<LibraryBadgeVariant, 'info'> {
  switch (difficulty) {
    case 'FÁCIL':
      return 'success'
    case 'MEDIO':
      return 'warning'
    case 'DIFÍCIL':
      return 'danger'
    default:
      return 'neutral'
  }
}

/**
 * Hook que devuelve helpers de traducción para categoría y dificultad.
 * Uso: const { categoryLabel, difficultyLabel, categoryOptions } = useLibraryLabels()
 */
export function useLibraryLabels() {
  const t = useTranslations('Library')

  const categoryLabel = (cat: string | null): string => {
    if (!cat) return t('categories.none')
    const key = `categories.${cat}` as const
    return t.has(key) ? t(key) : cat
  }

  const difficultyLabel = (diff: string | null): string => {
    if (!diff) return t('difficulties.none')
    const key = `difficulties.${diff}` as const
    return t.has(key) ? t(key) : diff
  }

  const categoryOptions: CategoryOption[] = CATEGORY_VALUES.map((value) => ({
    value,
    label: categoryLabel(value),
  }))

  const difficultyOptions: DifficultyOption[] = DIFFICULTY_VALUES.map(
    (value) => ({
      value,
      label: difficultyLabel(value),
    }),
  )

  return {
    categoryLabel,
    difficultyLabel,
    categoryOptions,
    difficultyOptions,
    categoryVariant,
    difficultyVariant,
  }
}