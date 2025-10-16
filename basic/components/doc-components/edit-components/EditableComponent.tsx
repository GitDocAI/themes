'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'primeicons/primeicons.css'

export const EditableComponent = ({
  children,
  original_content,
  webhook_url,
  authentication
}: {
  children: any
  original_content?: string
  webhook_url: string
  authentication: string
}) => {
  const pathname = usePathname()
  const [filePath] = useState(() => pathname + '.mdx')

  // Editing states
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(original_content ?? '')
  const [draft, setDraft] = useState('') // texto en edición
  const [optimisticContent, setOptimisticContent] = useState<string | null>(null) // para optimistic UI
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // para detectar click fuera
  const wrapperRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const previousContentRef = useRef<string>(original_content ?? '')

  // actualizar estado si original_content cambia externamente
  useEffect(() => {
    setContent(original_content ?? '')
    previousContentRef.current = original_content ?? ''
  }, [original_content])

  // cerrar edición al click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) {
        if (isEditing) {
          // Comportamiento: cancelar edición (restauramos draft no aplicado)
          cancelEditing()
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing])

  // llamada al webhook (idéntica intención, pero retorna JSON y lanza en caso de error)
  const callWebhook = async (old_segment: string, new_text: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (authentication) {
        headers['Authorization'] = `Bearer ${authentication}`
      }

      const response = await fetch(webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file_path: filePath,
          old_segment,
          new_text,
        }),
      })

      const data = await response.json().catch(() => {
        throw new Error('Respuesta inválida del servidor')
      })

      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Error al actualizar el archivo')
      }

      return data
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar (optimistic)
  const saveEdit = async (newText: string) => {
    // Guardado optimista:
    const old = previousContentRef.current
    // mostrar nuevo contenido inmediatamente
    setOptimisticContent(newText)
    setContent(newText)
    setIsEditing(false)
    setError(null)

    try {
      await callWebhook(old, newText)
      // si éxito, confirmamos y actualizamos previousContentRef
      previousContentRef.current = newText
      setOptimisticContent(null)
    } catch (err) {
      // revertir al anterior en caso de error
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      setContent(old)
      setOptimisticContent(null)
      // opcional: dejar el draft con el texto intentado para que el usuario lo pueda intentar otra vez
      setDraft(newText)
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setDraft('') // limpiar draft (o podrías mantenerlo si quieres)
    setError(null)
  }

  // inicia edición (al hacer click en el bloque)
  const startEditing = () => {
    setDraft(content ?? '')
    setIsEditing(true)
    // focus será aplicado en useEffect/callback cuando textarea monte
    setTimeout(() => {
      textareaRef.current?.focus()
      // poner caret al final
      const el = textareaRef.current
      if (el) {
        el.selectionStart = el.selectionEnd = el.value.length
      }
    }, 0)
  }

  // Atajos: Ctrl/Cmd + Enter para guardar, Esc para cancelar
  const handleKeyDownOnTextarea = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey
    if (isCmdOrCtrl && e.key === 'Enter') {
      e.preventDefault()
      // trim o no según preferencia
      saveEdit(draft)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }

  // Small autosize for textarea (simple)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 4 + 'px'
  }, [draft, isEditing])

  // Render content: si hay optimisticContent (mientras carga) lo priorizamos
  const renderedMarkdown = optimisticContent ?? content ?? ''

  return (
    <div
      ref={wrapperRef}
      className={`relative group transition-all duration-200 ${
        isEditing ? 'p-3 my-3 border rounded-lg bg-background/10' : ''
      }`}
      // doble-click también abre edición por si prefieres doble clic estilo confluence
      onDoubleClick={() => {
        if (!isEditing) startEditing()
      }}
    >
      {/* Mensaje de error */}
      {error && (
        <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Indicador de carga superpuesto */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20 rounded-lg pointer-events-none">
          <div className="flex items-center gap-2">
            <i className="pi pi-spin pi-spinner text-blue-600" />
            <span className="text-sm">Guardando...</span>
          </div>
        </div>
      )}

      {/* Si estamos editando: mostramos un textarea inline sin botones */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDownOnTextarea}
          className="w-full border rounded-md p-2 font-mono text-sm resize-none overflow-hidden"
          rows={4}
          aria-label="Editar Markdown (Ctrl/Cmd+Enter para guardar, Esc para cancelar)"
        />
      ) : (
        // si no estamos editando: renderizamos Markdown con react-markdown
        <div
          onClick={() => {
            // clic simple para editar (sin botones)
            startEditing()
          }}
          className="prose max-w-none cursor-text"
          title="Haz clic para editar (Ctrl/Cmd+Enter para guardar, Esc para cancelar)"
        >
          {/* Si children fue pasado y no hay original_content, podemos mostrar children;
              pero preferimos priorizar content/original_content cuando exista */}
          { (original_content ?? content) !== undefined ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{renderedMarkdown}</ReactMarkdown>
          ) : (
            // si no hay original_content, mostramos los children tal cual
            children
          )}
        </div>
      )}
    </div>
  )
}

