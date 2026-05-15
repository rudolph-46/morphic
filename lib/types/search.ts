// Search mode type definition
// - internal: recherche dans le périmètre / réseau de l'utilisateur (MCP, board, mémoire)
// - external: recherche hors réseau (web, sources tierces)
// - deep:    recherche approfondie multi-étapes avec rapport sourcé
export type SearchMode = 'internal' | 'external' | 'deep'
