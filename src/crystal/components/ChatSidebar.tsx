import { useState, useRef, useEffect, useCallback } from 'react'
import { aiStreamService,type ChatContext, type AIStreamResponse } from '../../services/agentService'
import Markdown from 'react-markdown';
import { ConfirmationModal } from './ConfirmationModal'
import { EditPreviewModal } from './EditPreviewModal'
import { CreateGrouperModal } from './CreateGrouperModal'
import { CreatePageModal } from './CreatePageModal'
import { CreateVersionModal } from './CreateVersionModal'
import { CreateTabModal } from './CreateTabModal'
import { toolExecutor } from '../../services/toolExecutorService'

interface PendingEdit {
  originalText: string
  newText: string
  fileName: string
}

const SIDEBAR_WIDTH_KEY = 'chat_sidebar_width'
const MIN_WIDTH = 350
const MAX_WIDTH = 700
const DEFAULT_WIDTH = 450

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}


interface ChatSidebarProps {
  theme?: 'light' | 'dark'
  externalContexts?: ChatContext[]
  onUpdateContext:(ctx:ChatContext[])=>void
  onOpenChange?: (isOpen: boolean) => void
  onContentChange?: () => void
  onOpenSettings?: () => void
  buttonVisible?: boolean
  currentVersion?: string
  currentTab?: string
  currentGroup?: string
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  theme = 'light',
  externalContexts = [],
  onUpdateContext,
  onOpenChange,
  onContentChange,
  onOpenSettings,
  buttonVisible = true,
  currentVersion = '',
  currentTab = '',
  currentGroup = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [chatResume,setChatResume] = useState<string>("")
  const [todoList,setTodoList] = useState<string>("")
  const [toolResults, setToolResults] = useState<{ [key: string]: any }>({});
  const [approvalRequest, setApprovalRequest] = useState<any>(null)
  const [isProcessingNotSupported, setIsProcessingNotSupported] = useState(false)
  const [alwaysApprove, _setAlwaysApprove] = useState<boolean>(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false)
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null)
  const [showEditPreview, setShowEditPreview] = useState<boolean>(false)
  const [showCreateGrouperModal, setShowCreateGrouperModal] = useState<boolean>(false)
  const [pendingGrouper, setPendingGrouper] = useState<{
    group_name: string
    parent_version: string
    parent_tab: string
  } | null>(null)
  const [showCreatePageModal, setShowCreatePageModal] = useState<boolean>(false)
  const [pendingPage, setPendingPage] = useState<{
    page_name: string
    parent_version: string
    parent_tab: string
    parent_group: string
  } | null>(null)
  const [showCreateVersionModal, setShowCreateVersionModal] = useState<boolean>(false)
  const [pendingVersion, setPendingVersion] = useState<string | null>(null)
  const [showCreateTabModal, setShowCreateTabModal] = useState<boolean>(false)
  const [pendingTab, setPendingTab] = useState<{
    tab_name: string
    parent_version: string
  } | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey! 👋 I'm your AI editing assistant. I can help you create, modify, and organize your documentation in real-time. Just tell me what you'd like to change!",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [contexts, setContexts] = useState<ChatContext[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)

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
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])


  useEffect(()=>{
    if (!isOpen && externalContexts.length>0) {
      setIsOpen(true)
    }
  },[externalContexts])

  // Sincronizar contextos externos
  useEffect(() => {
    if (externalContexts.length > 0) {
      setContexts(externalContexts)
    }
  }, [externalContexts])

  const handleStreamData = (data: AIStreamResponse, botMessageId: string) => {
    if (data.message_type === "chat_resume") {
        setChatResume(data.answer_chunk as string);
        return;
    } else if (data.message_type === "tool_call") {
        handleToolCall(data.answer_chunk);
        return;
    }

    setIsTyping(false);
    setMessages((prev) => prev.map(msg =>
        msg.id === botMessageId
            ? { ...msg, text: msg.text + (data.answer_chunk as string) }
            : msg
    ));
  };

  const sendToolResultToAI = async (toolName: string, _toolResult: any,id:string, allToolResults: any, currentTodoList: string) => {
    const botMessageId = (Date.now() + 1).toString();

    setMessages(prev => [
      ...prev,
      {
        id: botMessageId,
        text: "",
        sender: "bot",
        timestamp: new Date()
      }
    ]);

    const result = {...allToolResults}
    result[toolName]={id,response:_toolResult}

    setIsTyping(true);
    aiStreamService.editWithAI(
      "",
      contexts.filter(c => c.type !== "intention"),
      `${chatResume}`,
      currentTodoList,
      result,
      { version: currentVersion, tab: currentTab, group: currentGroup },
      (data) => handleStreamData(data, botMessageId),
      () => {
        setIsTyping(false);
        const updatedToolResults = { ...allToolResults };
        delete updatedToolResults[toolName];
        setToolResults(updatedToolResults);
      }
    );
  };


const handleSendMessage = async () => {
  if (!inputValue.trim()) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    text: inputValue,
    sender: 'user',
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);

  const botMessageId = (Date.now() + 1).toString();

  setMessages(prev => [
    ...prev,
    {
      id: botMessageId,
      text: "",
      sender: "bot",
      timestamp: new Date()
    }
  ]);

  const result = new Map<string,string>()
  Object.keys(toolResults).forEach((key)=>{
    result.set(key,JSON.stringify(toolResults[key]))
  })

  const question = inputValue;
  setInputValue("");
  setIsTyping(true);

  const locationContext = { version: currentVersion, tab: currentTab, group: currentGroup };

  aiStreamService.editWithAI(
    question,
    contexts.filter(c=>c.type!=="intention"),
    chatResume,
    todoList,
    result,
    locationContext,
    (data) => handleStreamData(data, botMessageId),
    () => {
      setIsTyping(false);
    }
  );
};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }


  const handleClearHistory = () => {
    setMessages([
      {
        id: '1',
        text: "Hey! 👋 I'm your AI editing assistant. I can help you create, modify, and organize your documentation in real-time. Just tell me what you'd like to change!",
        sender: 'bot',
        timestamp: new Date()
      }
    ])
    setChatResume("")
    setTodoList("")
    setToolResults({})
    setContexts([])
    onUpdateContext([])
  }

  const handleApplyEdit = async () => {
    if (!pendingEdit || !approvalRequest) return

    try {
      // Execute replace_in_file directly without sending result back to AI
      const result = await toolExecutor.execute('replace_in_file', approvalRequest.arguments)

      if (result?.results?.success === 'true') {
        // Clear the text context after applying
        const updatedContexts = contexts.filter(c => c.type !== "text")
        setContexts(updatedContexts)
        onUpdateContext(updatedContexts)

        // Trigger content refresh
        onContentChange?.()

        // Add success message
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "✅ Edit applied successfully!",
            sender: 'bot',
            timestamp: new Date()
          }
        ])
      } else {
        throw new Error(result?.results?.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Failed to apply edit:', error)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `❌ Failed to apply the edit: ${error.message || 'Please try again.'}`,
          sender: 'bot',
          timestamp: new Date()
        }
      ])
    }

    setPendingEdit(null)
    setApprovalRequest(null)
    setShowEditPreview(false)
  }

  const handleDiscardEdit = () => {
    setPendingEdit(null)
    setApprovalRequest(null)
    setShowEditPreview(false)
  }

  const handleCreateGrouper = async (data: { group_name: string; group_type: string; parent_version: string; parent_tab: string }) => {
    try {
      const result = await toolExecutor.execute('create_grouper', data)

      if (result?.results?.success === 'true') {
        // Trigger content refresh
        onContentChange?.()

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `✅ Group "${data.group_name}" created successfully!`,
            sender: 'bot',
            timestamp: new Date()
          }
        ])
      } else {
        throw new Error(result?.results?.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Failed to create group:', error)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `❌ Failed to create group: ${error.message || 'Please try again.'}`,
          sender: 'bot',
          timestamp: new Date()
        }
      ])
    }

    setPendingGrouper(null)
    setApprovalRequest(null)
    setShowCreateGrouperModal(false)
  }

  const handleCancelCreateGrouper = () => {
    setPendingGrouper(null)
    setApprovalRequest(null)
    setShowCreateGrouperModal(false)
  }

  const handleCreatePage = async (data: { page_name: string; parent_version: string; parent_tab: string; parent_group: string }) => {
    try {
      const result = await toolExecutor.execute('create_page', data)

      if (result?.results?.success === 'true') {
        // Trigger content refresh
        onContentChange?.()

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `Page "${data.page_name}" created successfully!`,
            sender: 'bot',
            timestamp: new Date()
          }
        ])
      } else {
        throw new Error(result?.results?.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Failed to create page:', error)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `Failed to create page: ${error.message || 'Please try again.'}`,
          sender: 'bot',
          timestamp: new Date()
        }
      ])
    }

    setPendingPage(null)
    setApprovalRequest(null)
    setShowCreatePageModal(false)
  }

  const handleCancelCreatePage = () => {
    setPendingPage(null)
    setApprovalRequest(null)
    setShowCreatePageModal(false)
  }

  const handleCreateVersion = async (data: { version: string }) => {
    try {
      const result = await toolExecutor.execute('create_version', data)

      if (result?.results?.success === 'true') {
        onContentChange?.()

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `Version "${data.version}" created successfully!`,
            sender: 'bot',
            timestamp: new Date()
          }
        ])
      } else {
        throw new Error(result?.results?.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Failed to create version:', error)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `Failed to create version: ${error.message || 'Please try again.'}`,
          sender: 'bot',
          timestamp: new Date()
        }
      ])
    }

    setPendingVersion(null)
    setApprovalRequest(null)
    setShowCreateVersionModal(false)
  }

  const handleCancelCreateVersion = () => {
    setPendingVersion(null)
    setApprovalRequest(null)
    setShowCreateVersionModal(false)
  }

  const handleCreateTab = async (data: { tab_name: string; parent_version: string }) => {
    try {
      const result = await toolExecutor.execute('create_tab', data)

      if (result?.results?.success === 'true') {
        onContentChange?.()

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `Tab "${data.tab_name}" created successfully!`,
            sender: 'bot',
            timestamp: new Date()
          }
        ])
      } else {
        throw new Error(result?.results?.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Failed to create tab:', error)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `Failed to create tab: ${error.message || 'Please try again.'}`,
          sender: 'bot',
          timestamp: new Date()
        }
      ])
    }

    setPendingTab(null)
    setApprovalRequest(null)
    setShowCreateTabModal(false)
  }

  const handleCancelCreateTab = () => {
    setPendingTab(null)
    setApprovalRequest(null)
    setShowCreateTabModal(false)
  }

  const handleToolCall = async (toolCallData: any) => {
    try {
      // Ignore additional tool calls if there's already one pending or if a not-supported operation was processed
      if (approvalRequest || isProcessingNotSupported) {
        return;
      }

      const toolCall = toolCallData.tool_call;
      if (!toolCall) {
        console.error("Invalid tool call format:", toolCallData);
        return;
      }

      // Parse arguments if they are a string
      if (toolCall.arguments && typeof toolCall.arguments === 'string') {
        try {
          toolCall.arguments = JSON.parse(toolCall.arguments);
        } catch (error) {
          console.error("Failed to parse tool call arguments:", error);
          return; // Stop execution if arguments are invalid JSON
        }
      }

      const { name, arguments: args } = toolCall;

      // For replace_in_file, show the EditPreviewModal
      if (name === 'replace_in_file' && !alwaysApprove) {
        setPendingEdit({
          originalText: args.to_replace_text,
          newText: args.new_text,
          fileName: args.page
        });
        setApprovalRequest(toolCall);
        setShowEditPreview(true);
        return;
      }

      // For create_grouper, show the CreateGrouperModal
      if (name === 'create_grouper' && !alwaysApprove) {
        setPendingGrouper({
          group_name: args.group_name,
          parent_version: args.parent_version || currentVersion,
          parent_tab: args.parent_tab || currentTab
        });
        setApprovalRequest(toolCall);
        setShowCreateGrouperModal(true);
        return;
      }

      // For create_page, show the CreatePageModal
      if (name === 'create_page' && !alwaysApprove) {
        setPendingPage({
          page_name: args.page_name,
          parent_version: args.parent_version || currentVersion,
          parent_tab: args.parent_tab || currentTab,
          parent_group: args.parent_group || ''
        });
        setApprovalRequest(toolCall);
        setShowCreatePageModal(true);
        return;
      }

      // For create_version, show the CreateVersionModal
      if (name === 'create_version' && !alwaysApprove) {
        setPendingVersion(args.version);
        setApprovalRequest(toolCall);
        setShowCreateVersionModal(true);
        return;
      }

      // For create_tab, show the CreateTabModal
      if (name === 'create_tab' && !alwaysApprove) {
        setPendingTab({
          tab_name: args.tab_name,
          parent_version: args.parent_version || currentVersion
        });
        setApprovalRequest(toolCall);
        setShowCreateTabModal(true);
        return;
      }

      // Execute tool directly - not_supported tools will handle their own response
      await executeTool(toolCall);
    } catch (error) {
      console.error("Error processing tool call:", error);
    }
  }

  const executeTool = async (toolCall: any) => {
    const { name, arguments: parameters,id } = toolCall;
    console.log(`Agent generated query: ${name}`, parameters);

    const pendingToolResults = { ...toolResults, [name]: null };
    setToolResults(pendingToolResults);

    const uiCallbacks = {
      currentTodoList: todoList,
      onUpdateContext: (newContext: ChatContext) => {
        onUpdateContext([...contexts, newContext]);
      }
    };

    const result = await toolExecutor.execute(name, parameters, uiCallbacks);
    console.log(`Tool response: ${JSON.stringify(result)}`);

    if (result && result.results) {
        // Handle not_supported responses - show message to user and block further tool calls
        if (result.results.not_supported) {
          setIsProcessingNotSupported(true);

          // Process message - remove the [[OPEN_SETTINGS]] marker (will be rendered as button)
          let messageText = result.results.message || 'This feature is not available yet.';
          const hasSettingsAction = messageText.includes('[[OPEN_SETTINGS]]');
          messageText = messageText.replace('[[OPEN_SETTINGS]]', '');

          // Add a system message to inform the user
          const notSupportedMessage: Message = {
            id: `not-supported-${Date.now()}`,
            text: messageText.trim(),
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, notSupportedMessage]);

          // If has settings action, add a special action message
          if (hasSettingsAction) {
            const actionMessage: Message = {
              id: `action-settings-${Date.now()}`,
              text: '[[ACTION:OPEN_SETTINGS]]',
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, actionMessage]);
          }

          // Reset the flag after a short delay to allow new conversations
          setTimeout(() => setIsProcessingNotSupported(false), 1000);
          return;
        }

        const newToolResults = { ...pendingToolResults, [name]: result.results };

        let finalTodoList = todoList;
        if (result.results.newTodoList) {
            finalTodoList = result.results.newTodoList;
            setTodoList(finalTodoList);
        }

        setToolResults(newToolResults);
        sendToolResultToAI(name, result.results,id, newToolResults, finalTodoList);
    }
  }

  const handleConfirmation = async (confirm: boolean) => {
    if (confirm && approvalRequest) {
      await executeTool(approvalRequest);
    }
    setApprovalRequest(null);
    setShowConfirmationModal(false);
  }

  const handleRemoveContext = (id: string) => {
    const filteredContexts = contexts.filter(ctx => ctx.id !== id)
    setContexts(filteredContexts)
    onUpdateContext(filteredContexts)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const visibleContexts = contexts.filter(ctx => ctx.type === 'file' || ctx.type === 'text')

  return (
    <>
      {/* Floating Chat Button */}
      {buttonVisible && (
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: isOpen
            ? (theme === 'light' ? '#3b82f6' : '#6366f1')
            : (theme === 'light'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)'),
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme === 'light'
            ? '0 4px 12px rgba(59, 130, 246, 0.4)'
            : '0 4px 12px rgba(99, 102, 241, 0.4)',
          zIndex: 9999,
          transition: 'all 0.2s ease',
          fontSize: '18px',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = theme === 'light'
            ? '0 8px 20px rgba(59, 130, 246, 0.5)'
            : '0 8px 20px rgba(99, 102, 241, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = theme === 'light'
            ? '0 4px 12px rgba(59, 130, 246, 0.4)'
            : '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}
        title="AI Editor - Edit documentation in real-time"
      >
        {isOpen ? (
          <i className="pi pi-times" style={{ fontSize: '16px' }}></i>
        ) : (
          <i
            className="pi pi-comments"
            style={{
              fontSize: '18px',
              animation: 'pulse-icon 2s ease-in-out infinite'
            }}
          ></i>
        )}
        <style>{`
          @keyframes pulse-icon {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.85; }
          }
        `}</style>
      </button>
      )}

      {/* Overlay/Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 9997,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Chat Sidebar */}
      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : `-${sidebarWidth}px`,
          width: `${sidebarWidth}px`,
          height: '100vh',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderLeft: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          boxShadow: isOpen ? '-4px 0 12px rgba(0,0,0,0.1)' : 'none',
          transition: isResizing ? 'none' : 'right 0.3s ease',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            left: '-4px',
            top: 0,
            width: '12px',
            height: '100%',
            cursor: 'ew-resize',
            backgroundColor: 'transparent',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            const indicator = e.currentTarget.querySelector('.resize-indicator') as HTMLElement
            if (indicator && !isResizing) {
              indicator.style.backgroundColor = theme === 'light' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(99, 102, 241, 0.6)'
            }
          }}
          onMouseLeave={(e) => {
            const indicator = e.currentTarget.querySelector('.resize-indicator') as HTMLElement
            if (indicator && !isResizing) {
              indicator.style.backgroundColor = 'transparent'
            }
          }}
        >
          <div
            className="resize-indicator"
            style={{
              width: '4px',
              height: '100%',
              backgroundColor: isResizing ? (theme === 'light' ? '#3b82f6' : '#6366f1') : 'transparent',
              transition: 'background-color 0.2s ease',
              borderRadius: '2px',
            }}
          />
        </div>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: theme === 'light'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '30%',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
            {/* AI Avatar with pulse */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <i className="pi pi-sparkles" style={{ fontSize: '22px', color: '#ffffff' }}></i>
              </div>
              {/* Online indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  border: '2px solid white',
                  animation: 'pulse-green 2s infinite'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#ffffff',
                  letterSpacing: '-0.3px'
                }}>
                  AI Editor
                </h2>
                <span style={{
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: '600',
                  backgroundColor: 'rgba(251, 191, 36, 0.9)',
                  color: '#78350f',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Beta
                </span>
              </div>
              <p style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  display: 'inline-block'
                }}></span>
                Edit docs in real-time
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <button
              onClick={handleClearHistory}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '14px',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title="Clear chat history"
            >
              <i className="pi pi-trash"></i>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '16px',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title="Close"
            >
              <i className="pi pi-times"></i>
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
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937'
          }}
        >
          {messages.filter(message=>message.sender!="bot"||message.text!="").map((message) => {
            // Special handling for action buttons
            if (message.text === '[[ACTION:OPEN_SETTINGS]]') {
              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px'
                  }}
                >
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onOpenSettings) {
                        onOpenSettings();
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      backgroundColor: theme === 'light' ? '#3b82f6' : '#6366f1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      boxShadow: theme === 'light'
                        ? '0 2px 8px rgba(59, 130, 246, 0.3)'
                        : '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = theme === 'light'
                        ? '0 4px 12px rgba(59, 130, 246, 0.4)'
                        : '0 4px 12px rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = theme === 'light'
                        ? '0 2px 8px rgba(59, 130, 246, 0.3)'
                        : '0 2px 8px rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    <i className="pi pi-cog" style={{ fontSize: '16px' }}></i>
                    Open Settings
                  </button>
                </div>
              );
            }

            return (
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
                className="chat-message-content"
                style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius:
                    message.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor:
                    message.sender === 'user'
                      ? theme === 'light'
                        ? '#3b82f6'
                        : '#6366f1'
                      : theme === 'light'
                      ? '#f3f4f6'
                      : '#374151',
                  color:
                    message.sender === 'user'
                      ? '#ffffff'
                      : theme === 'light'
                      ? '#111827'
                      : '#f9fafb',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordWrap: 'break-word'
                }}
              >
                <Markdown>
                    {message.text}
                </Markdown>
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
          );
          })}

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

        {/* Todo List Section */}
        {todoList && (
          <div
            style={{
              padding: '12px 24px',
              borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
              backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: theme === 'light' ? '#111827' : '#f9fafb', marginTop: 0, marginBottom: '8px' }}>
                Todo List
              </h3>
              <Markdown>{todoList}</Markdown>
            </div>
          </div>
        )}

        {/* Context Section */}
        {visibleContexts.length > 0 && (
          <div
            style={{
              padding: '12px 24px',
              borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
              backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
              maxHeight: '150px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {visibleContexts.map((context) => (
                <div
                  key={context.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: theme === 'light' ? '#e0f2fe' : '#1e3a8a',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: theme === 'light' ? '#0369a1' : '#93c5fd'
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {context.type === 'file' ? (
                      <>📎 {context.fileName || 'File'}</>
                    ) : (
                      <>📝 {context.content?.substring(0, 30)}...</>
                    )}
                  </span>
                  <button
                    onClick={() => handleRemoveContext(context.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme === 'light' ? '#0369a1' : '#93c5fd',
                      fontSize: '16px',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  // Auto-resize textarea
                  const textarea = e.target
                  textarea.style.height = 'auto'
                  const maxHeight = 264 // ~12 lines (22px per line)
                  if (textarea.scrollHeight <= maxHeight) {
                    textarea.style.height = `${textarea.scrollHeight}px`
                    textarea.style.overflowY = 'hidden'
                  } else {
                    textarea.style.height = `${maxHeight}px`
                    textarea.style.overflowY = 'auto'
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to edit your docs..."
                style={{
                  padding: '12px 16px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                  borderRadius: '16px',
                  color: theme === 'light' ? '#374151' : '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'none',
                  height: '44px',
                  lineHeight: '22px',
                  overflowY: 'hidden'
                }}
                rows={1}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme === 'light' ? '#3b82f6' : '#6366f1'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#4b5563'
                }}
              ></textarea>
              {/* <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '16px', paddingTop: '8px' }}> */}
              {/*   <input */}
              {/*     type="checkbox" */}
              {/*     id="alwaysApprove" */}
              {/*     checked={alwaysApprove} */}
              {/*     onChange={(e) => setAlwaysApprove(e.target.checked)} */}
              {/*     style={{ marginRight: '8px' }} */}
              {/*   /> */}
              {/*   <label htmlFor="alwaysApprove" style={{ color: theme === 'light' ? '#374151' : '#e5e7eb', fontSize: '12px' }}> */}
              {/*     Always approve */}
              {/*   </label> */}
              {/* </div> */}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: inputValue.trim()
                  ? theme === 'light'
                    ? '#3b82f6'
                    : '#6366f1'
                  : theme === 'light'
                  ? '#e5e7eb'
                  : '#4b5563',
                color: inputValue.trim()
                  ? '#ffffff'
                  : theme === 'light'
                  ? '#9ca3af'
                  : '#6b7280',
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

      {/* Animations and Chat Styles */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }
        @keyframes pulse-green {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
        }
        .chat-message-content h1,
        .chat-message-content h2,
        .chat-message-content h3,
        .chat-message-content h4,
        .chat-message-content h5,
        .chat-message-content h6 {
          font-size: 14px !important;
          font-weight: 600 !important;
          margin: 8px 0 !important;
        }
        .chat-message-content p {
          margin: 4px 0 !important;
        }
        .chat-message-content pre {
          font-size: 12px !important;
          padding: 8px !important;
          border-radius: 6px !important;
          overflow-x: auto !important;
          background: rgba(0,0,0,0.1) !important;
        }
        .chat-message-content code {
          font-size: 12px !important;
        }
        .chat-message-content hr {
          margin: 8px 0 !important;
          border: none !important;
          border-top: 1px solid rgba(128,128,128,0.3) !important;
        }
      `}</style>

      {showConfirmationModal && approvalRequest && (
        <ConfirmationModal
          theme={theme}
          onClose={() => handleConfirmation(false)}
          onConfirm={() => handleConfirmation(true)}
          title={`Confirm ${approvalRequest.name}`}
          actionName={`Confirm`}
        >
          <p>Are you sure you want to execute the following action?</p>
          <pre>{JSON.stringify(approvalRequest.arguments, null, 2)}</pre>
        </ConfirmationModal>
      )}

      {showEditPreview && pendingEdit && (
        <EditPreviewModal
          theme={theme}
          originalText={pendingEdit.originalText}
          newText={pendingEdit.newText}
          fileName={pendingEdit.fileName}
          onClose={handleDiscardEdit}
          onApply={handleApplyEdit}
        />
      )}

      {showCreateGrouperModal && pendingGrouper && (
        <CreateGrouperModal
          theme={theme}
          groupName={pendingGrouper.group_name}
          initialVersion={pendingGrouper.parent_version}
          initialTab={pendingGrouper.parent_tab}
          onClose={handleCancelCreateGrouper}
          onConfirm={handleCreateGrouper}
        />
      )}

      {showCreatePageModal && pendingPage && (
        <CreatePageModal
          theme={theme}
          pageName={pendingPage.page_name}
          initialVersion={pendingPage.parent_version}
          initialTab={pendingPage.parent_tab}
          initialGroup={pendingPage.parent_group}
          onClose={handleCancelCreatePage}
          onConfirm={handleCreatePage}
        />
      )}

      {showCreateVersionModal && pendingVersion && (
        <CreateVersionModal
          theme={theme}
          versionName={pendingVersion}
          onClose={handleCancelCreateVersion}
          onConfirm={handleCreateVersion}
        />
      )}

      {showCreateTabModal && pendingTab && (
        <CreateTabModal
          theme={theme}
          tabName={pendingTab.tab_name}
          initialVersion={pendingTab.parent_version}
          onClose={handleCancelCreateTab}
          onConfirm={handleCreateTab}
        />
      )}
    </>

  )
}

