import React, { useState, useEffect, useRef } from 'react';

export interface ContextMenuProps{
  theme:string
  menuPosition:{x:number,y:number}
  onOptionSelect:(option:string)=>void
  closeFunc:()=>void
}

// Context Menu - Floating toolbar style
const ContextMenu = ({ menuPosition, onOptionSelect,theme,closeFunc }:ContextMenuProps) => {


  const ref = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const handleClickOutside = (event:any)=>{
        if (ref.current && !ref.current.contains(event.target)) {
          closeFunc()
        }
    }

  useEffect(()=>{
    document.addEventListener("mousedown",handleClickOutside)
    return ()=>{
      document.removeEventListener("mousedown",handleClickOutside)
    }
  },[])

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: isDark ? '#e5e7eb' : '#374151',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(59, 130, 246, 0.1)';
    e.currentTarget.style.color = isDark ? '#818cf8' : '#3b82f6';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = isDark ? '#e5e7eb' : '#374151';
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: menuPosition.y,
        left: menuPosition.x,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        borderRadius: '10px',
        boxShadow: isDark
          ? '0 10px 25px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.3)'
          : '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.08)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        gap: '2px',
        animation: 'fadeInScale 0.15s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      <button
        style={buttonStyle}
        onClick={() => onOptionSelect('copy')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Copy to clipboard"
      >
        <i className="pi pi-copy" style={{ fontSize: '14px' }}></i>
        Copy
      </button>

      <div style={{
        width: '1px',
        height: '20px',
        backgroundColor: isDark ? '#374151' : '#e5e7eb'
      }} />

      <button
        style={{
          ...buttonStyle,
          background: isDark
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
          color: isDark ? '#a5b4fc' : '#6366f1',
        }}
        onClick={() => onOptionSelect('modifyAI')}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)';
        }}
        title="Edit with AI"
      >
        <i className="pi pi-sparkles" style={{ fontSize: '14px' }}></i>
        Edit with AI
      </button>
    </div>
  );
};

export interface TextSelectionMenuProps{
  theme:string;
  children:React.ReactNode;
  onAiChat:(selected:string)=>void;
  onAiUpgrade:(selected:string)=>void;
}

const TextSelectionContextMenu = ({theme,children,onAiChat,onAiUpgrade}:TextSelectionMenuProps) => {
  const [menuPosition, setMenuPosition] = useState<{x:number,y:number}|null>(null);
  const [selectedText, setSelectedText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const viteMode = import.meta.env.VITE_MODE || 'production'
  const isProductionMode = viteMode === 'production'

  if(isProductionMode){
    return (
      <div>
        {children}
      </div>
    )
  }



  // Check if the selection is within the page content area
  const isSelectionInContentArea = (selection: Selection | null): boolean => {
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const contentArea = document.getElementById('page-content-area');

    if (!contentArea) return false;

    // Check if the selection's common ancestor is within the content area
    return contentArea.contains(range.commonAncestorContainer);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    // Only show menu if selection is within the page content area
    if (text && text.length > 0 && isSelectionInContentArea(selection)) {
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();

        // Position the menu to the right of the selection, slightly above
        const x = rect.right + window.scrollX + 8;
        const y = rect.top + window.scrollY - 8;

        // Make sure menu doesn't go off-screen to the right
        const menuWidth = 320; // Approximate menu width
        const adjustedX = x + menuWidth > window.innerWidth
          ? rect.left + window.scrollX - menuWidth - 8
          : x;

        setSelectedText(text);
        setMenuPosition({ x: adjustedX, y });
      }
    } else {
      setMenuPosition(null);
    }
  };

  const handleOptionSelect = (option:string) => {
    if (option === 'copy') {
      navigator.clipboard.writeText(selectedText);
    } else if (option === 'askAI') {
      onAiChat(selectedText)
    } else if (option === 'modifyAI') {
      onAiUpgrade(selectedText)
    }
    setMenuPosition(null);
    // Clear the selection after action
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        handleTextSelection();
      }, 10);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle keyboard selection (Shift + Arrow keys)
      if (e.shiftKey) {
        setTimeout(() => {
          handleTextSelection();
        }, 10);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      // Only show menu if selection is within the page content area
      if (text && text.length > 0 && isSelectionInContentArea(selection)) {
        e.preventDefault();

        // Position menu at cursor position
        const x = e.pageX;
        const y = e.pageY;

        // Make sure menu doesn't go off-screen
        const menuWidth = 320;
        const adjustedX = x + menuWidth > window.innerWidth
          ? x - menuWidth
          : x;

        setSelectedText(text);
        setMenuPosition({ x: adjustedX, y });
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div ref={containerRef}>
      {menuPosition && (
        <ContextMenu
          menuPosition={menuPosition}
          onOptionSelect={handleOptionSelect}
          theme={theme}
          closeFunc={() => setMenuPosition(null)}
        />
      )}
      {children}
    </div>
  );
};

export default TextSelectionContextMenu;
