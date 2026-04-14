import { getProfile } from '@/lib/services/workspace'
import { getPreferences } from '@/lib/services/preferences'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const profile = await getProfile()
  const preferences = await getPreferences()

  return (
    <main className="flex-1 flex flex-col p-6 pb-32">
      <header className="pt-8 pb-6 border-b border-fog-100/50 mb-6">
        <p className="text-ink-600 font-sans font-medium text-xs tracking-wide uppercase mb-1">
          Configurações
        </p>
        <h1 className="text-3xl font-heading text-ink-900 tracking-tight">
          Preferências
        </h1>
      </header>

      <section className="mb-8">
        <h3 className="font-heading text-lg text-ink-900 mb-4">Perfil</h3>
        <div className="bg-surface-lowest rounded-2xl p-5 shadow-sm border border-sunlight-200/20">
          <p className="font-sans text-sm text-ink-600 mb-1">Email</p>
          <p className="font-sans text-base text-ink-900 font-medium">{profile.email}</p>
          {profile.full_name && (
            <>
              <p className="font-sans text-sm text-ink-600 mb-1 mt-4">Nome</p>
              <p className="font-sans text-base text-ink-900 font-medium">{profile.full_name}</p>
            </>
          )}
        </div>
      </section>

      <SettingsForm preferences={preferences} />

      <section className="mt-8">
        <LogoutButton />
      </section>
    </main>
  )
}

import { LogoutButton } from './logout-button'
