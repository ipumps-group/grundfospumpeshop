import { notFound } from 'next/navigation'
import ContactForm from '@/components/ContactForm'
import BlockRenderer from '@/components/page-builder/BlockRenderer'
import ShortcodeRenderer from '@/components/ShortcodeRenderer'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Section } from '@/components/page-builder/types'
import Link from 'next/link'

interface Column { title: string; text: string }

export default async function EelvaadePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: page } = await supabaseAdmin
    .from('pages')
    .select(`id, title, short_description, content, image_url,
      template, blocks, slug, status`)
    .eq('id', id)
    .single()

  if (!page) notFound()

  const title = page.title ?? ''
  const shortDesc = page.short_description ?? null
  const content = page.content ?? null
  const hasBlocks = Array.isArray(page.blocks) && page.blocks.length > 0
  const isContact = page.template === 'contact'

  let columns: Column[] = []
  if (!hasBlocks && isContact && content) {
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) columns = parsed
    } catch {}
  }

  return (
    <div>
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 flex items-center gap-4 text-[13px] text-yellow-800">
        <span className="font-semibold">Eelvaade</span>
        <span className="text-yellow-600">({page.status ?? 'mustand'})</span>
        <Link href={`/haldus/lehed/${id}`} className="ml-auto text-[#003366] hover:underline">← Tagasi muutmisele</Link>
      </div>

      {hasBlocks ? (
        <div className="min-h-screen">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-10 pb-2">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {shortDesc && (
              <p className="text-[17px] text-gray-600 mt-3 leading-relaxed">{shortDesc}</p>
            )}
          </div>
          <BlockRenderer sections={page.blocks as Section[]} />
        </div>
      ) : (
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 py-12">
            {page.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.image_url} alt={title} className="w-full h-64 object-cover rounded-2xl mb-8 shadow-sm" />
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
            {shortDesc && (
              <p className="text-[17px] text-gray-600 mb-10 leading-relaxed">{shortDesc}</p>
            )}
            {isContact ? (
              <>
                {columns.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    {columns.map((col, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        {col.title && <h3 className="font-semibold text-[#003366] text-[15px] mb-2">{col.title}</h3>}
                        {col.text && <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">{col.text}</p>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                  <ContactForm pageId={page.id} />
                </div>
              </>
            ) : (
              content && (
                <ShortcodeRenderer
                  html={content}
                  pageId={page.id}
                  className="text-[15px] text-gray-700 leading-relaxed
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-3
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-2
                    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                    [&_p]:leading-relaxed [&_p]:mb-3
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:mb-3
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_ol]:mb-3
                    [&_a]:text-[#003366] [&_a]:underline [&_a:hover]:text-[#01a0dc]
                    [&_strong]:font-semibold [&_strong]:text-gray-900
                    [&_hr]:border-gray-200 [&_hr]:my-6"
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
