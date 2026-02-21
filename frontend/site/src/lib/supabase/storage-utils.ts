import { createClient } from './client'

/**
 * Resolves a storage path from Supabase to a public URL.
 * Handles both relative paths (expected by our backend contract) and full URLs.
 * 
 * @param path The storage path (e.g. 'properties/uuid/filename.jpg') or a full URL
 * @param bucket The bucket name (defaults to 'property-images')
 * @returns The resolved public URL
 */
export function getPublicUrl(path: string | null | undefined, bucket: string = 'property-images'): string {
    if (!path) return ''

    // If it's already a full URL, return it
    if (path.startsWith('http')) return path

    const supabase = createClient()
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

    return publicUrl
}
