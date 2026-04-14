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
      className="w-full flex items-center justify-center gap-3 bg-clay-600/10 text-clay-600 p-4 rounded-2xl font-sans font-medium hover:bg-clay-600/20 transition-colors"
    >
      <LogOut size={18} />
      {isPending ? 'Saindo...' : 'Sair da conta'}
    </button>
  )
}
