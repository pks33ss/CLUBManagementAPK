export interface Team {
  id: string
  name: string
  category?: string | null
  sport?: string | null
  season?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  logo?: string | null
  club: {
    id: string
    name: string
    logo?: string | null
    primaryColor?: string | null
    secondaryColor?: string | null
  }
}