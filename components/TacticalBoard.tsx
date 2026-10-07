// Re-export del componente modular de pizarra táctica.
// El código real está en ./tactical/TacticalBoard.tsx.
// Mantenemos este archivo para no romper los imports existentes.

export { default } from './tactical/TacticalBoard'
export type { TacticalBoardProps, Tool } from './tactical/types'