import { fetchWithTimeout } from './fetch-utils'

export async function uploadFile(file: File, folder = 'uploads'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  try {
    const res = await fetchWithTimeout('/api/upload', { method: 'POST', body: formData }, 60_000)
    const data = await res.json() as { url?: string; error?: string }

    if (!res.ok || !data.url) {
      throw new Error(data.error ?? 'Üleslaadimine ebaõnnestus')
    }
    return data.url
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Üleslaadimine ebaõnnestus')
  }
}
