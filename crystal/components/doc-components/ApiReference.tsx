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
    GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    PATCH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };

  return (
    <div className="
        grid
        grid-cols-1
        grid-rows-[auto_auto]
        [grid-template-areas:'reference''side']

        lg:grid-cols-[1fr_auto]
        lg:grid-rows-[auto_auto]
        lg:[grid-template-areas:'reference_side']
       ">
      <div id="apiref" className="rounded-2xl p-6 transition [grid-area:reference] w-full">

        {tags?.length ? (
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-neutral-700 text-primary"
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
          <div className="flex items-center gap-4 mb-6 mt-4 w-full border-gray-300 dark:border-secondary/20 border py-3 px-4 rounded-xl">
            {method && (
              <span
                className={`px-2 py-0.5 my-auto rounded-md text-xs font-semibold shadow flex-shrink-0 ${methodColors[method]}`}
              >
                {method}
              </span>
            )}
            {path && (
              <div className="flex-1 border-gray-200 dark:border-secondary/10 border py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-secondary/30 transition-all duration-200 cursor-pointer">
                <CodeBlock>
                  <span className="text-sm font-mono">{path}</span>
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
          <aside className="hidden min-w-64 xl:block sidebar [grid-area:side]  flex-shrink-0 sticky top-18 max-h-[90dvh] overflow-y-auto w-full">
                  <ResponseTabs responses={responses}/>
          </aside>,
    </div>
  );
}

