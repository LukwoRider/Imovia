'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()


    let origin = ''
    try {
        origin = (await headers()).get('origin') || ''
    } catch {
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstname = formData.get('firstname') as string
    const lastname = formData.get('lastname') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as string

    const fullName = `${firstname} ${lastname}`.trim()

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
            data: {
                full_name: fullName,
                phone,
                role_request: role
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    if (data.user && role && role !== 'tenant') {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: role })
            .eq('id', data.user.id)

        if (updateError) {
        }
    }

    if (data.session) {
        revalidatePath('/', 'layout')
        if (role === 'owner' || role === 'agency') {
            redirect('/dashboard/owner')
        } else {
            redirect('/dashboard/tenant')
        }
    } else {

        return { success: true, message: "Veuillez vérifier votre email pour confirmer votre compte." }
    }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/')
}
