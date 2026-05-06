'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<'live' | 'html'>('live')
  const editorRef = useRef<HTMLDivElement>(null)

  // Initialise contenteditable on mount
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus()
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(cmd, false, val ?? undefined)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function addLink() {
    const url = prompt('Lisa link (URL):')
    if (url) exec('createLink', url)
  }

  function insertHeading(tag: string) {
    editorRef.current?.focus()
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand('formatBlock', false, tag)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand('insertText', false, text)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function switchToLive() {
    if (editorRef.current) editorRef.current.innerHTML = value
    setMode('live')
  }

  const toolBtn = 'px-2 py-1 rounded text-[13px] text-gray-600 hover:bg-gray-200 transition-colors select-none'
  const modeBtn = (active: boolean) =>
    `px-2.5 py-0.5 rounded text-[12px] font-medium transition-colors ${
      active ? 'bg-white border border-gray-200 text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
    }`

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex-wrap">
        <button type="button" onClick={() => exec('bold')} className={toolBtn} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => exec('italic')} className={toolBtn} title="Italic">
          <em>I</em>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        {(['h1','h2','h3','h4','h5','h6'] as const).map(tag => (
          <button key={tag} type="button" onClick={() => insertHeading(tag)}
            className={`${toolBtn} text-[11px] font-semibold uppercase`} title={tag.toUpperCase()}>
            {tag.toUpperCase()}
          </button>
        ))}
        <button type="button" onClick={() => insertHeading('p')} className={`${toolBtn} text-[11px]`} title="Tavaline tekst">
          P
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={addLink} className={`${toolBtn} text-[11px]`} title="Link">
          Link
        </button>
        <button type="button" onClick={() => exec('unlink')} className={`${toolBtn} text-[11px]`} title="Eemalda link">
          –Link
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className={`${toolBtn} text-[12px]`} title="Bullet loend">
          • Loend
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={`${toolBtn} text-[12px]`} title="Nummerdatud loend">
          1. Loend
        </button>

        {/* Mode toggle */}
        <div className="ml-auto flex items-center bg-gray-200 rounded p-0.5 gap-0.5">
          <button type="button" onClick={switchToLive} className={modeBtn(mode === 'live')}>Live</button>
          <button type="button" onClick={() => setMode('html')} className={modeBtn(mode === 'html')}>HTML</button>
        </div>
      </div>

      {/* Live editor – stays in DOM to preserve undo history */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML) }}
        onPaste={handlePaste}
        className={`p-3 min-h-[120px] focus:outline-none text-[14px] leading-relaxed
          [&_b]:font-bold [&_strong]:font-bold
          [&_i]:italic [&_em]:italic
          [&_a]:text-[#003366] [&_a]:underline
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_li]:my-0.5
          [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-2
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-2
          [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:my-1
          [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:my-1
          [&_h5]:text-base [&_h5]:font-semibold [&_h5]:my-1
          [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:my-1
          ${mode === 'html' ? 'hidden' : ''}`}
      />

      {/* HTML editor */}
      {mode === 'html' && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full p-3 min-h-[120px] font-mono text-[12px] focus:outline-none resize-y bg-[#1e2d3d] text-[#7dd3fc]"
          spellCheck={false}
        />
      )}
    </div>
  )
}
