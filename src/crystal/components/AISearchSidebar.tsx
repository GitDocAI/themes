import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { AISearchConfig } from '../../services/configLoader'
import { configLoader } from '../../services/configLoader'
import { ContentService } from '../../services/contentService'
import aiSearchService, { type ChatMessage } from '../../services/aiSearchService'

interface AISearchSidebarProps {
  config: AISearchConfig
  theme: 'light' | 'dark'
  primaryColor: string
  isOpen: boolean
  onClose: () => void
  isDevMode?: boolean
}

const DEFAULT_TITLE = 'AI Assistant'
const DEFAULT_WELCOME = 'Hello! How can I help you today? Feel free to ask me anything about the documentation.'
const DEFAULT_PLACEHOLDER = 'Ask a question...'
const SIDEBAR_WIDTH_KEY = 'ai_sidebar_width'
const MIN_WIDTH = 350
const MAX_WIDTH = 800
const DEFAULT_WIDTH = 450

export const AISearchSidebar: React.FC<AISearchSidebarProps> = ({
  config,
  theme,
  primaryColor,
  isOpen,
  onClose,
  isDevMode = false
}) => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [iconError, setIconError] = useState(false)
  const [iconLoaded, setIconLoaded] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortFnRef = useRef<(() => void) | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const welcomeTextareaRef = useRef<HTMLTextAreaElement>(null)
  const questionInputRef = useRef<HTMLInputElement>(null)
  const localQuestionsRef = useRef<string[]>([])

  // Editable states for dev mode
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingWelcome, setEditingWelcome] = useState(false)
  const [editingPlaceholder, setEditingPlaceholder] = useState(false)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)
  const [localTitle, setLocalTitle] = useState(config.chatTitle || '')
  const [localWelcome, setLocalWelcome] = useState(config.welcomeMessage || '')
  const [localPlaceholder, setLocalPlaceholder] = useState(config.placeholder || '')
  const [localQuestions, setLocalQuestions] = useState<string[]>(config.suggestedQuestions || [])

  // Keep ref in sync with state for use in event handlers
  localQuestionsRef.current = localQuestions

  // For display: show default if empty. For editing: show actual value (can be empty)
  const title = isDevMode ? (localTitle || DEFAULT_TITLE) : (config.chatTitle || DEFAULT_TITLE)
  const welcomeMessage = isDevMode ? (localWelcome || DEFAULT_WELCOME) : (config.welcomeMessage || DEFAULT_WELCOME)
  const placeholder = isDevMode ? (localPlaceholder || DEFAULT_PLACEHOLDER) : (config.placeholder || DEFAULT_PLACEHOLDER)
  const suggestedQuestions = isDevMode ? localQuestions : (config.suggestedQuestions || [])

  // Detect mobile/tablet screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sync local state with config when it changes
  useEffect(() => {
    setLocalTitle(config.chatTitle || '')
    setLocalWelcome(config.welcomeMessage || '')
    setLocalPlaceholder(config.placeholder || '')
    setLocalQuestions(config.suggestedQuestions || [])
  }, [config])

  // Save function for AI Search settings
  const saveAISearchConfig = async (updates: Partial<AISearchConfig>) => {
    try {
      const currentConfig = await configLoader.loadConfig()
      const updatedConfig = {
        ...currentConfig,
        aiSearch: {
          ...currentConfig.aiSearch,
          ...updates
        }
      }
      await ContentService.saveConfig(updatedConfig)
      setTimeout(async () => {
        await configLoader.reloadConfig()
      }, 300)
    } catch (error) {
      console.error('Error saving AI Search config:', error)
    }
  }

  // Load chat icon
  useEffect(() => {
    const loadIcon = async () => {
      const iconPath = config.chatIcon
      if (!iconPath) {
        setIconError(true)
        return
      }

      try {
        if (iconPath.startsWith('http') || iconPath.startsWith('blob:') || iconPath.startsWith('data:')) {
          setIconUrl(iconPath)
        } else {
          const objectUrl = await ContentService.downloadFile(iconPath)
          if (objectUrl) {
            setIconUrl(objectUrl)
          } else {
            setIconError(true)
          }
        }
      } catch (err) {
        console.error('Failed to load AI chat icon:', err)
        setIconError(true)
      }
    }

    loadIcon()
  }, [config.chatIcon])

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = aiSearchService.loadChatHistory()
    if (savedMessages.length > 0) {
      setMessages(savedMessages)
    } else {
      // Initialize with welcome message
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }
      setMessages([welcomeMsg])
    }
  }, [welcomeMessage])

  // Save chat history when messages change (skip initial load)
  useEffect(() => {
    if (messages.length > 0 && messages[0].id !== 'welcome') {
      aiSearchService.saveChatHistory(messages)
    } else if (messages.length > 1) {
      aiSearchService.saveChatHistory(messages)
    }
  }, [messages])

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Position cursor at end when editing welcome message
  useEffect(() => {
    if (editingWelcome && welcomeTextareaRef.current) {
      const textarea = welcomeTextareaRef.current
      const length = textarea.value.length
      textarea.setSelectionRange(length, length)
    }
  }, [editingWelcome])

  // Position cursor at end when editing suggested question
  useEffect(() => {
    if (editingQuestionIndex !== null && questionInputRef.current) {
      const input = questionInputRef.current
      const length = input.value.length
      input.setSelectionRange(length, length)
    }
  }, [editingQuestionIndex])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortFnRef.current) {
        abortFnRef.current()
      }
    }
  }, [])

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const newWidth = window.innerWidth - e.clientX
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
    setSidebarWidth(clampedWidth)
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false)
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString())
    }
  }, [isResizing, sidebarWidth])

  // Add/remove mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleSuggestedQuestionClick = (question: string) => {
    setInputValue(question)
    inputRef.current?.focus()
  }

  const handleClearHistory = () => {
    aiSearchService.clearChatHistory()
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }
    setMessages([welcomeMsg])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const question = inputValue.trim()
    setInputValue('')

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    }

    // Create placeholder for assistant response
    const assistantMessageId = `assistant-${Date.now()}`
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setIsLoading(true)
    setStreamingMessageId(assistantMessageId)

    // Get context from previous messages (excluding welcome message)
    const contextMessages = messages.filter(m => m.id !== 'welcome')
    const context = aiSearchService.messagesToContext(contextMessages)

    // Stream the response
    const abortFn = await aiSearchService.streamAnswer(
      question,
      context,
      // onChunk
      (chunk) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        )
      },
      // onComplete
      (_fullResponse) => {
        setIsLoading(false)
        setStreamingMessageId(null)
        abortFnRef.current = null
      },
      // onError
      (error) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: `Sorry, I encountered an error: ${error}` }
              : msg
          )
        )
        setIsLoading(false)
        setStreamingMessageId(null)
        abortFnRef.current = null
      }
    )

    abortFnRef.current = abortFn
  }

  const handleStopStreaming = () => {
    if (abortFnRef.current) {
      abortFnRef.current()
      abortFnRef.current = null
      setIsLoading(false)
      setStreamingMessageId(null)
    }
  }

  // Theme colors
  const colors = {
    background: theme === 'dark' ? '#0f172a' : '#ffffff',
    headerBg: theme === 'dark' ? '#1e293b' : '#f8fafc',
    border: theme === 'dark' ? '#334155' : '#e2e8f0',
    text: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    secondaryText: theme === 'dark' ? '#94a3b8' : '#64748b',
    inputBg: theme === 'dark' ? '#1e293b' : '#f1f5f9',
    userMessageBg: primaryColor,
    assistantMessageBg: theme === 'dark' ? '#1e293b' : '#f1f5f9',
    suggestionBg: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
    suggestionBorder: theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
    suggestionHoverBg: theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 9998,
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : (isMobile ? '-100%' : `-${sidebarWidth}px`),
          width: isMobile ? '100%' : `${sidebarWidth}px`,
          height: '100vh',
          backgroundColor: colors.background,
          borderLeft: isMobile ? 'none' : `1px solid ${colors.border}`,
          boxShadow: isOpen ? '-8px 0 30px rgba(0, 0, 0, 0.15)' : 'none',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          transition: isResizing ? 'none' : 'right 0.3s ease',
        }}
      >
        {/* Resize Handle - Hide on mobile */}
        {!isMobile && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '6px',
            height: '100%',
            cursor: 'ew-resize',
            backgroundColor: isResizing ? primaryColor : 'transparent',
            transition: 'background-color 0.2s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = `${primaryColor}40`
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        />
        )}

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: colors.headerBg,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Chat Icon */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}40 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {iconUrl && !iconError ? (
                <img
                  src={iconUrl}
                  alt=""
                  style={{
                    width: iconLoaded ? '24px' : '0',
                    height: iconLoaded ? '24px' : '0',
                    objectFit: 'contain',
                  }}
                  onLoad={() => setIconLoaded(true)}
                  onError={() => setIconError(true)}
                />
              ) : null}
              {(!iconUrl || iconError || !iconLoaded) && (
                <i
                  className="pi pi-sparkles"
                  style={{
                    fontSize: '18px',
                    color: primaryColor,
                  }}
                />
              )}
            </div>

            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {isDevMode && editingTitle ? (
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={() => {
                    setEditingTitle(false)
                    if (localTitle !== config.chatTitle) {
                      saveAISearchConfig({ chatTitle: localTitle })
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingTitle(false)
                      if (localTitle !== config.chatTitle) {
                        saveAISearchConfig({ chatTitle: localTitle })
                      }
                    }
                    if (e.key === 'Escape') {
                      setLocalTitle(config.chatTitle || '')
                      setEditingTitle(false)
                    }
                  }}
                  autoFocus
                  size={Math.max(localTitle.length || DEFAULT_TITLE.length, 10)}
                  style={{
                    display: 'inline-block',
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: colors.text,
                    background: 'transparent',
                    border: `1px dashed ${primaryColor}`,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    outline: 'none',
                    width: 'auto',
                  }}
                />
              ) : (
                <h2
                  onClick={() => isDevMode && setEditingTitle(true)}
                  style={{
                    display: 'block',
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: colors.text,
                    cursor: isDevMode ? 'pointer' : 'default',
                    border: isDevMode ? `1px dashed ${colors.border}` : 'none',
                    borderRadius: '4px',
                    padding: isDevMode ? '2px 6px' : 0,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (isDevMode) {
                      e.currentTarget.style.borderColor = primaryColor
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isDevMode) {
                      e.currentTarget.style.borderColor = colors.border
                    }
                  }}
                >
                  {title}
                </h2>
              )}
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: colors.secondaryText,
                }}
              >
                Powered by AI
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Clear History Button */}
            {messages.length > 1 && (
              <button
                onClick={handleClearHistory}
                title="Clear chat history"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: colors.secondaryText,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.inputBg
                  e.currentTarget.style.color = colors.text
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = colors.secondaryText
                }}
              >
                <i className="pi pi-trash" style={{ fontSize: '0.95rem' }} />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.secondaryText,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.inputBg
                e.currentTarget.style.color = colors.text
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = colors.secondaryText
              }}
            >
              <i className="pi pi-times" style={{ fontSize: '1.1rem' }} />
            </button>
          </div>
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
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Role Label */}
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: colors.secondaryText,
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {message.role === 'user' ? 'You' : 'AI'}
              </span>

              {/* Message Bubble */}
              <div
                onClick={() => {
                  if (isDevMode && message.id === 'welcome' && !editingWelcome) {
                    setEditingWelcome(true)
                  }
                }}
                style={{
                  width: isDevMode && message.id === 'welcome' ? '95%' : 'auto',
                  maxWidth: message.role === 'user' ? '85%' : '95%',
                  padding: message.role === 'user' ? '10px 14px' : '10px 12px',
                  borderRadius: message.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  backgroundColor: message.role === 'user'
                    ? colors.userMessageBg
                    : colors.assistantMessageBg,
                  color: message.role === 'user' ? '#ffffff' : colors.text,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  boxShadow: message.role === 'user'
                    ? `0 2px 8px ${primaryColor}30`
                    : 'none',
                  whiteSpace: message.role === 'user' ? 'pre-wrap' : 'normal',
                  wordBreak: 'break-word',
                  cursor: isDevMode && message.id === 'welcome' ? 'pointer' : 'default',
                  border: isDevMode && message.id === 'welcome' ? `1px dashed ${colors.border}` : 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (isDevMode && message.id === 'welcome') {
                    e.currentTarget.style.borderColor = primaryColor
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDevMode && message.id === 'welcome') {
                    e.currentTarget.style.borderColor = colors.border
                  }
                }}
              >
                {/* Editable welcome message in dev mode */}
                {isDevMode && message.id === 'welcome' && editingWelcome ? (
                  <textarea
                    ref={welcomeTextareaRef}
                    value={localWelcome}
                    onChange={(e) => setLocalWelcome(e.target.value)}
                    onBlur={() => {
                      setEditingWelcome(false)
                      if (localWelcome !== config.welcomeMessage) {
                        saveAISearchConfig({ welcomeMessage: localWelcome })
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setLocalWelcome(config.welcomeMessage || '')
                        setEditingWelcome(false)
                      }
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: 0,
                      margin: 0,
                      fontSize: 'inherit',
                      color: 'inherit',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : message.content ? (
                  message.role === 'assistant' ? (
                    <div className="ai-markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.id === 'welcome' && isDevMode ? welcomeMessage : message.content}
                      </ReactMarkdown>
                      {streamingMessageId === message.id && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '16px',
                            backgroundColor: primaryColor,
                            marginLeft: '2px',
                            animation: 'blink 1s infinite',
                            verticalAlign: 'middle',
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    message.content
                  )
                ) : (
                  streamingMessageId === message.id && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <span style={{ color: colors.secondaryText }}>Thinking</span>
                      <span className="thinking-dots" style={{ display: 'inline-flex', gap: '3px', marginLeft: '2px' }}>
                        <span className="dot dot-1" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: colors.secondaryText }} />
                        <span className="dot dot-2" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: colors.secondaryText }} />
                        <span className="dot dot-3" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: colors.secondaryText }} />
                      </span>
                    </span>
                  )
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {((suggestedQuestions.length > 0 && messages.length <= 1 && !isLoading) || isDevMode) && (
          <div
            style={{
              padding: '0 20px 12px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: colors.secondaryText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Suggested Questions
            </span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {suggestedQuestions.map((question, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    position: 'relative',
                  }}
                >
                  {isDevMode && editingQuestionIndex === index ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      {/* Hidden span to measure text width */}
                      <span
                        style={{
                          visibility: 'hidden',
                          whiteSpace: 'pre',
                          padding: '8px 14px',
                          paddingRight: '32px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          border: '1px solid transparent',
                          display: 'inline-block',
                        }}
                      >
                        {localQuestions[index] || ' '}
                      </span>
                      <input
                        ref={questionInputRef}
                        type="text"
                        value={localQuestions[index]}
                        onChange={(e) => {
                          const newQuestions = [...localQuestions]
                          newQuestions[index] = e.target.value
                          localQuestionsRef.current = newQuestions
                          setLocalQuestions(newQuestions)
                        }}
                        onBlur={() => {
                          setEditingQuestionIndex(null)
                          saveAISearchConfig({ suggestedQuestions: localQuestionsRef.current })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingQuestionIndex(null)
                            saveAISearchConfig({ suggestedQuestions: localQuestionsRef.current })
                          }
                          if (e.key === 'Escape') {
                            setLocalQuestions(config.suggestedQuestions || [])
                            setEditingQuestionIndex(null)
                          }
                        }}
                        autoFocus
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          padding: '8px 14px',
                          paddingRight: '32px',
                          backgroundColor: colors.suggestionBg,
                          border: `1px dashed ${primaryColor}`,
                          borderRadius: '20px',
                          color: primaryColor,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (isDevMode) {
                          setEditingQuestionIndex(index)
                        } else {
                          handleSuggestedQuestionClick(question)
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        paddingRight: isDevMode ? '32px' : '14px',
                        backgroundColor: colors.suggestionBg,
                        borderWidth: '1px',
                        borderStyle: isDevMode ? 'dashed' : 'solid',
                        borderColor: isDevMode ? colors.border : colors.suggestionBorder,
                        borderRadius: '20px',
                        color: primaryColor,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.suggestionHoverBg
                        if (!isDevMode) {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                        if (isDevMode) {
                          e.currentTarget.style.borderColor = primaryColor
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.suggestionBg
                        e.currentTarget.style.transform = 'translateY(0)'
                        if (isDevMode) {
                          e.currentTarget.style.borderColor = colors.border
                        }
                      }}
                    >
                      {question}
                    </button>
                  )}
                  {/* Delete button for dev mode */}
                  {isDevMode && editingQuestionIndex !== index && (
                    <button
                      onClick={() => {
                        const newQuestions = localQuestions.filter((_, i) => i !== index)
                        setLocalQuestions(newQuestions)
                        saveAISearchConfig({ suggestedQuestions: newQuestions })
                      }}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        padding: 0,
                      }}
                      title="Delete question"
                    >
                      <i className="pi pi-times" style={{ fontSize: '8px' }} />
                    </button>
                  )}
                </div>
              ))}
              {/* Add new question button */}
              {isDevMode && (
                <button
                  onClick={() => {
                    const newQuestions = [...localQuestions, 'New question?']
                    setLocalQuestions(newQuestions)
                    saveAISearchConfig({ suggestedQuestions: newQuestions })
                    setTimeout(() => {
                      setEditingQuestionIndex(newQuestions.length - 1)
                    }, 100)
                  }}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                    border: `1px dashed ${primaryColor}`,
                    borderRadius: '20px',
                    color: primaryColor,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <i className="pi pi-plus" style={{ fontSize: '10px' }} />
                  Add
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!isDevMode) {
              handleSubmit(e)
            }
          }}
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${colors.border}`,
            backgroundColor: colors.headerBg,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: colors.inputBg,
              borderRadius: '12px',
              padding: '4px 4px 4px 16px',
              borderWidth: '1px',
              borderStyle: isDevMode ? 'dashed' : 'solid',
              borderColor: isDevMode && editingPlaceholder ? primaryColor : colors.border,
              transition: 'border-color 0.2s ease',
            }}
            onClick={() => {
              if (isDevMode && !editingPlaceholder) {
                setEditingPlaceholder(true)
              }
            }}
          >
            {isDevMode && editingPlaceholder ? (
              <input
                type="text"
                value={localPlaceholder}
                onChange={(e) => setLocalPlaceholder(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => {
                  setEditingPlaceholder(false)
                  if (localPlaceholder !== config.placeholder) {
                    saveAISearchConfig({ placeholder: localPlaceholder })
                  }
                }}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    setEditingPlaceholder(false)
                    if (localPlaceholder !== config.placeholder) {
                      saveAISearchConfig({ placeholder: localPlaceholder })
                    }
                  }
                  if (e.key === 'Escape') {
                    setLocalPlaceholder(config.placeholder || '')
                    setEditingPlaceholder(false)
                  }
                }}
                autoFocus
                placeholder="Enter placeholder text..."
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: colors.text,
                  fontSize: '0.95rem',
                  outline: 'none',
                  padding: '10px 0',
                }}
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={isDevMode ? '' : inputValue}
                onChange={(e) => !isDevMode && setInputValue(e.target.value)}
                onClick={() => {
                  if (isDevMode && !editingPlaceholder) {
                    setEditingPlaceholder(true)
                  }
                }}
                placeholder={placeholder}
                disabled={isLoading}
                readOnly={isDevMode}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: colors.text,
                  fontSize: '0.95rem',
                  outline: 'none',
                  padding: '10px 0',
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isDevMode ? 'pointer' : 'text',
                }}
              />
            )}
            {isLoading && !isDevMode ? (
              <button
                type="button"
                onClick={handleStopStreaming}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                title="Stop generating"
              >
                <i className="pi pi-stop" style={{ fontSize: '1rem' }} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isDevMode || !inputValue.trim()}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isDevMode
                    ? colors.border
                    : inputValue.trim()
                      ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
                      : colors.border,
                  color: isDevMode ? colors.secondaryText : (inputValue.trim() ? '#ffffff' : colors.secondaryText),
                  cursor: isDevMode ? 'not-allowed' : (inputValue.trim() ? 'pointer' : 'not-allowed'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  opacity: isDevMode ? 0.5 : 1,
                }}
                title={isDevMode ? 'Disabled in edit mode' : 'Send message'}
              >
                <i className="pi pi-send" style={{ fontSize: '1rem' }} />
              </button>
            )}
          </div>
        </form>

        {/* Animations and Markdown Styles */}
        <style>{`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
          }
          .thinking-dots .dot-1 {
            animation: bounce 1.4s ease-in-out infinite;
          }
          .thinking-dots .dot-2 {
            animation: bounce 1.4s ease-in-out 0.2s infinite;
          }
          .thinking-dots .dot-3 {
            animation: bounce 1.4s ease-in-out 0.4s infinite;
          }
          .ai-markdown-content > *:first-child {
            margin-top: 0;
          }
          .ai-markdown-content > *:last-child {
            margin-bottom: 0;
          }
          .ai-markdown-content p {
            margin: 0.4em 0;
          }
          .ai-markdown-content p:empty {
            display: none;
          }
          .ai-markdown-content ul, .ai-markdown-content ol {
            margin: 0.3em 0;
            padding-left: 1em;
          }
          .ai-markdown-content li {
            margin: 0.1em 0;
          }
          .ai-markdown-content li > p {
            margin: 0;
          }
          .ai-markdown-content > ul, .ai-markdown-content > ol {
            padding-left: 1.1em;
          }
          .ai-markdown-content code {
            background: ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
            padding: 0.1em 0.35em;
            border-radius: 4px;
            font-size: 0.85em;
            font-family: 'Fira Code', 'Monaco', monospace;
          }
          .ai-markdown-content pre {
            background: ${theme === 'dark' ? '#1a1a2e' : '#f4f4f5'};
            padding: 0.6em 0.8em;
            border-radius: 6px;
            overflow-x: auto;
            margin: 0.4em 0;
          }
          .ai-markdown-content pre code {
            background: none;
            padding: 0;
          }
          .ai-markdown-content a {
            color: ${primaryColor};
            text-decoration: none;
          }
          .ai-markdown-content a:hover {
            text-decoration: underline;
          }
          .ai-markdown-content h1, .ai-markdown-content h2, .ai-markdown-content h3 {
            margin: 0.75em 0 0.5em 0;
            font-weight: 600;
          }
          .ai-markdown-content h1 { font-size: 1.3em; }
          .ai-markdown-content h2 { font-size: 1.15em; }
          .ai-markdown-content h3 { font-size: 1.05em; }
          .ai-markdown-content blockquote {
            border-left: 3px solid ${primaryColor};
            margin: 0.5em 0;
            padding-left: 1em;
            opacity: 0.85;
          }
          .ai-markdown-content table {
            border-collapse: collapse;
            margin: 0.5em 0;
            width: 100%;
          }
          .ai-markdown-content th, .ai-markdown-content td {
            border: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
            padding: 0.4em 0.6em;
            text-align: left;
          }
          .ai-markdown-content th {
            background: ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
          }
        `}</style>
      </div>
    </>
  )
}

export default AISearchSidebar
