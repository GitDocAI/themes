import { Editor } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';
import { configLoader } from '../../../../services/configLoader';
import type { EmojiItem } from '@tiptap/extension-emoji';

interface EmojiPickerProps {
  editor: Editor;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ editor, onClose, theme }) => {
  const [search, setSearch] = useState('');
  const [emojis, setEmojis] = useState<EmojiItem[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allEmojis = editor.storage.emoji?.emojis || [];
    setEmojis(allEmojis as EmojiItem[]);
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const filteredEmojis = search === '' ? emojis : emojis.filter(emoji =>
    emoji.name.toLowerCase().includes(search.toLowerCase()) ||
    emoji.shortcodes.some(code => code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleEmojiClick = (emoji: EmojiItem) => {
    editor.chain().focus().insertContent({
      type: 'emoji',
      attrs: { name: emoji.name },
    }).run();
  };

  const text_color = configLoader.getSecondaryTextColor(theme);
  const background_color = configLoader.getBackgroundColor(theme);

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'absolute',
        top: '110%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '320px',
        height: '300px',
        display: 'flex',
        flexDirection: 'column',
        color: text_color,
        backgroundColor: background_color,
        border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
        borderRadius: '8px',
        padding: '8px',
        zIndex: 1001,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <input
        type="text"
        placeholder="Search emoji..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '8px',
          borderRadius: '4px',
          border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          backgroundColor: 'transparent',
          color: text_color,
          marginBottom: '8px',
        }}
        autoFocus
      />
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', gap: '4px', paddingRight: '4px' }}>
        {filteredEmojis.slice(0, 200).map(emoji => ( // limit to 200 for performance
          <button
            key={emoji.name}
            onClick={() => handleEmojiClick(emoji)}
            title={emoji.name}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              fontSize: '24px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {emoji.emoji || emoji.fallbackImage}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
