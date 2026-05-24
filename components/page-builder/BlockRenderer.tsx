import FeaturedProductsSlider from '@/components/FeaturedProductsSlider'
import PumpCalculator from '@/components/PumpCalculator'
import ContactForm from '@/components/ContactForm'
import LocationMap from '@/components/LocationMap'
import ShortcodeRenderer from '@/components/ShortcodeRenderer'
import SearchBarBlockRenderer from './SearchBarBlockRenderer'
import TegevusaladBlockRenderer from './TegevusaladBlockRenderer'
import Image from 'next/image'
import type { Section, ContentBlock, HeadingBlock, TextBlock, ImageBlock, ButtonBlock, VideoBlock, DividerBlock, SpacerBlock, SliderBlock } from './types'

// ─── Video URL parser ──────────────────────────────────────────────────────

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  if (/google\.com\/maps|maps\.google\.com/.test(url)) return url
  return null
}

// ─── Image URL optimizer ───────────────────────────────────────────────────

function optimizeUrl(url: string | null, maxWidth = 1920): string | null {
  if (!url) return null
  // Supabase storage URLs — append transformation params for on-the-fly resize
  if (url.includes('supabase.co/storage/v1/object/public')) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}width=${maxWidth}&quality=80`
  }
  return url
}

// ─── Padding helper ────────────────────────────────────────────────────────

function getPadding(size: string, custom?: number): { paddingTop?: string; paddingBottom?: string } {
  switch (size) {
    case 'small':  return {}  // handled by className
    case 'medium': return {}
    case 'large':  return {}
    case 'custom': return { paddingTop: `${custom ?? 0}px`, paddingBottom: `${custom ?? 0}px` }
    default: return {}
  }
}

const PAD_TOP: Record<string, string> = {
  small: 'pt-4', medium: 'pt-12', large: 'pt-24', custom: '',
}
const PAD_BOT: Record<string, string> = {
  small: 'pb-4', medium: 'pb-12', large: 'pb-24', custom: '',
}
const PAD_X: Record<string, string> = {
  small: 'px-4', medium: 'px-8', large: 'px-16', custom: '',
}

// ─── Single block renderer ─────────────────────────────────────────────────

function textByLocale(block: Record<string, unknown>, field: string, locale: string): string {
  if (locale !== 'et') {
    const localeField = `${field}_${locale}`
    const val = block[localeField]
    if (typeof val === 'string' && val) return val
  }
  return typeof block[field] === 'string' ? block[field] as string : ''
}

function RenderBlock({ block, locale }: { block: ContentBlock; locale: string }) {
  switch (block.type) {
    case 'heading': {
      const b = block as HeadingBlock
      const Tag = b.level as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const resolved = textByLocale(b as unknown as Record<string, unknown>, 'text', locale)
      const alignClass = b.alignment === 'center' ? 'text-center' : b.alignment === 'right' ? 'text-right' : 'text-left'
      const weightClass = ['h1','h2'].includes(b.level) ? 'font-bold' : 'font-semibold'
      const sizeClass = b.custom_size ? '' : {
        h1: 'text-3xl md:text-4xl',
        h2: 'text-2xl md:text-3xl',
        h3: 'text-xl md:text-2xl',
        h4: 'text-lg md:text-xl',
        h5: 'text-base md:text-lg',
        h6: 'text-base',
      }[b.level]
      const style: React.CSSProperties = { color: b.color }
      if (b.custom_size) style.fontSize = `${b.custom_size}${b.custom_unit ?? 'px'}`
      return (
        <Tag className={`${sizeClass} ${weightClass} leading-tight ${alignClass}`} style={style}>
          {resolved}
        </Tag>
      )
    }
    case 'text': {
      const b = block as TextBlock
      const resolvedContent = textByLocale(b as unknown as Record<string, unknown>, 'content', locale)
      const alignClass = b.alignment === 'center' ? 'text-center' : b.alignment === 'right' ? 'text-right' : 'text-left'
      const textStyle: React.CSSProperties = { color: b.color }
      if (b.font_size) textStyle.fontSize = `${b.font_size}${b.font_size_unit ?? 'px'}`
      const isHtml = /<[a-z][\s\S]*>/i.test(resolvedContent)
      const hasShortcode = /\[[a-z_]+\]/.test(resolvedContent)
      if (isHtml || hasShortcode) {
        return (
          <ShortcodeRenderer
            html={resolvedContent}
            className={`leading-relaxed ${b.font_size ? '' : 'text-[16px]'} ${alignClass}
              [&_b]:font-bold [&_strong]:font-bold
              [&_i]:italic [&_em]:italic
              [&_a]:text-[#003366] [&_a]:underline [&_a:hover]:text-[#01a0dc]
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
              [&_li]:my-0.5
              [&_h1]:text-3xl md:[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-2xl md:[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:mt-4 [&_h2]:mb-2
              [&_h3]:text-xl md:[&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:mt-3 [&_h3]:mb-1
              [&_h4]:text-lg md:[&_h4]:text-xl [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1
              [&_h5]:text-base md:[&_h5]:text-lg [&_h5]:font-semibold [&_h5]:mt-2 [&_h5]:mb-1
              [&_h6]:text-base [&_h6]:font-semibold [&_h6]:mt-2 [&_h6]:mb-1`}
            style={textStyle}
          />
        )
      }
      return (
        <p className={`${b.font_size ? '' : 'text-[16px]'} leading-relaxed whitespace-pre-line ${alignClass}`} style={textStyle}>
          {resolvedContent}
        </p>
      )
    }
    case 'image': {
      const b = block as ImageBlock
      const src = optimizeUrl(b.url) || b.url
      const isSupabase = b.url.includes('supabase.co') || b.url.includes('sdqnzyfmanflslsjhytf')
      const hasDimensions = b.image_width && b.image_height

      const img = hasDimensions ? (
        <Image
          src={src}
          alt={b.alt}
          width={b.image_width!}
          height={b.image_height!}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="w-full h-auto rounded"
          style={{ objectFit: b.object_fit }}
        />
      ) : isSupabase ? (
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <Image
            src={src}
            alt={b.alt}
            fill
            sizes="100vw"
            className="rounded"
            style={{ objectFit: b.object_fit }}
          />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={b.url}
          alt={b.alt}
          loading="lazy"
          decoding="async"
          className="w-full h-auto rounded"
          style={{ objectFit: b.object_fit }}
        />
      )
      if (b.link_url) {
        return (
          <a href={b.link_url} target={b.link_target} rel={b.link_target === '_blank' ? 'noopener noreferrer' : undefined}>
            {img}
          </a>
        )
      }
      return img
    }
    case 'button': {
      const b = block as ButtonBlock
      const resolvedText = textByLocale(b as unknown as Record<string, unknown>, 'text', locale)
      const alignClass = b.alignment === 'center' ? 'text-center' : b.alignment === 'right' ? 'text-right' : 'text-left'
      const btnFontSize = b.font_size ? `${b.font_size}px` : undefined
      let btnCls = `inline-block px-6 py-3 rounded-xl font-semibold ${b.font_size ? '' : 'text-[15px]'} transition-opacity hover:opacity-80`
      if (b.style === 'filled') {
        btnCls += ' text-white'
      } else if (b.style === 'outline') {
        btnCls += ' bg-transparent border-2'
      } else {
        btnCls += ' bg-transparent underline'
      }
      const btnStyle: React.CSSProperties =
        b.style === 'filled'
          ? { backgroundColor: b.color, fontSize: btnFontSize }
          : b.style === 'outline'
          ? { color: b.color, borderColor: b.color, fontSize: btnFontSize }
          : { color: b.color, fontSize: btnFontSize }
      return (
        <div className={alignClass}>
          <a href={b.url} target={b.target} rel={b.target === '_blank' ? 'noopener noreferrer' : undefined}
             className={btnCls} style={btnStyle}>
            {resolvedText}
          </a>
        </div>
      )
    }
    case 'video': {
      const b = block as VideoBlock
      const embed = getEmbedUrl(b.url)
      if (!embed) return null
      const alignClass = b.alignment === 'center' ? 'mx-auto' : b.alignment === 'right' ? 'ml-auto' : ''
      return (
        <div className={`w-full max-w-2xl ${alignClass}`}>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embed}
              className="absolute inset-0 w-full h-full rounded-xl"
              allowFullScreen
              title="Video"
            />
          </div>
        </div>
      )
    }
    case 'divider': {
      const b = block as DividerBlock
      return <hr style={{ borderColor: b.color, borderTopWidth: b.thickness }} className="border-0 border-t" />
    }
    case 'spacer': {
      const b = block as SpacerBlock
      return <div style={{ height: b.height }} />
    }
    case 'slider':
      return <FeaturedProductsSlider />
    case 'calculator':
      return <PumpCalculator />
    case 'contact_form':
      return <ContactForm />
    case 'search_bar':
      return <SearchBarBlockRenderer block={block as import('./types').SearchBarBlock} />
    case 'tegevusalad':
      return <TegevusaladBlockRenderer block={block as import('./types').TegevusaladBlock} />
    case 'map':
      return <LocationMap />
    default:
      return null
  }
}

// ─── Section renderer ──────────────────────────────────────────────────────

function RenderSection({ section, locale }: { section: Section; locale: string }) {
  const { settings, columns } = section
  const isBoxed = settings.width === 'boxed'
  const isCustom = settings.width === 'custom'

  const bgStyle: React.CSSProperties = {}
  if (settings.background_type === 'color') {
    bgStyle.backgroundColor = settings.background_color
  } else if (settings.background_type === 'gradient') {
    const dir = settings.background_gradient_direction ?? 'to right'
    const c1 = settings.background_gradient_color1 ?? '#003366'
    const c2 = settings.background_gradient_color2 ?? '#01a0dc'
    bgStyle.backgroundImage = `linear-gradient(${dir}, ${c1}, ${c2})`
  } else if (settings.background_image_url) {
    bgStyle.backgroundImage = `url(${optimizeUrl(settings.background_image_url)})`
    bgStyle.backgroundSize = 'cover'
    bgStyle.backgroundPosition = 'center'
  }

  // Border radius
  const tl = settings.border_radius_tl
  const tr = settings.border_radius_tr
  const br = settings.border_radius_br
  const bl = settings.border_radius_bl
  if (tl || tr || br || bl) {
    bgStyle.borderRadius = `${tl ?? 0}px ${tr ?? 0}px ${br ?? 0}px ${bl ?? 0}px`
    bgStyle.overflow = 'hidden'
  }

  const ptClass = PAD_TOP[settings.padding_top] ?? ''
  const pbClass = PAD_BOT[settings.padding_bottom] ?? ''

  // Mobile always px-5 (20px); desktop uses the configured padding_x
  const PAD_X_MD: Record<string, string> = {
    small: 'md:px-4', medium: 'md:px-8', large: 'md:px-16', custom: '',
  }
  const pxClasses = `px-5 ${settings.padding_x !== 'custom' ? (PAD_X_MD[settings.padding_x ?? 'small'] ?? '') : ''}`

  // top/bottom custom padding only (left/right handled via style tag below)
  const paddingStyle: React.CSSProperties = {}
  if (settings.padding_top === 'custom') paddingStyle.paddingTop = `${settings.padding_top_custom ?? 0}px`
  if (settings.padding_bottom === 'custom') paddingStyle.paddingBottom = `${settings.padding_bottom_custom ?? 0}px`

  // Unique class for responsive overrides: grid columns at md+, custom px at md+
  const gridId = `sg${section.id.replace(/-/g, '').slice(0, 10)}`
  const styleRules = [
    `@media(min-width:768px){.${gridId}{grid-template-columns:${columns.map(c => `${c.width}fr`).join(' ')}}}`,
    settings.padding_x === 'custom'
      ? `@media(min-width:768px){.${gridId}{padding-left:${settings.padding_x_custom ?? 0}px;padding-right:${settings.padding_x_custom ?? 0}px}}`
      : '',
  ].filter(Boolean).join('\n')

  const colAlignMap: Record<string, string> = { top: 'start', center: 'center', bottom: 'end' }

  const inner = (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleRules }} />
      <div
        className={`grid grid-cols-1 ${gridId} gap-6 md:gap-8 ${ptClass} ${pbClass} ${pxClasses}`}
        style={paddingStyle}
      >
      {columns.map(col => {
        const ctl = col.border_radius_tl, ctr = col.border_radius_tr
        const cbl = col.border_radius_bl, cbr = col.border_radius_br
        const colStyle: React.CSSProperties = {
          alignItems: 'stretch',
          justifyContent: colAlignMap[col.vertical_align] ?? 'start',
        }
        if (ctl || ctr || cbl || cbr) {
          colStyle.borderRadius = `${ctl ?? 0}px ${ctr ?? 0}px ${cbr ?? 0}px ${cbl ?? 0}px`
          colStyle.overflow = 'hidden'
        }
        return (
        <div
          key={col.id}
          className="flex flex-col gap-4 min-w-0"
          style={colStyle}
        >
          {col.blocks.map(block => (
            <RenderBlock key={block.id} block={block} locale={locale} />
          ))}
        </div>
        )
      })}
    </div>
    </>
  )

  const showOverlay = settings.background_type === 'image' && settings.background_image_url
    && settings.background_overlay > 0
  const overlay = showOverlay ? (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: settings.background_overlay_css || '#000000',
        opacity: settings.background_overlay,
      }}
    />
  ) : null

  // Content width constraint (independent of background)
  const contentStyle: React.CSSProperties = {}
  if (isBoxed) contentStyle.maxWidth = 1200
  else if (isCustom) contentStyle.maxWidth = settings.width_custom ?? 1200

  // Background width constraint (independent of content)
  const isBgCustom = settings.bg_width === 'custom'
  const bgWidthStyle: React.CSSProperties = isBgCustom
    ? { maxWidth: `${settings.bg_width_custom ?? 1200}px`, width: '100%' }
    : {}

  return (
    <div className="w-full flex justify-center">
      <section style={{ ...bgStyle, ...bgWidthStyle }} className={`${isBgCustom ? '' : 'w-full'} relative`}>
        {overlay}
        <div style={contentStyle} className={`${isBoxed || isCustom ? 'mx-auto' : ''} relative z-10`}>
          {inner}
        </div>
      </section>
    </div>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────

export default function BlockRenderer({ sections, locale }: { sections: Section[]; locale: string }) {
  return (
    <>
      {sections.map(section => (
        <RenderSection key={section.id} section={section} locale={locale} />
      ))}
    </>
  )
}
