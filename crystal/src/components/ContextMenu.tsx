import React, { useState, useEffect, useRef } from 'react';

export interface ContextMenuProps{
  theme:string
  menuPosition:{x:number,y:number}
  onOptionSelect:(option:string)=>void
  closeFunc:()=>void
}

// Context Menu
const ContextMenu = ({ menuPosition, onOptionSelect,theme,closeFunc }:ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: menuPosition.y,
        left: menuPosition.x,
        backgroundColor: theme=='light'?'#fff':'#000',
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000
      }}
      onClick={handleClickOutside}
    >
      <ul style={{ listStyleType: 'none', margin: 0, padding: '5px' }}>
        <li className="menu-items" style={{cursor:'pointer'}} onClick={() => onOptionSelect('copy')}>Copy</li>
        <li className="menu-items" style={{cursor:'pointer'}} onClick={() => onOptionSelect('askAI')}>Ask AI</li>
        <li className="menu-items" style={{cursor:'pointer'}} onClick={() => onOptionSelect('modifyAI')}>Add to context</li>
      </ul>
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

  const handleContextMenu = (e:any) => {
    e.preventDefault();
    const selection = window!.getSelection()!.toString();
    if (selection) {
      setSelectedText(selection);
      setMenuPosition({ x: e.pageX, y: e.pageY });
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
    setMenuPosition(null); // Cerrar el menú después de seleccionar una opción
  };

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div>
      {menuPosition && (
        <ContextMenu menuPosition={menuPosition} onOptionSelect={handleOptionSelect} theme={theme} closeFunc={()=>setMenuPosition(null)} />
      )}
      {children}
    </div>
  );
};

export default TextSelectionContextMenu;
