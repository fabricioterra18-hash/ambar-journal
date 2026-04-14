'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
    const supabase = await createClient();
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        // Translate common errors to PT-BR
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
            msg = 'Email ou senha incorretos.';
        } else if (msg.includes('Email not confirmed')) {
            msg = 'Email ainda não confirmado. Verifique sua caixa de entrada e spam.';
        }
        return redirect('/auth/login?error=' + encodeURIComponent(msg));
    }

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signup(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (password.length < 6) {
        return redirect('/auth/login?error=' + encodeURIComponent('A senha deve ter no mínimo 6 caracteres.'));
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        },
    });

    if (error) {
        let msg = error.message;
        if (msg.includes('already registered')) {
            msg = 'Este email já está cadastrado. Tente fazer login.';
        } else if (msg.includes('valid email')) {
            msg = 'Informe um email válido.';
        }
        return redirect('/auth/login?error=' + encodeURIComponent(msg));
    }

    // Supabase returns user but with no session if email confirmation is required
    if (signUpData.user && !signUpData.session) {
        return redirect('/auth/login?message=' + encodeURIComponent(
            'Conta criada! Verifique seu email para confirmar o cadastro antes de fazer login.'
        ));
    }

    revalidatePath('/', 'layout');
    redirect('/onboarding');
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/auth/login');
}
