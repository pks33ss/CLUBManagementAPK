'use client'

import { Fragment, useMemo } from 'react'
import {
  ALL_ROLES,
  GROUP_LABEL,
  GROUP_ORDER,
  ROLE_LABEL,
  type StatsAudienceRole,
  type StatsConfigEntry,
  type StatsScope,
} from '@/lib/api/stats-config'

interface Props {
  scope: StatsScope
  entries: StatsConfigEntry[]
  onChange: (next: StatsConfigEntry[]) => void
  disabled?: boolean
}

export default function StatsConfigMatrix({
  scope,
  entries,
  onChange,
  disabled,
}: Props) {
  const scopedEntries = useMemo(
    () => entries.filter((e) => e.scope === scope),
    [entries, scope],
  )

  const grouped = useMemo(() => {
    const byGroup = new Map<
      string,
      Array<{
        metricKey: string
        label: string
        byRole: Map<StatsAudienceRole, StatsConfigEntry>
      }>
    >()

    for (const e of scopedEntries) {
      if (!byGroup.has(e.group)) byGroup.set(e.group, [])
      const list = byGroup.get(e.group)!
      let metric = list.find((x) => x.metricKey === e.metricKey)
      if (!metric) {
        metric = {
          metricKey: e.metricKey,
          label: e.label,
          byRole: new Map(),
        }
        list.push(metric)
      }
      metric.byRole.set(e.role, e)
    }

    const groups = Array.from(byGroup.entries())
    groups.sort(([a], [b]) => {
      const ia = GROUP_ORDER.indexOf(a)
      const ib = GROUP_ORDER.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })

    return groups
  }, [scopedEntries])

  const toggle = (
    metricKey: string,
    role: StatsAudienceRole,
    visible: boolean,
  ) => {
    const next = entries.map((e) =>
      e.scope === scope && e.metricKey === metricKey && e.role === role
        ? { ...e, visible }
        : e,
    )
    onChange(next)
  }

  if (scopedEntries.length === 0) {
    return (
      <p className="text-center text-text-muted py-8">
        No hay métricas configuradas para este scope.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase sticky left-0 bg-surface-elevated z-10">
              Métrica
            </th>
            {ALL_ROLES.map((r) => (
              <th
                key={r}
                className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase whitespace-nowrap"
              >
                {ROLE_LABEL[r]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {grouped.map(([groupKey, metrics]) => (
            <Fragment key={`group-${groupKey}`}>
              <tr className="bg-surface-elevated/50">
                <td
                  colSpan={1 + ALL_ROLES.length}
                  className="px-3 py-2 text-[11px] font-bold uppercase text-text-muted tracking-wide"
                >
                  {GROUP_LABEL[groupKey] ?? groupKey}
                </td>
              </tr>
              {metrics.map((m) => (
                <tr
                  key={`${groupKey}-${m.metricKey}`}
                  className="hover:bg-surface-elevated transition"
                >
                  <td className="px-3 py-2 text-text-primary sticky left-0 bg-bg-base">
                    {m.label}
                    <span className="block text-[10px] text-text-muted font-mono">
                      {m.metricKey}
                    </span>
                  </td>
                  {ALL_ROLES.map((r) => {
                    const entry = m.byRole.get(r)
                    const checked = entry?.visible ?? true
                    return (
                      <td key={r} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled || !entry}
                          onChange={(e) =>
                            toggle(m.metricKey, r, e.target.checked)
                          }
                          className="w-4 h-4 accent-brand-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}