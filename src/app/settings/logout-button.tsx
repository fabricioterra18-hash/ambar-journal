'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { logout } from '@/lib/auth/actions'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-3 bg-rose-50 text-rose-500 p-4 rounded-2xl font-sans font-semibold hover:bg-rose-100 transition-colors border border-rose-100 active:scale-98"
    >
      <LogOut size={18} />
      {isPending ? 'Saindo...' : 'Sair da conta'}
    </button>
  )
}
