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

export async function requestPasswordReset(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;

    if (!email) {
        return redirect('/auth/login?error=' + encodeURIComponent('Informe seu email.'));
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) {
        return redirect('/auth/login?error=' + encodeURIComponent('Erro ao enviar email de recuperação. Tente novamente.'));
    }

    return redirect('/auth/login?message=' + encodeURIComponent(
        'Email de recuperação enviado! Verifique sua caixa de entrada e spam.'
    ));
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();
    const password = formData.get('password') as string;

    if (!password || password.length < 6) {
        return redirect('/auth/reset-password?error=' + encodeURIComponent('A senha deve ter no mínimo 6 caracteres.'));
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        let msg = error.message;
        if (msg.includes('same password')) {
            msg = 'A nova senha não pode ser igual à anterior.';
        }
        return redirect('/auth/reset-password?error=' + encodeURIComponent(msg));
    }

    revalidatePath('/', 'layout');
    redirect('/auth/login?message=' + encodeURIComponent('Senha atualizada com sucesso! Faça login com sua nova senha.'));
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/auth/login');
}
