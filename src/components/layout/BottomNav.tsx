'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Book, Grid, Sparkles, Settings } from 'lucide-react'
import { Fab } from '@/components/ui/Fab'
import { CaptureSheet } from '@/components/ui/CaptureSheet'
import clsx from 'clsx'

const navItems = [
  { href: '/', icon: Calendar, label: 'HOJE' },
  { href: '/journal', icon: Book, label: 'JOURNAL' },
  // FAB goes in the middle
  { href: '/collections', icon: Grid, label: 'COLEÇÕES' },
  { href: '/insights', icon: Sparkles, label: 'INSIGHTS' },
]

export function BottomNav() {
  const [isCaptureOpen, setCaptureOpen] = useState(false)
  const pathname = usePathname()

  // Hide on auth/onboarding pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-0 w-full max-w-md bg-sunlight-50 border-t-2 border-ink-900 pb-safe pb-4 pt-2 px-6 flex justify-between items-center z-40 rounded-t-3xl">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-1 transition-colors',
                isActive ? 'text-ink-900' : 'text-ink-600 hover:text-amber-700',
                item.href === '/journal' && 'pr-8'
              )}
            >
              <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              <span className={clsx('text-[10px] tracking-wide', isActive ? 'font-bold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          )
        })}

        <div className="absolute left-1/2 -top-6 -translate-x-1/2">
          <Fab onClick={() => setCaptureOpen(true)} />
        </div>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-1 transition-colors',
                isActive ? 'text-ink-900' : 'text-ink-600 hover:text-amber-700',
                item.href === '/collections' && 'pl-8'
              )}
            >
              <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              <span className={clsx('text-[10px] tracking-wide', isActive ? 'font-bold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      <CaptureSheet isOpen={isCaptureOpen} onClose={() => setCaptureOpen(false)} />
    </>
  )
}
