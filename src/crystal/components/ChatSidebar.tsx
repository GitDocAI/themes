import { useState, useRef, useEffect } from 'react'
import { SearchModal } from './SearchModal'
import { FindPagePathByName } from '../../services/navigationService'
import { aiStreamService,type ChatContext } from '../../services/agentService'
import Markdown from 'react-markdown';
import { ConfirmationModal } from './ConfirmationModal'
import { toolExecutor } from '../../services/toolExecutorService'
const viteMode = import.meta.env.VITE_MODE || "production";

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
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  theme = 'light',
  externalContexts = [],
  onUpdateContext
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showSearchModal,setShowSearchModal] = useState<boolean>(false)
  const [chatResume,setChatResume] = useState<string>("")
  const [todoList,setTodoList] = useState<string>("")
  const [toolResults, setToolResults] = useState<{ [key: string]: any }>({});
  const [approvalRequest, setApprovalRequest] = useState<any>(null)
  const [alwaysApprove, _setAlwaysApprove] = useState<boolean>(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: (() => {
        const hour = new Date().getHours()
        if (hour < 12 && hour > 6) return '¡Good Morning! How can i help?'
        if (hour < 18 && hour > 12) return '¡Good Afternoon! What will be now?'
        return '¡Good Night! May i be usefull?'
      })(),
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [contexts, setContexts] = useState<ChatContext[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }


  const handleSearchResult=(page:string,headingId?:string,tab?:string,version?:string)=>{
    const pagePath =FindPagePathByName(page,tab,version)
    if(pagePath){
      const context:ChatContext ={
          id: `${pagePath}-${Date.now()}`,
          type:  'file' ,
          fileName: pagePath,
          headingId:headingId
      }
      onUpdateContext([...contexts,context])
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])


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

  // Clear previous todo list and tool responses for a fresh interaction
  setTodoList("");
    const result = new Map<string,string>()
    Object.keys(toolResults).forEach((key)=>{
      result.set(key,JSON.stringify(toolResults[key]))
    })
  setToolResults({});


  const question = inputValue;
  setInputValue("");
  setIsTyping(true);

  if(viteMode!="production"){
      aiStreamService.editWithAI(
        question,
        contexts.filter(c=>c.type!=="intention"),
        chatResume,
        todoList,
        result,
        (data) => {

          if(data.message_type=="chat_resume"){
            setChatResume(data.answer_chunk)
            return
          } else if (data.message_type=="tool_call") {
            handleToolCall(data.answer_chunk);
            return;
          }

          setMessages((prev)=>{
            setIsTyping(false);
            return prev.map(msg =>
              msg.id === botMessageId
                ? { ...msg, text: msg.text + data.answer_chunk }
                : msg
            )
            }
          );

        },

        () => {
          setIsTyping(false);
        }
      );

  }else{
  aiStreamService.askToAI(
    question,
    contexts.filter(c=>c.type!=="intention"),
    chatResume,
    (data) => {
      setMessages((prev)=>{
        setIsTyping(false);
        return prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, text: msg.text + data.answer_chunk }
            : msg
        )
        }
      );

    },

    () => {
      setIsTyping(false);
    }
  );
    }

};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAddContext = () => {
      setShowSearchModal(true)
  }


  const handleToolCall = async (toolCallString: string) => {
    try {
      const toolCall = JSON.parse(toolCallString);
      const { name } = toolCall.function;

      const toolsRequiringConfirmation = ['create_version', 'create_tab', 'create_grouper', 'create_page', 'remove_item', 'replace_in_file'];

      if (toolsRequiringConfirmation.includes(name) && !alwaysApprove) {
        setApprovalRequest(toolCall);
        setShowConfirmationModal(true);
      } else {
        await executeTool(toolCall);
      }
    } catch (error) {
      console.error("Error parsing tool call string:", error);
    }
  }

  const executeTool = async (toolCall: any) => {
    const { name, parameters } = toolCall.function;
    console.log(`Agent generated query: ${name}`, parameters);

    if (name === "create_todo") {
      const { title, description, task_number } = parameters;
      setTodoList(prev => {
        const newTodoItem = `${task_number}. ${title}: ${description || 'No description.'}\n`;
        return prev ? prev + newTodoItem : newTodoItem;
      });
      return;
    }

    if (name === "update_status") {
      const { id, status, note } = parameters;
      setTodoList(prev => {
        if (!prev) return "";
        const lines = prev.split('\n');
        const updatedLines = lines.map(line => {
          if (line.startsWith(`${id}.`)) {
            return `${id}. ${line.substring(String(id).length + 2).split(':')[0]}: Status: ${status}${note ? ` (${note})` : ''}`;
          }
          return line;
        });
        return updatedLines.join('\n');
      });
      return;
    }

    if(name === 'open_page' || name === 'see_page'){
        const pagePath = FindPagePathByName(parameters.url)
        if(pagePath){
            const context:ChatContext ={
                id: `${pagePath}-${Date.now()}`,
                type:  'file' ,
                fileName: pagePath,
            }
            onUpdateContext([...contexts,context])
        }
        return;
    }

    const result = await toolExecutor.execute(name, parameters);
    console.log(`Tool response: ${JSON.stringify(result)}`);
    if (result && result.results) {
        setToolResults(prevResults => ({
          ...prevResults,
          [name]: result.results
        }));
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
    setContexts(prev => prev.filter(ctx => {
      return ctx.id !== id
    }))
    onUpdateContext(contexts)
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          background: theme === 'light' ? '#1f293799' : '#ffffff99',
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
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme === 'light' ? '#111827' : '#f9fafb'
                }}
              >
                Chat with ai
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: theme === 'light' ? '#6b7280' : '#9ca3af'
                }}
              >
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
          {messages.filter(message=>message.sender!="bot"||message.text!="").map((message) => (
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
            <button
              onClick={handleAddContext}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: theme === 'light' ? '#e5e7eb' : '#4b5563',
                color: theme === 'light' ? '#374151' : '#e5e7eb',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#d1d5db' : '#6b7280'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#e5e7eb' : '#4b5563'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title="Agregar contexto"
            >
              +
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <textarea
                ref={inputRef}
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
                max-rows={3}
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

      <SearchModal
        visible={showSearchModal}
        onHide={() => setShowSearchModal(false)}
        onNavigate={handleSearchResult}
        theme={theme}
      />

      {showConfirmationModal && approvalRequest && (
        <ConfirmationModal
          theme={theme}
          onClose={() => handleConfirmation(false)}
          onConfirm={() => handleConfirmation(true)}
          title={`Confirm ${approvalRequest.function.name}`}
          actionName={`Confirm`}
        >
          <p>Are you sure you want to execute the following action?</p>
          <pre>{JSON.stringify(approvalRequest.function.parameters, null, 2)}</pre>
        </ConfirmationModal>
      )}
    </>

  )
}

