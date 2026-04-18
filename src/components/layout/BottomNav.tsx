'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, BarChart3, Settings, Plus } from 'lucide-react'
import { CaptureSheet } from '@/components/ui/CaptureSheet'
import clsx from 'clsx'

const navItems = [
  { href: '/', icon: Home, label: 'Hoje' },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  // FAB center
  { href: '/tracker', icon: BarChart3, label: 'Tracker' },
  { href: '/settings', icon: Settings, label: 'Config' },
]

export function BottomNav() {
  const [isCaptureOpen, setCaptureOpen] = useState(false)
  const pathname = usePathname()

  if (pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-0 w-full max-w-md z-40">
        <div className="relative bg-surface/90 backdrop-blur-xl border-t border-sand-200/60 safe-bottom px-2 pt-2 pb-3">
          {/* FAB button - centered */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50">
            <button
              onClick={() => setCaptureOpen(true)}
              aria-label="Capturar"
              className="w-14 h-14 gradient-amber-deep rounded-2xl flex items-center justify-center shadow-elevated press focus-ring rotate-[-3deg]"
            >
              <Plus size={24} className="text-white" strokeWidth={2.2} />
            </button>
          </div>

          <div className="flex items-center justify-around">
            {navItems.slice(0, 2).map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all',
                    isActive
                      ? 'text-amber-500'
                      : 'text-charcoal-400 active:text-charcoal-600'
                  )}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                  <span className={clsx(
                    'text-[10px] tracking-wide',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Spacer for FAB */}
            <div className="w-16" />

            {navItems.slice(2).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all',
                    isActive
                      ? 'text-amber-500'
                      : 'text-charcoal-400 active:text-charcoal-600'
                  )}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                  <span className={clsx(
                    'text-[10px] tracking-wide',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <CaptureSheet isOpen={isCaptureOpen} onClose={() => setCaptureOpen(false)} />
    </>
  )
}
