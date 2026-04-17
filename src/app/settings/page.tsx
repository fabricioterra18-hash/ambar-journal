import { getProfile } from '@/lib/services/workspace'
import { getPreferences } from '@/lib/services/preferences'
import { SettingsForm } from './settings-form'
import { ProfileForm } from './profile-form'
import { LogoutButton } from './logout-button'

export default async function SettingsPage() {
  const [profile, preferences] = await Promise.all([
    getProfile(),
    getPreferences(),
  ])

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

      {/* Profile */}
      <section className="mb-6">
        <ProfileForm name={profile.full_name ?? ''} avatarUrl={profile.avatar_url ?? ''} />
      </section>

      <SettingsForm preferences={preferences} />

      <section className="mt-6">
        <LogoutButton />
      </section>
    </main>
  )
}
