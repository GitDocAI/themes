import React from 'react'
import { AlertBlock } from '../../components/doc-components/AlertBlock'
import { BlockQuote } from '../../components/doc-components/BlockQuote'
import { CodeBlock } from '../../components/doc-components/CodeBlock'
import { CheckItem, CheckList } from '../../components/doc-components/CheckList'
import { BasicCustomTable } from '@/components/doc-components/CustomTable'
import { BasicCustomChart } from '@/components/doc-components/CustomChart'
import { BasicTabView, BasicTabPanel } from '@/components/doc-components/TabView'
import { BasicStepper, BasicStepperPanel } from '@/components/doc-components/Stepper'
import { BasicScrollPanel } from '@/components/doc-components/ScrollPanel'
import { BasicPrimeCard } from '@/components/doc-components/Card'
import { BasicAccordion, BasicAccordionTab } from '@/components/doc-components/Accordion'
import { BasicTimeline } from '@/components/doc-components/Timeline'
import { CodeGroup, File } from '@/components/doc-components/CodeGroup'
import { CodeTabs, Tab } from '@/components/doc-components/CodeTabs'
import { Columns } from '@/components/doc-components/Columns'
import { Frame } from '@/components/doc-components/Frame'
import { BasicCarousel } from '@/components/doc-components/Carousel'

// ResizableImage removed - images are now handled by JSX descriptor in editor
import { Collapse } from '../../components/doc-components/Collapse'
import ApiReference from '../../components/doc-components/ApiReference'

export const components = {
  // --- Headings ---
  h1: ({ children }: any) => <h1 className="text-4xl font-bold mb-6 mt-10">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-3xl font-semibold mb-5 mt-10">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-2xl font-medium mb-4 mt-8">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-xl font-medium mb-3 mt-6">{children}</h4>,
  h5: ({ children }: any) => <h5 className="text-lg font-semibold mb-2 mt-5">{children}</h5>,
  h6: ({ children }: any) => <h6 className="text-base font-semibold mb-1 mt-4 text-secondary">{children}</h6>,

  // --- Text blocks ---
  p: ({ children }: any) => <p className="mb-4 leading-7 text-base text-secondary">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-primary">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-secondary">{children}</em>,
  del: ({ children }: any) => <del className="text-secondary/60 line-through">{children}</del>,
  hr: () => <hr className="my-8 border-t border-secondary/20" />,

  // --- Inline code ---
  code: ({ inline, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="bg-secondary/10 text-sm px-1.5 py-0.5 rounded font-mono text-primary/90">
          {children}
        </code>
      )
    }
    return <CodeBlock {...props}>{children}</CodeBlock>
  },

  // --- Code block wrapper ---
  pre: ({ children }: any) => (
    <pre className="bg-secondary/20 text-sm p-4 rounded-lg overflow-x-auto mb-4 border border-neutral-200 dark:border-neutral-700">
      {children}
    </pre>
  ),

  // --- Lists ---
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
  li: ({ children }: any) => {
    const childrenArray = React.Children.toArray(children).filter((ch: any) => ch.props?.type === 'checkbox')
    if (childrenArray.length > 0) {
      const inner = React.Children.toArray(children).filter((ch: any) => ch.props?.type !== 'checkbox')
      return (
        <CheckItem variant={(childrenArray[0] as any)?.props?.checked ? 'do' : 'dont'}>
          {inner}
        </CheckItem>
      )
    }
    return <li className="mb-1">{children}</li>
  },
  CheckList,
  CheckItem,

  // --- Links & media ---
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 transition"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, width, ...props }: any) => {
    return (
      <figure className="my-6">
        <img
          src={src as string}
          alt={alt}
          className="rounded-lg max-w-full border border-neutral-200 dark:border-neutral-700"
          style={{ width: width ? `${width}px` : 'auto', maxWidth: '100%', display: 'block' }}
          {...props}
        />
        {alt && (
          <figcaption className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
            {alt}
          </figcaption>
        )}
      </figure>
    )
  },

  // --- Blockquote ---
  blockquote: ({ children }: any) => <BlockQuote>{children}</BlockQuote>,

  // --- Tables ---
  table:({children}:any)=><BasicCustomTable> {children} </BasicCustomTable>,

  DataTable:({children,...props}:any)=><BasicCustomTable {...props}> {children} </BasicCustomTable>,

  // --- Charts ---
  Chart:({children,...props}:any)=>{
    // Wrap table children in BasicCustomChart
    return <BasicCustomChart {...props}>{children}</BasicCustomChart>
  },

  // --- Tabs ---
  TabView: BasicTabView,
  TabPanel: BasicTabPanel,

  // --- Stepper ---
  Stepper: BasicStepper,
  StepperPanel: BasicStepperPanel,

  // --- ScrollPanel ---
  ScrollPanel: BasicScrollPanel,

  // --- Card ---
  Card: BasicPrimeCard,

  // --- Accordion ---
  Accordion: BasicAccordion,
  AccordionTab: BasicAccordionTab,

  // --- Timeline ---
  Timeline: BasicTimeline,

  // --- CodeGroup ---
  CodeGroup: CodeGroup,
  File: File,

  // --- CodeTabs ---
  CodeTabs: CodeTabs,
  Tab: Tab,

  // --- Columns ---
  Columns: Columns,

  // --- Frame ---
  Frame: Frame,

  // --- Carousel ---
  Carousel: BasicCarousel,

  // --- Misc / MDX custom blocks ---
  Tip: ({ children }: any) => <AlertBlock type="tip">{children}</AlertBlock>,
  Note: ({ children }: any) => <AlertBlock type="note">{children}</AlertBlock>,
  Warning: ({ children }: any) => <AlertBlock type="warning">{children}</AlertBlock>,
  Danger: ({ children }: any) => <AlertBlock type="danger">{children}</AlertBlock>,
  Info: ({ children }: any) => <AlertBlock type="info">{children}</AlertBlock>,
  Collapse: ({ children, title, defaultOpen }: any) => <Collapse title={title} defaultOpen={defaultOpen}>{children}</Collapse>,

  // --- Special Markdown features ---
  inlineCode: ({ children }: any) => (
    <code className="bg-secondary/10 text-sm px-1 rounded font-mono text-primary/90">{children}</code>
  ),
  br: () => <br />,

  // --- MDX Components ---
  ApiReference,
}
