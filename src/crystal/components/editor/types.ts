import '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cardBlock: {
      setCardBlock: (attributes?: {
        title?: string
        icon?: string
        href?: string
      }) => ReturnType
    }
    accordionBlock: {
      setAccordionBlock: (attributes?: {
        multiple?: boolean
        tabs?: Array<{ header: string; content: string; disabled: boolean }>
      }) => ReturnType
    }
    codeGroupBlock: {
      setCodeGroupBlock: (attributes?: {
        tabs?: Array<{ label: string; language: string; code: string }>
      }) => ReturnType
    }
    codeGroup: {
      setCodeGroup: () => ReturnType
    }
    columnGroup: {
      setColumnGroup: (columnCount?: number) => ReturnType
    }
    rightPanel: {
      setRightPanel: () => ReturnType
    }
    infoBlock: {
      setInfoBlock: () => ReturnType
    }
    warningBlock: {
      setWarningBlock: () => ReturnType
    }
    errorBlock: {
      setErrorBlock: () => ReturnType
    }
    successBlock: {
      setSuccessBlock: () => ReturnType
    }
    endpointBlock: {
      setEndpointBlock: (attributes?: {
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
        path?: string
      }) => ReturnType
    }
    labelBlock: {
      setLabelBlock: (attributes?: {
        label?: string
        color?: string
        size?: 'sm' | 'md' | 'lg'
      }) => ReturnType
    }
    paramBlock: {
      setParamBlock: (attributes?: {
        path?: string
        type?: string
        required?: boolean
        description?: string
      }) => ReturnType
    }
    stepsBlock: {
      setStepsBlock: (stepCount?: number) => ReturnType
    }
    tabsBlock: {
      setTabsBlock: (attributes?: {
        alignment?: 'left' | 'center' | 'right'
      }) => ReturnType
    }
    tableBlock: {
      setTableBlock: () => ReturnType
    }
    imageBlock: {
      setImageBlock: (attributes?: {
        src?: string
        alt?: string
        caption?: string
        type?: 'url' | 'local'
      }) => ReturnType
    }
  }
}
