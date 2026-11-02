'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardBody } from '@/components/ui'

type TopicKey = 'gettingStarted' | 'teams' | 'members' | 'matches' | 'training' | 'playbook' | 'settings'

const TOPICS: TopicKey[] = [
  'gettingStarted',
  'teams',
  'members',
  'matches',
  'training',
  'playbook',
  'settings',
]

export default function HelpPage() {
  const t = useTranslations('Help')
  const [activeTopic, setActiveTopic] = useState<TopicKey>('gettingStarted')

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Cabecera */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-2">{t('title')}</h1>
        <p className="text-text-secondary">{t('subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Menú Lateral */}
        <div className="w-full md:w-64 shrink-0">
          <Card>
            <CardBody className="p-2">
              <p className="text-xs font-semibold text-text-muted uppercase px-3 py-2 mb-1">
                {t('sidebarTitle')}
              </p>
              <div className="flex flex-col gap-1">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setActiveTopic(topic)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTopic === topic
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                    }`}
                  >
                    {t(`topics.${topic}`)}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardBody className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {t(`content.${activeTopic}.title`)}
              </h2>

              {/* Contenido específico por tema */}
              {activeTopic === 'gettingStarted' && (
                <div className="space-y-4 text-text-secondary">
                  <p>{t('content.gettingStarted.welcome')}</p>
                  <ul className="space-y-2 mt-4">
                    <li>{t('content.gettingStarted.step1')}</li>
                    <li>{t('content.gettingStarted.step2')}</li>
                    <li>{t('content.gettingStarted.step3')}</li>
                    <li>{t('content.gettingStarted.step4')}</li>
                  </ul>
                </div>
              )}

              {activeTopic !== 'gettingStarted' && (
                <div className="text-text-secondary">
                  <p>{t(`content.${activeTopic}.desc`)}</p>
                  {/* Aquí iremos añadiendo más detalles en el Lote 2 */}
                  <div className="mt-6 p-4 bg-surface-elevated rounded-lg border border-border-subtle text-sm italic text-text-muted">
                    Contenido ampliado próximamente...
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}