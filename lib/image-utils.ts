export async function getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  try {
    if (typeof window !== 'undefined') {
      // Browser: use Image object
      return new Promise((resolve) => {
        const img = new window.Image()
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => resolve(null)
        img.src = url
      })
    }
    // Server: use fetch + image-size or probe
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) return null
    const contentLength = response.headers.get('content-length')
    const contentType = response.headers.get('content-type')
    if (!contentType?.startsWith('image/')) return null
    // Return content-length as a rough proxy (not actual dimensions)
    return contentLength ? { width: Math.round(Math.sqrt(Number(contentLength))), height: Math.round(Math.sqrt(Number(contentLength))) } : null
  } catch {
    return null
  }
}

export function isOptimizableUrl(url: string): boolean {
  return url.includes('supabase.co') || url.includes('sdqnzyfmanflslsjhytf') || url.includes('ipumps.ee') || url.includes('pumbapood.ee')
}
