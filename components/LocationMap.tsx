'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map } from 'leaflet'
import { COMPANY } from '@/lib/config'
import { useTranslations } from 'next-intl'

export default function LocationMap() {
  const t = useTranslations('locationMap')
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const [locating, setLocating] = useState(true)

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

      const UserLocationIcon = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;background:#003366;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,.3)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
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

      const handlePosition = async (pos: GeolocationPosition) => {
        const userLat = pos.coords.latitude
        const userLng = pos.coords.longitude

        L.marker([userLat, userLng], { icon: UserLocationIcon }).addTo(map)

        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${COMPANY.shopLng},${COMPANY.shopLat}?overview=full&geometries=geojson`
          )
          const data = await res.json()
          if (data.code === 'Ok' && data.routes?.[0]) {
            const route = data.routes[0]
            const geo = L.geoJSON(route.geometry, {
              style: { color: '#003366', weight: 4, opacity: 0.75 },
            }).addTo(map)

            const distKm = (route.distance / 1000).toFixed(1)
            const durMin = Math.round(route.duration / 60)

            map.fitBounds(geo.getBounds().pad(0.15))

            L.popup()
              .setLatLng([userLat, userLng])
              .setContent(
                `<b>${t('yourLocation')}</b><br>${t('distance')}: ${distKm} km<br>${t('driveTime')}: ~${durMin} ${t('min')}<br><a href="https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${COMPANY.shopLat},${COMPANY.shopLng}" target="_blank" rel="noopener" style="color:#003366;text-decoration:underline">${t('openInGoogleMaps')} &nearr;</a>`
              )
              .openOn(map)
          }
        } catch {
          const bounds = L.latLngBounds(
            [userLat, userLng],
            [COMPANY.shopLat, COMPANY.shopLng]
          )
          map.fitBounds(bounds.pad(0.15))
        }

        setLocating(false)
      }

      const handleError = () => {
        setLocating(false)
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 600000,
        })
      } else {
        queueMicrotask(() => setLocating(false))
      }
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
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-lg bg-gray-100">
      {locating && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow text-xs text-gray-500 flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
          {t('locating')}
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
