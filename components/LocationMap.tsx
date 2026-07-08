'use client'

import { useEffect, useRef } from 'react'
import type { Map } from 'leaflet'
import { COMPANY } from '@/lib/config'

export default function LocationMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    import('leaflet').then(async (L) => {
      if (cancelled) return
      // @ts-expect-error - CSS import has no types
      await import('leaflet/dist/leaflet.css')

      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [COMPANY.shopLat, COMPANY.shopLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      L.marker([COMPANY.shopLat, COMPANY.shopLng], { icon: DefaultIcon })
        .addTo(map)
        .bindPopup(`<b>${COMPANY.legalName}</b><br>${COMPANY.shopAddress.street}, ${COMPANY.shopAddress.locality}`)

      mapRef.current = map
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg bg-gray-100" />
  )
}
