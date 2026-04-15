import { getProfile } from '@/lib/services/workspace'
import { getPreferences } from '@/lib/services/preferences'
import { SettingsForm } from './settings-form'
import { LogoutButton } from './logout-button'
import { User } from 'lucide-react'

export default async function SettingsPage() {
  const profile = await getProfile()
  const preferences = await getPreferences()

  return (
    <main className="flex-1 flex flex-col p-5 pb-32">
      <header className="pt-6 pb-5">
        <p className="text-charcoal-400 font-sans font-medium text-xs tracking-widest uppercase mb-1">
          Configuracoes
        </p>
        <h1 className="text-2xl font-heading text-charcoal-900">
          Preferencias
        </h1>
      </header>

      {/* Profile card */}
      <section className="mb-6">
        <div className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-coral flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-white" />
          </div>
          <div className="min-w-0">
            {profile.full_name && (
              <p className="font-sans text-base text-charcoal-900 font-semibold truncate">{profile.full_name}</p>
            )}
            <p className="font-sans text-sm text-charcoal-400 truncate">{profile.email}</p>
          </div>
        </div>
      </section>

      <SettingsForm preferences={preferences} />

      <section className="mt-6">
        <LogoutButton />
      </section>
    </main>
  )
}
