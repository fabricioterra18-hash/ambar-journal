'use client'

import { useState, useTransition } from 'react'
import { use } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { updatePassword } from '@/lib/auth/actions'

export default function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = use(searchParams)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [mismatch, setMismatch] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSubmit(formData: FormData) {
        const password = formData.get('password') as string
        const confirm = formData.get('confirmPassword') as string

        if (password !== confirm) {
            setMismatch(true)
            return
        }
        setMismatch(false)
        startTransition(() => updatePassword(formData))
    }

    return (
        <main className="flex-1 flex flex-col justify-center p-8 bg-fog-100 min-h-screen">
            <div className="w-full max-w-sm mx-auto">
                <div className="w-16 h-16 bg-amber-700 text-sunlight-50 rounded-2xl flex items-center justify-center shadow-lg mb-8">
                    <span className="font-heading text-3xl italic">A</span>
                </div>

                <h1 className="text-4xl font-heading text-ink-900 mb-2">Nova Senha</h1>
                <p className="text-ink-600 font-sans mb-8">
                    Defina sua nova senha para acessar o Âmbar Journal.
                </p>

                {error && (
                    <div className="bg-clay-600/10 border-2 border-clay-600 text-clay-600 p-3 rounded-lg font-sans text-sm mb-6 shadow-[4px_4px_0_0_#1F1B16]">
                        {error}
                    </div>
                )}

                {mismatch && (
                    <div className="bg-clay-600/10 border-2 border-clay-600 text-clay-600 p-3 rounded-lg font-sans text-sm mb-6">
                        As senhas não coincidem.
                    </div>
                )}

                <form action={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="font-sans text-sm font-bold text-ink-900 tracking-wider uppercase">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className="w-full bg-sunlight-50 border-2 border-ink-900 px-4 py-3 pr-12 rounded-xl outline-none focus:border-amber-700 font-sans shadow-[2px_2px_0_0_#1F1B16]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-900 transition-colors p-1"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-sans text-sm font-bold text-ink-900 tracking-wider uppercase">
                            Confirmar Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className="w-full bg-sunlight-50 border-2 border-ink-900 px-4 py-3 pr-12 rounded-xl outline-none focus:border-amber-700 font-sans shadow-[2px_2px_0_0_#1F1B16]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-900 transition-colors p-1"
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-ink-900 text-sunlight-50 p-4 rounded-xl font-sans font-bold hover:translate-y-1 hover:translate-x-1 hover:shadow-none shadow-[4px_4px_0_0_#D9A441] transition-all disabled:opacity-50 mt-4"
                    >
                        {isPending ? 'Salvando...' : 'Salvar nova senha'}
                    </button>
                </form>
            </div>
        </main>
    )
}
