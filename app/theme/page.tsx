import { IconLogo } from '@/components/ui/icons'

import { LogoShowcase } from './logo-showcase'

const COLOR_CATEGORIES = [
  {
    name: 'Brand',
    count: 6,
    source: 'Burning',
    swatches: [
      { label: 'Hard', color: '#662711', token: '800' },
      { label: 'Strong', color: '#993b19', token: '700' },
      { label: 'Base', color: '#cc4f22', token: '600' },
      { label: 'Sub', color: '#ff632a', token: '500' },
      { label: 'Soft', color: '#ffc0aa', token: '200' },
      {
        label: 'Fade',
        color: 'rgba(255,192,170,0.25)',
        token: 'Alpha 25%'
      }
    ]
  },
  {
    name: 'Error',
    count: 6,
    source: 'Sunglo',
    swatches: [
      { label: 'Hard', color: '#592d2d', token: '800' },
      { label: 'Strong', color: '#864343', token: '700' },
      { label: 'Base', color: '#b25a5a', token: '600' },
      { label: 'Sub', color: '#df7070', token: '500' },
      { label: 'Soft', color: '#f2c6c6', token: '200' },
      {
        label: 'Fade',
        color: 'rgba(242,198,198,0.25)',
        token: 'Alpha 25%'
      }
    ]
  },
  {
    name: 'Success',
    count: 6,
    source: 'Fringy Flower',
    swatches: [
      { label: 'Hard', color: '#485b51', token: '800' },
      { label: 'Strong', color: '#6d8979', token: '700' },
      { label: 'Base', color: '#91b6a2', token: '600' },
      { label: 'Sub', color: '#b5e4ca', token: '500' },
      { label: 'Soft', color: '#e1f4ea', token: '200' },
      {
        label: 'Fade',
        color: 'rgba(225,244,234,0.25)',
        token: 'Alpha 25%'
      }
    ]
  },
  {
    name: 'Warning',
    count: 6,
    source: 'Salomie',
    swatches: [
      { label: 'Hard', color: '#665638', token: '800' },
      { label: 'Strong', color: '#998255', token: '700' },
      { label: 'Base', color: '#ccad71', token: '600' },
      { label: 'Sub', color: '#ffd88d', token: '500' },
      { label: 'Soft', color: '#ffefd1', token: '200' },
      {
        label: 'Fade',
        color: 'rgba(255,239,209,0.25)',
        token: 'Alpha 25%'
      }
    ]
  },
  {
    name: 'Pending',
    count: 6,
    source: 'Wax Flower',
    swatches: [
      { label: 'Hard', color: '#664b3d', token: '800' },
      { label: 'Strong', color: '#99715c', token: '700' },
      { label: 'Base', color: '#cc977b', token: '600' },
      { label: 'Sub', color: '#ffbc99', token: '500' },
      { label: 'Soft', color: '#ffe4d6', token: '200' },
      {
        label: 'Fade',
        color: 'rgba(255,228,214,0.25)',
        token: 'Alpha 25%'
      }
    ]
  },
  {
    name: 'Info',
    count: 6,
    source: 'Azure Radiance',
    swatches: [
      { label: 'Hard', color: '#113566', token: '800' },
      { label: 'Strong', color: '#195099', token: '700' },
      { label: 'Base', color: '#226acc', token: '600' },
      { label: 'Sub', color: '#2a85ff', token: '500' },
      { label: 'Soft', color: '#aaceff', token: '200' },
      {
        label: 'Fade',
        color: 'rgba(170,206,255,0.25)',
        token: 'Alpha 25%'
      }
    ]
  },
  {
    name: 'Draft',
    count: 6,
    source: 'Melrose',
    swatches: [
      { label: 'Hard', color: '#514c66', token: '800' },
      { label: 'Strong', color: '#797299', token: '700' },
      { label: 'Base', color: '#a297cc', token: '600' },
      { label: 'Sub', color: '#cabdff', token: '500' },
      { label: 'Soft', color: '#eae5ff', token: '200' },
      {
        label: 'Fade',
        color: 'rgba(234,229,255,0.25)',
        token: 'Alpha 25%'
      }
    ]
  }
] as const

function CategoryBadge({
  name,
  count
}: {
  name: string
  count: number
}) {
  return (
    <div className="flex w-fit items-center gap-3 rounded-full bg-[#eaeaea] px-4 py-2 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),inset_0px_0.75px_0.75px_0px_rgba(255,255,255,0.65)]">
      <span className="text-xl font-bold tracking-tight text-[#2f2f2f]">
        {name}
      </span>
      <div className="h-[22px] w-px rotate-90" />
      <div className="flex items-center gap-1 text-xs font-bold text-[#2f2f2f]">
        <span>{count}</span>
        <span>Variables</span>
      </div>
    </div>
  )
}

function SwatchCard({
  label,
  color,
  source,
  token
}: {
  label: string
  color: string
  source: string
  token: string
}) {
  return (
    <div className="flex min-w-[260px] flex-1 flex-col gap-3 rounded-2xl bg-[#f6f6f6] p-3">
      <div
        className="h-[136px] w-full rounded-[10px]"
        style={{ backgroundColor: color }}
      />
      <p className="text-xl font-bold tracking-tight text-[#2f2f2f]">
        {label}
      </p>
      <div className="flex items-center gap-1">
        <div
          className="size-4 shrink-0 rounded"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-bold text-[#2f2f2f]">{source}</span>
        <span className="text-xs font-bold text-[#a9a9a9]">/</span>
        <span className="text-xs font-bold text-[#2f2f2f]">{token}</span>
      </div>
    </div>
  )
}

export default function ThemePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#eaeaea]">
      <div className="mx-auto w-full max-w-[1120px] px-12 pt-12">
        <div className="flex flex-col gap-5 rounded-[48px] bg-[#f6f6f6] p-12">
          <IconLogo className="size-6" />
          <h1 className="text-[40px] font-bold leading-[48px] tracking-tight text-[#2f2f2f]">
            Theme Base
          </h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1120px] px-12 pt-6">
        <LogoShowcase />
      </div>

      <div className="mx-auto w-full max-w-[1120px] px-12 py-6">
        <div className="flex flex-col gap-32 px-12 py-12">
          {COLOR_CATEGORIES.map(category => (
            <section
              key={category.name}
              className="flex flex-col gap-6"
            >
              <CategoryBadge
                name={category.name}
                count={category.count}
              />
              <div className="flex flex-wrap gap-3">
                {category.swatches.map(swatch => (
                  <SwatchCard
                    key={swatch.label}
                    label={swatch.label}
                    color={swatch.color}
                    source={category.source}
                    token={swatch.token}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pb-12 pt-8">
        <div className="flex items-center gap-2">
          <IconLogo className="size-5" />
          <span className="text-sm font-semibold text-[#2f2f2f]">
            Melron
          </span>
        </div>
        <p className="text-xs text-[#a9a9a9]">Melron AI &copy; 2025</p>
      </div>
    </div>
  )
}
