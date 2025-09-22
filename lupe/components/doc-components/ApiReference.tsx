import { CodeBlock } from "./CodeBlock";
import {Security} from "./api-ref-components/Security"
import {Parameters} from "./api-ref-components/Parameters"
import {RequestBody} from "./api-ref-components/RequestBody"
import {Response} from "./api-ref-components/Response"
import {ResponseTabs} from "./api-ref-components/ResponseTabs"
import {ApiReference as ApiReferenceProps} from '../../models/ApiReference.models'
import {TryItButton} from './api-ref-components/TryItButton'



export default function ApiReference({
  title,
  summary,
  description,
  method,
  path,
  deprecated,
  tags,
  externalDocs,
  parameters = [],
  requestBody,
  responses = {},
  tryItBaseUrl,
  security,
  securitySchemas,
}: ApiReferenceProps) {

  const methodColors: Record<string, string> = {
    GET: "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 dark:from-emerald-900/40 dark:to-emerald-800/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50",
    POST: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 dark:from-blue-900/40 dark:to-blue-800/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50",
    PUT: "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 dark:from-amber-900/40 dark:to-amber-800/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50",
    PATCH: "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 dark:from-purple-900/40 dark:to-purple-800/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50",
    DELETE: "bg-gradient-to-r from-rose-100 to-rose-50 text-rose-800 dark:from-rose-900/40 dark:to-rose-800/30 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50",
  };

  return (
    <div className="
        grid
        grid-cols-1
        grid-rows-[auto_auto]
        [grid-template-areas:'reference''side']

        lg:grid-cols-[1fr_320px]
        lg:grid-rows-[auto_auto]
        lg:[grid-template-areas:'reference_side']
        lg:gap-8
       ">
      <div id="apiref" className="rounded-2xl p-6 transition [grid-area:reference] w-full">

        {tags?.length ? (
          <div className="flex gap-2 mb-4 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 text-xs rounded-lg bg-lupe-100 dark:bg-lupe-700/40 text-lupe-700 dark:text-lupe-200 border border-lupe-200 dark:border-lupe-600/40 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
          {title ?? "Untitled endpoint"}
        </h1>
        {summary && <p className="italic text-gray-600 dark:text-gray-400">{summary}</p>}
        {description && <p className="text-content mb-6 leading-relaxed">{description}</p>}
        {deprecated && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Deprecated</p>
        )}
        {externalDocs?.url && (
          <a
            href={externalDocs.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline text-sm"
          >
            {externalDocs.description ?? "External docs"}
          </a>
        )}
        {(path || method) && (
          <div className="flex items-center gap-4 mb-6 mt-4 w-full border-lupe-300 dark:border-lupe-600/30 border py-4 px-5 rounded-xl bg-lupe-50/50 dark:bg-lupe-800/20 shadow-sm">
            {method && (
              <span
                className={`px-3 py-1.5 my-auto rounded-lg text-xs font-bold shadow-sm flex-shrink-0 ${methodColors[method]}`}
              >
                {method}
              </span>
            )}
            {path && (
              <div className="flex-1 border-lupe-300 dark:border-lupe-600/30 border py-3 px-4 rounded-lg hover:bg-lupe-50 dark:hover:bg-lupe-700/40 hover:border-accent-primary/40 dark:hover:border-accent-primary/40 transition-all duration-200 cursor-pointer shadow-sm">
                <CodeBlock>
                  <span className="text-sm font-mono text-lupe-800 dark:text-lupe-100">{path}</span>
                </CodeBlock>
              </div>
            )}
            {tryItBaseUrl && (
                <TryItButton/>
            )}
          </div>
        )}


        <div className="flex flex-col gap-4">
        <Security security={security} securitySchemas={securitySchemas} />
        <Parameters parameters={parameters} />
        <RequestBody reqBody={requestBody as any} />
        <Response responses={responses}/>
        </div>
      </div>
          <aside className="hidden min-w-72 xl:block sidebar [grid-area:side] flex-shrink-0 sticky top-24 max-h-[100dvh] overflow-y-auto w-full ml-8 pl-6">
                  <ResponseTabs responses={responses}/>
          </aside>,
    </div>
  );
}

