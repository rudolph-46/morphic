// Mock data for the network visualization. Mirrors network_v4.html so the
// React port stays visually and semantically identical until real data lands.

export type Industry = 'consulting' | 'bank' | 'telco' | 'startup' | 'public'

export interface Company {
  id: string
  name: string
  industry: Industry
}

export interface School {
  id: string
  name: string
}

export interface Experience {
  companyId: string
  company: string
  title: string
  startYear: number
  endYear: number | null
}

export interface Education {
  schoolId: string
  school: string
  startYear: number
  endYear: number
}

export interface Profile {
  id: string
  name: string
  initials: string
  headline: string
  hue: number
  experiences: Experience[]
  educations: Education[]
}

export const COMPANIES: Company[] = [
  { id: 'cap', name: 'Capgemini', industry: 'consulting' },
  { id: 'bnp', name: 'BNP Paribas', industry: 'bank' },
  { id: 'orange', name: 'Orange', industry: 'telco' },
  { id: 'sgbc', name: 'SGBC Cameroun', industry: 'bank' },
  { id: 'mtn', name: 'MTN Cameroon', industry: 'telco' },
  { id: 'wenagoo', name: 'Wenagoo', industry: 'startup' },
  { id: 'station-f', name: 'Station F', industry: 'startup' },
  { id: 'afd', name: 'AFD', industry: 'public' },
  { id: 'thales', name: 'Thales', industry: 'consulting' },
  { id: 'atos', name: 'Atos', industry: 'consulting' },
  { id: 'sopra', name: 'Sopra Steria', industry: 'consulting' },
  { id: 'ddc', name: 'Digital Africa', industry: 'startup' },
  { id: 'safaricom', name: 'Safaricom', industry: 'telco' }
]

export const SCHOOLS: School[] = [
  { id: 'kedge', name: 'KEDGE Bordeaux' },
  { id: 'enseirb', name: 'ENSEIRB-MATMECA' },
  { id: 'iut-bdx', name: 'IUT Bordeaux' },
  { id: 'sup-yde', name: "Sup'Ptic Yaoundé" },
  { id: 'esstic', name: 'ESSTIC' },
  { id: 'ensp', name: 'ENSP Yaoundé' },
  { id: 'hec', name: 'HEC Paris' },
  { id: 'iae-bdx', name: 'IAE Bordeaux' }
]

const ROLES_DATA = [
  'Data Analyst',
  'Senior Data Analyst',
  'Data Engineer',
  'BI Consultant'
]
const ROLES_FOUNDER = ['Founder', 'Co-founder & CEO', 'CTO', 'Product Manager']
const ROLES_BANK = ['Risk Analyst', 'Compliance Officer', 'Relationship Manager']
const ROLES_TELCO = ['Network Engineer', 'B2B Account Manager', 'Digital Lead']
const ROLES_DEV = ['Software Engineer', 'Frontend Developer', 'Tech Lead']
const ROLES_PUBLIC = ['Senior Consultant', 'Project Manager', 'Policy Analyst']

const FRENCH_FIRST = [
  'Sophie', 'Marc', 'Julie', 'Pierre', 'Camille', 'Thomas', 'Léa', 'Antoine',
  'Marie', 'Lucas', 'Emma', 'Hugo', 'Chloé', 'Maxime', 'Sarah', 'Nicolas',
  'Alice', 'Julien', 'Manon', 'Romain', 'Pauline', 'Alexandre', 'Inès',
  'Mathieu', 'Charlotte', 'Adrien', 'Élodie', 'Nathan'
]
const CMR_FIRST = [
  'Patrick', 'Aïssatou', 'Boris', 'Yvonne', 'Christian', 'Estelle', 'Hervé',
  'Joëlle', 'Roger', 'Delphine', 'Serge', 'Mireille', 'Eric', 'Béatrice',
  'Franck', 'Solange'
]
const FRENCH_LAST = [
  'Martin', 'Bernard', 'Dubois', 'Robert', 'Petit', 'Durand', 'Leroy',
  'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Roux', 'David', 'Bertrand',
  'Morel', 'Fournier'
]
const CMR_LAST = [
  'Mbarga', 'Nguemo', 'Tchamba', 'Etoo', 'Foning', 'Kameni', 'Ndongo',
  'Owona', 'Tchoua', 'Bidoung', 'Essomba', 'Manga'
]

// Seeded RNG so the visualization is stable across reloads and SSR/CSR.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(42)
const rand = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
const randInt = (a: number, b: number) =>
  Math.floor(rng() * (b - a + 1)) + a

interface World {
  companies: string[]
  schools: string[]
  roles: string[]
  names: 'fr' | 'cmr'
  size: number
}

const WORLDS: World[] = [
  { companies: ['cap', 'sopra', 'atos', 'thales', 'bnp'], schools: ['kedge', 'enseirb', 'iut-bdx', 'iae-bdx'], roles: ROLES_DATA, names: 'fr', size: 45 },
  { companies: ['mtn', 'sgbc', 'orange'], schools: ['sup-yde', 'ensp', 'esstic'], roles: ROLES_DEV, names: 'cmr', size: 35 },
  { companies: ['bnp', 'sgbc'], schools: ['kedge', 'iae-bdx', 'hec'], roles: ROLES_BANK, names: 'fr', size: 28 },
  { companies: ['wenagoo', 'station-f', 'ddc'], schools: ['hec', 'kedge', 'enseirb'], roles: ROLES_FOUNDER, names: 'fr', size: 22 },
  { companies: ['orange', 'thales', 'atos', 'sopra'], schools: ['enseirb', 'iut-bdx'], roles: [...ROLES_DEV, ...ROLES_TELCO], names: 'fr', size: 30 },
  { companies: ['mtn', 'safaricom', 'ddc', 'wenagoo', 'afd'], schools: ['sup-yde', 'ensp', 'esstic', 'hec'], roles: [...ROLES_FOUNDER, ...ROLES_TELCO], names: 'cmr', size: 20 },
  { companies: ['afd', 'cap', 'sopra'], schools: ['iae-bdx', 'kedge', 'hec'], roles: ROLES_PUBLIC, names: 'fr', size: 20 }
]

function buildProfiles(): Profile[] {
  const profiles: Profile[] = []
  let pid = 0
  for (const w of WORLDS) {
    for (let i = 0; i < w.size; i++) {
      const isCmr = w.names === 'cmr'
      const first = rand(isCmr ? CMR_FIRST : FRENCH_FIRST)
      const last = rand(isCmr ? CMR_LAST : FRENCH_LAST)

      const expCount = randInt(1, 3)
      const experiences: Experience[] = []
      const usedCompanies = new Set<string>()
      let cursor = randInt(2008, 2014)
      for (let j = 0; j < expCount; j++) {
        const companyId =
          j === 0 || rng() < 0.7 ? rand(w.companies) : rand(COMPANIES).id
        if (usedCompanies.has(companyId)) continue
        usedCompanies.add(companyId)
        const startYear = cursor
        const duration = randInt(2, 5)
        const endYear = Math.min(startYear + duration, 2025)
        const c = COMPANIES.find(x => x.id === companyId)!
        experiences.push({
          companyId,
          company: c.name,
          title: rand(w.roles),
          startYear,
          endYear: endYear === 2025 && rng() < 0.4 ? null : endYear
        })
        cursor = endYear + randInt(0, 1)
        if (cursor > 2025) break
      }

      if (experiences.length === 0) {
        const companyId = rand(w.companies)
        const c = COMPANIES.find(x => x.id === companyId)!
        experiences.push({
          companyId,
          company: c.name,
          title: rand(w.roles),
          startYear: 2018,
          endYear: null
        })
      }

      const eduCount = randInt(1, 2)
      const educations: Education[] = []
      const usedSchools = new Set<string>()
      for (let j = 0; j < eduCount; j++) {
        const schoolId =
          j === 0 || rng() < 0.8 ? rand(w.schools) : rand(SCHOOLS).id
        if (usedSchools.has(schoolId)) continue
        usedSchools.add(schoolId)
        const startYear = randInt(2000, 2015)
        const gradYear = startYear + randInt(2, 5)
        const s = SCHOOLS.find(x => x.id === schoolId)!
        educations.push({
          schoolId,
          school: s.name,
          startYear,
          endYear: gradYear
        })
      }

      const initials = (first[0] + last[0]).toUpperCase()
      profiles.push({
        id: 'p' + pid++,
        name: first + ' ' + last,
        initials,
        headline: experiences[0].title + ' @ ' + experiences[0].company,
        experiences,
        educations,
        hue: Math.floor(rng() * 360)
      })
    }
  }
  return profiles
}

export const PROFILES: Profile[] = buildProfiles()

// Grayscale palette — bubble color encodes category subtly via darkness.
// Mid-tones chosen to read in both light and dark themes against radial gradient fills.
export const INDUSTRY_COLORS: Record<Industry, string> = {
  consulting: '#1f2937', // slate-800 — densest
  bank: '#374151', // slate-700
  telco: '#4b5563', // slate-600
  startup: '#6b7280', // slate-500
  public: '#52525b' // zinc-600
}

export const SCHOOL_COLOR = '#3f3f46' // zinc-700

export function personColor(p: Pick<Profile, 'hue'>): string {
  // Person bubbles vary in dark-slate lightness only — keeps the cohesive grayscale.
  const lightness = 28 + ((p.hue % 100) / 100) * 28 // 28-56%
  return `hsl(220, 8%, ${lightness}%)`
}

export const YEAR_MIN = 2008
export const YEAR_MAX = 2025
