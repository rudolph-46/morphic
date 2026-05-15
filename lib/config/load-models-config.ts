import cloudConfig from '@/config/models/cloud.json'

import { Model } from '@/lib/types/models'
import { SearchMode } from '@/lib/types/search'

export interface ModelsConfig {
  version: number
  models: {
    internal: Model
    external: Model
    deep: Model
  }
}

let cachedConfig: ModelsConfig | null = null
let cachedForCloudDeployment = false

const VALID_SEARCH_MODES: SearchMode[] = ['internal', 'external', 'deep']

// Backward-compat: la cloud config peut encore exposer les anciennes clés
// `quick` / `adaptive`. On les remappe vers `external` / `internal` à la lecture.
function normalizeLegacyModelKeys(models: Record<string, unknown>): void {
  if (!models.external && models.quick) {
    models.external = models.quick
  }
  if (!models.internal && models.adaptive) {
    models.internal = models.adaptive
  }
  if (!models.deep && models.internal) {
    models.deep = models.internal
  }
}

function validateModelsConfigStructure(
  json: unknown
): asserts json is ModelsConfig {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid models config: not an object')
  }
  const parsed = json as Record<string, any>
  if (typeof parsed.version !== 'number') {
    throw new Error('Invalid models config: missing version')
  }
  if (!parsed.models || typeof parsed.models !== 'object') {
    throw new Error('Invalid models config: missing models')
  }
  normalizeLegacyModelKeys(parsed.models)
  for (const searchMode of VALID_SEARCH_MODES) {
    const modeEntry = parsed.models[searchMode]
    if (!modeEntry || typeof modeEntry !== 'object') {
      throw new Error(
        `Invalid models config: missing configuration for mode "${searchMode}"`
      )
    }
  }
}

export function isCloudDeployment(): boolean {
  return process.env.MORPHIC_CLOUD_DEPLOYMENT === 'true'
}

export async function loadModelsConfig(): Promise<ModelsConfig> {
  if (!isCloudDeployment()) {
    throw new Error(
      'loadModelsConfig is only available when MORPHIC_CLOUD_DEPLOYMENT=true'
    )
  }

  if (cachedConfig && cachedForCloudDeployment) {
    return cachedConfig
  }

  const config = cloudConfig
  validateModelsConfigStructure(config)

  cachedConfig = config as ModelsConfig
  cachedForCloudDeployment = true
  return cachedConfig
}

// Synchronous load (for code paths that need sync access)
export function loadModelsConfigSync(): ModelsConfig {
  if (!isCloudDeployment()) {
    throw new Error(
      'loadModelsConfigSync is only available when MORPHIC_CLOUD_DEPLOYMENT=true'
    )
  }

  if (cachedConfig && cachedForCloudDeployment) {
    return cachedConfig
  }

  const config = cloudConfig
  validateModelsConfigStructure(config)

  cachedConfig = config as ModelsConfig
  cachedForCloudDeployment = true
  return cachedConfig
}

// Public accessor that ensures a config is available synchronously
export function getModelsConfig(): ModelsConfig {
  if (!cachedConfig) {
    return loadModelsConfigSync()
  }
  return cachedConfig
}
