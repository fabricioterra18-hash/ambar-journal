'use client'

import { useState, useTransition } from 'react'
import { use } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { login, signup } from '@/lib/auth/actions'

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const { error, message } = use(searchParams)
    const [isSignup, setIsSignup] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [confirmEmail, setConfirmEmail] = useState('')
    const [emailMismatch, setEmailMismatch] = useState(false)
    const [passwordMismatch, setPasswordMismatch] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSubmit(formData: FormData) {
        if (isSignup) {
            const email = formData.get('email') as string
            if (email !== confirmEmail) {
                setEmailMismatch(true)
                return
            }
            setEmailMismatch(false)

            const password = formData.get('password') as string
            const confirmPwd = formData.get('confirmPassword') as string
            if (password !== confirmPwd) {
                setPasswordMismatch(true)
                return
            }
            setPasswordMismatch(false)

            startTransition(() => signup(formData))
        } else {
            startTransition(() => login(formData))
        }
    }

    return (
        <main className="flex-1 flex flex-col justify-center p-8 bg-fog-100 min-h-screen">
            <div className="w-full max-w-sm mx-auto">
                <div className="w-16 h-16 bg-amber-700 text-sunlight-50 rounded-2xl flex items-center justify-center shadow-lg mb-8">
                    <span className="font-heading text-3xl italic">A</span>
                </div>

                <h1 className="text-4xl font-heading text-ink-900 mb-2">
                    {isSignup ? 'Criar Conta' : 'Entrar'}
                </h1>
                <p className="text-ink-600 font-sans mb-8">
                    {isSignup ? 'Crie sua conta no Âmbar Journal.' : 'Acesse seu Âmbar Journal.'}
                </p>

                {error && (
                    <div className="bg-clay-600/10 border-2 border-clay-600 text-clay-600 p-3 rounded-lg font-sans text-sm mb-6 shadow-[4px_4px_0_0_#1F1B16]">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-olive-600/10 border-2 border-olive-600 text-olive-600 p-3 rounded-lg font-sans text-sm mb-6 shadow-[4px_4px_0_0_#1F1B16]">
                        {message}
                    </div>
                )}

                {emailMismatch && (
                    <div className="bg-clay-600/10 border-2 border-clay-600 text-clay-600 p-3 rounded-lg font-sans text-sm mb-6">
                        Os emails não coincidem.
                    </div>
                )}

                {passwordMismatch && (
                    <div className="bg-clay-600/10 border-2 border-clay-600 text-clay-600 p-3 rounded-lg font-sans text-sm mb-6">
                        As senhas não coincidem.
                    </div>
                )}

                <form action={handleSubmit} className="flex flex-col gap-5">
                    {/* Email */}
                    <div className="flex flex-col gap-2">
                        <label className="font-sans text-sm font-bold text-ink-900 tracking-wider uppercase">
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="bg-sunlight-50 border-2 border-ink-900 px-4 py-3 rounded-xl outline-none focus:border-amber-700 font-sans shadow-[2px_2px_0_0_#1F1B16]"
                        />
                    </div>

                    {/* Confirm Email (signup only) */}
                    {isSignup && (
                        <div className="flex flex-col gap-2">
                            <label className="font-sans text-sm font-bold text-ink-900 tracking-wider uppercase">
                                Confirmar Email
                            </label>
                            <input
                                type="email"
                                required
                                value={confirmEmail}
                                onChange={(e) => { setConfirmEmail(e.target.value); setEmailMismatch(false) }}
                                autoComplete="email"
                                className="bg-sunlight-50 border-2 border-ink-900 px-4 py-3 rounded-xl outline-none focus:border-amber-700 font-sans shadow-[2px_2px_0_0_#1F1B16]"
                            />
                        </div>
                    )}

                    {/* Password */}
                    <div className="flex flex-col gap-2">
                        <label className="font-sans text-sm font-bold text-ink-900 tracking-wider uppercase">
                            Senha
                        </label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                autoComplete={isSignup ? 'new-password' : 'current-password'}
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

                    {/* Confirm Password (signup only) */}
                    {isSignup && (
                        <div className="flex flex-col gap-2">
                            <label className="font-sans text-sm font-bold text-ink-900 tracking-wider uppercase">
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    className="w-full bg-sunlight-50 border-2 border-ink-900 px-4 py-3 pr-12 rounded-xl outline-none focus:border-amber-700 font-sans shadow-[2px_2px_0_0_#1F1B16]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-900 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-ink-900 text-sunlight-50 p-4 rounded-xl font-sans font-bold hover:translate-y-1 hover:translate-x-1 hover:shadow-none shadow-[4px_4px_0_0_#D9A441] transition-all disabled:opacity-50"
                        >
                            {isPending
                                ? (isSignup ? 'Criando conta...' : 'Entrando...')
                                : (isSignup ? 'Criar Conta' : 'Fazer Login')
                            }
                        </button>

                        <button
                            type="button"
                            onClick={() => { setIsSignup(!isSignup); setEmailMismatch(false); setPasswordMismatch(false) }}
                            className="w-full bg-sunlight-50 border-2 border-ink-900 text-ink-900 p-4 rounded-xl font-sans font-bold hover:translate-y-1 hover:translate-x-1 hover:shadow-none shadow-[4px_4px_0_0_#1F1B16] transition-all"
                        >
                            {isSignup ? 'Já tenho conta — Entrar' : 'Criar Conta Pessoal'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
