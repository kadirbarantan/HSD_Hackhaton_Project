import { useMemo } from 'react'
import type { Competency } from './types'
import { useApi } from './useApi'

/** The shared competency catalog, grouped the way the pickers render it. */
export function useCompetencies() {
  const { data } = useApi<Competency[]>('/competencies')

  return useMemo(() => {
    const competencies = data ?? []
    const categories = new Map<string, Competency[]>()
    for (const competency of competencies) {
      const group = categories.get(competency.category)
      if (group) group.push(competency)
      else categories.set(competency.category, [competency])
    }
    return { competencies, categories: [...categories], loaded: data !== null }
  }, [data])
}
