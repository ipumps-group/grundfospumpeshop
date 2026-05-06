export async function uploadFile(file: File, folder = 'uploads'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const data = await res.json() as { url?: string; error?: string }

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Üleslaadimine ebaõnnestus')
  }
  return data.url
}
