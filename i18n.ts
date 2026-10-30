import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // ✅ En Next.js 16, el locale se obtiene de requestLocale
  let locale = await requestLocale;

  // Si no viene, usamos el de por defecto (o podrías leerlo de los params)
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'es';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});