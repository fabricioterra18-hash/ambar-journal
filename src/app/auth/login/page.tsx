'use client'

import { login, signup } from '@/lib/auth/actions'
import { use } from 'react'

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = use(searchParams)

    return (
        <main className="flex-1 flex flex-col justify-center p-8 bg-fog-100 min-h-screen">
            <div className="w-full max-w-sm mx-auto">
                <div className="w-16 h-16 bg-amber-700 text-sunlight-50 rounded-2xl flex items-center justify-center shadow-lg mb-8">
                    <span className="font-heading text-3xl italic">A</span>
                </div>

                <h1 className="text-4xl font-heading text-ink-900 mb-2">Entrar</h1>
                <p className="text-ink-600 font-sans mb-8">Acesse seu Âmbar Journal.</p>

                {error && (
                    <div className="bg-clay-600/10 border-2 border-clay-600 text-clay-600 p-3 rounded-lg font-sans text-sm mb-6 shadow-[4px_4px_0_0_#1F1B16]">
                        {error}
                    </div>
                )}

                <form className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="font-sans text-sm font-bold text-ink-900 tracking-wider uppercase">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="bg-sunlight-50 border-2 border-ink-900 px-4 py-3 rounded-xl outline-none focus:border-amber-700 font-sans shadow-[2px_2px_0_0_#1F1B16]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-sans text-sm font-bold text-ink-900 tracking-wider uppercase">Senha</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="bg-sunlight-50 border-2 border-ink-900 px-4 py-3 rounded-xl outline-none focus:border-amber-700 font-sans shadow-[2px_2px_0_0_#1F1B16]"
                        />
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            formAction={login}
                            className="w-full bg-ink-900 text-sunlight-50 p-4 rounded-xl font-sans font-bold hover:translate-y-1 hover:translate-x-1 hover:shadow-none shadow-[4px_4px_0_0_#D9A441] transition-all"
                        >
                            Fazer Login
                        </button>
                        <button
                            formAction={signup}
                            className="w-full bg-sunlight-50 border-2 border-ink-900 text-ink-900 p-4 rounded-xl font-sans font-bold hover:translate-y-1 hover:translate-x-1 hover:shadow-none shadow-[4px_4px_0_0_#1F1B16] transition-all"
                        >
                            Criar Conta Pessoal
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
