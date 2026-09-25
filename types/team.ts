export interface Team {
  id: string
  name: string
  category?: string | null
  sport?: string | null
  season?: string | null
  club: {
    id: string
    name: string
    logo?: string | null
  }
}