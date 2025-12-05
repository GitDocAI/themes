import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ChatContext {
  type: 'text' | 'file';
  content: string;
  fileName?: string;
}

interface ChatSidebarProps {
  theme?: 'light' | 'dark';
  context?: ChatContext | null;
  onContextClear?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  theme = 'light',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
            text: (() => {
              const hour = new Date().getHours()
              if (hour < 12 && hour> 6) return '¡Good Morning! How can i help?'
              if (hour < 18 && hour > 12) return '¡Good Afternoon! What will be now?'
              return '¡Good Night! May i be usefull?'
            })(),
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simular respuesta del bot
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Gracias por tu mensaje. ¿Hay algo más en lo que pueda ayudarte?',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          background: theme === 'light' ? '#1f293799' : '#ffffff99' ,
          color: theme === 'light' ? '#ffffff' : '#1f2937',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          transition: 'all 0.3s ease',
          fontSize: '24px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
        }}
        title="Chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-450px',
          width: '450px',
          height: '100vh',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderLeft: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          boxShadow: isOpen ? '-4px 0 12px rgba(0,0,0,0.1)' : 'none',
          transition: 'right 0.3s ease',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme === 'light' ? '#f9fafb' : '#111827'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: theme === 'light' ? '#3b82f6' : '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
              }}
            >
              🤖
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: theme === 'light' ? '#111827' : '#f9fafb'
              }}>
                Chat with ai
              </h2>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af'
              }}>
                online
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme === 'light' ? '#6b7280' : '#9ca3af',
              fontSize: '24px',
              padding: '4px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme === 'light' ? '#111827' : '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme === 'light' ? '#6b7280' : '#9ca3af'
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937'
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '4px'
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: message.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: message.sender === 'user'
                    ? (theme === 'light' ? '#3b82f6' : '#6366f1')
                    : (theme === 'light' ? '#f3f4f6' : '#374151'),
                  color: message.sender === 'user'
                    ? '#ffffff'
                    : (theme === 'light' ? '#111827' : '#f9fafb'),
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordWrap: 'break-word'
                }}
              >
                {message.text}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: theme === 'light' ? '#9ca3af' : '#6b7280',
                  paddingLeft: message.sender === 'user' ? '0' : '8px',
                  paddingRight: message.sender === 'user' ? '8px' : '0'
                }}
              >
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                maxWidth: '100px'
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme === 'light' ? '#9ca3af' : '#6b7280',
                  animation: 'bounce 1.4s infinite ease-in-out'
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme === 'light' ? '#9ca3af' : '#6b7280',
                  animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme === 'light' ? '#9ca3af' : '#6b7280',
                  animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                }}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Container */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            backgroundColor: theme === 'light' ? '#f9fafb' : '#111827'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder=""
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                borderRadius: '24px',
                color: theme === 'light' ? '#374151' : '#e5e7eb',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? '#3b82f6' : '#6366f1'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#4b5563'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: inputValue.trim()
                  ? (theme === 'light' ? '#3b82f6' : '#6366f1')
                  : (theme === 'light' ? '#e5e7eb' : '#4b5563'),
                color: inputValue.trim() ? '#ffffff' : (theme === 'light' ? '#9ca3af' : '#6b7280'),
                border: 'none',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (inputValue.trim()) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </>
  )
}

