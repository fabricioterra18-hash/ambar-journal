'use client'

import { useState, useTransition } from 'react'
import { Check, Pencil } from 'lucide-react'
import { updateProfileAction } from '@/lib/actions/profile-actions'

const AVATAR_EMOJIS = [
  '🦊', '🐻', '🐼', '🦁', '🐯', '🦝', '🐺', '🦉',
  '🌻', '🌸', '🌿', '⭐', '🔥', '💎', '🎯', '🚀',
]

interface ProfileFormProps {
  name: string
  avatarUrl: string
}

export function ProfileForm({ name: initialName, avatarUrl: initialAvatar }: ProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [avatar, setAvatar] = useState(initialAvatar || '🦊')
  const [editing, setEditing] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateProfileAction({ full_name: name.trim(), avatar_url: avatar })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const isEmoji = avatar && avatar.length <= 4 && /\p{Emoji}/u.test(avatar)

  return (
    <div className="bg-surface rounded-2xl p-5 card-shadow border border-sand-200/40">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-14 h-14 rounded-2xl gradient-coral flex items-center justify-center flex-shrink-0 text-2xl relative hover:opacity-90 transition-opacity"
          title="Escolher avatar"
        >
          {isEmoji ? avatar : <span className="text-white text-2xl">👤</span>}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface border border-sand-200 rounded-full flex items-center justify-center">
            <Pencil size={9} className="text-charcoal-500" />
          </span>
        </button>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
              autoFocus
              className="w-full bg-sand-50 border border-coral-200 rounded-xl px-3 py-2 text-sm font-sans text-charcoal-900 outline-none focus:border-coral-400"
              placeholder="Seu nome"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="group flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <p className="font-sans text-base text-charcoal-900 font-semibold truncate">
                {name || 'Adicionar nome'}
              </p>
              {saved ? (
                <Check size={13} className="text-sage-500 flex-shrink-0" />
              ) : (
                <Pencil size={13} className="text-charcoal-300 group-hover:text-charcoal-500 flex-shrink-0 transition-colors" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Emoji picker */}
      {showPicker && (
        <div className="mt-4 pt-4 border-t border-sand-100">
          <p className="text-[10px] text-charcoal-400 font-medium uppercase tracking-wider mb-2">Escolher avatar</p>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATAR_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setAvatar(emoji)
                  setShowPicker(false)
                  startTransition(() => updateProfileAction({ avatar_url: emoji }))
                }}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                  avatar === emoji ? 'bg-coral-100 ring-2 ring-coral-400 scale-110' : 'hover:bg-sand-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {isPending && (
        <p className="text-[10px] text-charcoal-400 mt-3 text-center">Salvando...</p>
      )}
    </div>
  )
}
