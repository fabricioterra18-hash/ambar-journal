'use client'

import { useState, useTransition } from 'react'
import { use } from 'react'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { login, signup, requestPasswordReset } from '@/lib/auth/actions'

type View = 'login' | 'signup' | 'forgot'

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const { error, message } = use(searchParams)
    const [view, setView] = useState<View>('login')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [confirmEmail, setConfirmEmail] = useState('')
    const [emailMismatch, setEmailMismatch] = useState(false)
    const [passwordMismatch, setPasswordMismatch] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSubmit(formData: FormData) {
        if (view === 'forgot') {
            startTransition(() => requestPasswordReset(formData))
            return
        }

        if (view === 'signup') {
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

    function switchView(newView: View) {
        setView(newView)
        setEmailMismatch(false)
        setPasswordMismatch(false)
        setShowPassword(false)
        setShowConfirmPassword(false)
    }

    const titles = {
        login: 'Bem-vindo\nde volta.',
        signup: 'Sua página\nem branco.',
        forgot: 'Uma nova\nchave.',
    }

    const subtitles = {
        login: 'Seu diário continua onde você parou.',
        signup: 'Um Bullet Journal digital, quente e elegante — com um toque de IA.',
        forgot: 'Informe seu email e mandamos um link seguro.',
    }

    return (
        <main className="flex-1 flex flex-col justify-center p-6 bg-background bg-paper min-h-screen">
            <div className="w-full max-w-sm mx-auto">
                {/* Logo */}
                <div className="w-16 h-16 gradient-amber-deep rounded-[22px] flex items-center justify-center shadow-elevated mb-8 rotate-[-4deg]">
                    <span className="title-display title-italic text-4xl text-white">Â</span>
                </div>

                <h1 className="title-display text-[44px] text-charcoal-900 mb-2 whitespace-pre-line">
                    {titles[view]}
                </h1>
                <p className="text-charcoal-500 font-sans text-[15px] leading-relaxed mb-8 max-w-[18rem]">
                    {subtitles[view]}
                </p>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl font-sans text-sm mb-5">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-sage-50 border border-sage-200 text-sage-600 p-3 rounded-xl font-sans text-sm mb-5">
                        {message}
                    </div>
                )}

                {emailMismatch && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl font-sans text-sm mb-5">
                        Os emails nao coincidem.
                    </div>
                )}

                {passwordMismatch && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl font-sans text-sm mb-5">
                        As senhas nao coincidem.
                    </div>
                )}

                <form action={handleSubmit} className="flex flex-col gap-4">
                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-sans text-xs font-semibold text-charcoal-600 tracking-wider uppercase">
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="bg-surface border border-sand-200 px-4 py-3 rounded-xl outline-none focus:border-coral-400 font-sans text-charcoal-900 transition-colors"
                            placeholder="seu@email.com"
                        />
                    </div>

                    {/* Confirm Email */}
                    {view === 'signup' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="font-sans text-xs font-semibold text-charcoal-600 tracking-wider uppercase">
                                Confirmar Email
                            </label>
                            <input
                                type="email"
                                required
                                value={confirmEmail}
                                onChange={(e) => { setConfirmEmail(e.target.value); setEmailMismatch(false) }}
                                autoComplete="email"
                                className="bg-surface border border-sand-200 px-4 py-3 rounded-xl outline-none focus:border-coral-400 font-sans text-charcoal-900 transition-colors"
                                placeholder="repita seu email"
                            />
                        </div>
                    )}

                    {/* Password */}
                    {view !== 'forgot' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="font-sans text-xs font-semibold text-charcoal-600 tracking-wider uppercase">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                                    className="w-full bg-surface border border-sand-200 px-4 py-3 pr-12 rounded-xl outline-none focus:border-coral-400 font-sans text-charcoal-900 transition-colors"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Confirm Password */}
                    {view === 'signup' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="font-sans text-xs font-semibold text-charcoal-600 tracking-wider uppercase">
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    className="w-full bg-surface border border-sand-200 px-4 py-3 pr-12 rounded-xl outline-none focus:border-coral-400 font-sans text-charcoal-900 transition-colors"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Forgot password link */}
                    {view === 'login' && (
                        <button
                            type="button"
                            onClick={() => switchView('forgot')}
                            className="text-sm text-coral-500 font-sans font-medium self-end -mt-1 hover:text-coral-600 transition-colors"
                        >
                            Esqueci minha senha
                        </button>
                    )}

                    <div className="flex flex-col gap-3 mt-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full gradient-amber-deep text-white p-4 rounded-2xl font-sans font-semibold shadow-elevated press disabled:opacity-50 focus-ring"
                        >
                            {isPending
                                ? (view === 'forgot' ? 'Enviando...' : view === 'signup' ? 'Criando conta...' : 'Entrando...')
                                : (view === 'forgot' ? 'Enviar link' : view === 'signup' ? 'Criar Conta' : 'Entrar')
                            }
                        </button>

                        {view === 'forgot' ? (
                            <button
                                type="button"
                                onClick={() => switchView('login')}
                                className="w-full bg-surface border border-sand-200 text-charcoal-700 p-4 rounded-xl font-sans font-semibold hover:bg-sand-50 transition-colors"
                            >
                                Voltar para o login
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => switchView(view === 'signup' ? 'login' : 'signup')}
                                className="w-full bg-surface border border-sand-200 text-charcoal-700 p-4 rounded-xl font-sans font-semibold hover:bg-sand-50 transition-colors"
                            >
                                {view === 'signup' ? 'Ja tenho conta' : 'Criar conta'}
                            </button>
                        )}
                    </div>
                </form>

                {/* Footer badge */}
                <div className="flex items-center justify-center gap-1.5 mt-10 text-charcoal-400">
                    <Sparkles size={11} className="text-amber-500" />
                    <span className="text-[10px] font-medium tracking-wider uppercase">Âmbar · Escreva do seu jeito</span>
                </div>
            </div>
        </main>
    )
}
