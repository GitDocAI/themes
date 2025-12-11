import Link from '@tiptap/extension-link'

export const LinkWithEdit = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: 'custom-link-editable',
      },
    }
  },

  addProseMirrorPlugins() {
    const plugins = this.parent?.() || []

    // Plugin to add hover edit button in editable mode
    const { editor } = this

    if (editor && editor.isEditable) {
      // Add click handler via CSS and event delegation
      setTimeout(() => {
        const editorElement = editor.view.dom

        const handleLinkClick = (event: Event) => {
          const target = event.target as HTMLElement
          const link = target.closest('a.custom-link')

          if (link && editor.isEditable) {
            event.preventDefault()
            event.stopPropagation()

            // Dispatch custom event to open link modal
            const customEvent = new CustomEvent('openLinkModal')
            window.dispatchEvent(customEvent)
          }
        }

        editorElement.addEventListener('click', handleLinkClick, { capture: true })
      }, 100)
    }

    return plugins
  },
})
