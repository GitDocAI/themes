'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { Components } from './TiptapComponents'
// Esta dependencia es para convertir el Markdown a HTML que TipTap entiende
// y viceversa. ¡Es crucial!
import { marked } from 'marked'
// Y para convertir HTML a Markdown al guardar
import TurndownService from 'turndown'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

interface Props {
  content: string
  onChange: (markdown: string) => void
  onBlur: () => void
}

const TiptapEditor = ({ content, onChange, onBlur }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
            paragraph: false,
            heading: false,
            blockquote: false,
            bulletList: false,
            listItem: false,
            bold: false,
            italic: false,
            strike: false,
            code: false,
      }),
      ...Components()
    ],
    immediatelyRender: false,
    content: marked.parse(content),
    onUpdate: ({ editor }) => {
      const markdown = turndownService.turndown(editor.getHTML())
      onChange(markdown)
    },

    onBlur: () => {
      onBlur()
    }
  })

  useEffect(() => {
    if (editor && editor.isEditable) {
        const isSame = turndownService.turndown(editor.getHTML()) === content;
        if (isSame) {
            return;
        }
        editor.commands.setContent(marked.parse(content));
    }
  }, [content, editor]);



  return (
    <div className="prose max-w-none border-none">
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor
