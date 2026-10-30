import createMiddleware from 'next-intl/middleware'
import { locales } from './i18n'

export default createMiddleware({
  // Una lista de todas las configuraciones regionales que admitimos
  locales,
  // Se utiliza cuando no se encuentra una configuración regional
  defaultLocale: 'es',
  // Esto obliga a tener siempre el idioma en la URL (ej. /es/login o /en/login)
  localePrefix: 'always'
})

export const config = {
  // Saltar rutas que no necesitan internacionalización (API, archivos estáticos, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}