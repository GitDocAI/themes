"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { createPortal } from "react-dom";
import { CodeBlock } from "./CodeBlock";
import {JsonHighlight} from "./HighlightedJSON"
import {Security} from "./api-ref-components/Security"
import {Parameters} from "./api-ref-components/Parameters"
import {RequestBody} from "./api-ref-components/RequestBody"
import {Response} from "./api-ref-components/Response"
import {ResponseTabs} from "./api-ref-components/ResponseTabs"
import {ApiReference as ApiReferenceProps} from '../../models/ApiReference.models'



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
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [asideRoot, setAsideRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setAsideRoot(document.getElementById("aside-root"));
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = async () => {
    if (!tryItBaseUrl || !method || !path) return;
    setLoading(true);
    setResponseData(null);
    try {
      let url = `${tryItBaseUrl}${path}`;
      let options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (method === "GET") {
        const query = new URLSearchParams(formData).toString();
        if (query) url += `?${query}`;
      } else {
        options.body = JSON.stringify(formData);
      }
      const res = await fetch(url, options);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      setResponseData({ status: res.status, body: data });
    } catch (err: any) {
      setResponseData({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    PATCH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };

  return (
    <>
      <div id="apiref" className="rounded-2xl p-6 transition">

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
          <div className="flex items-start gap-3 mb-6 mt-4 w-full border-secondary/20 border p-2 rounded-xl">
            {method && (
              <span
                className={`px-3 py-1 my-auto rounded-md text-sm font-semibold shadow flex-shrink-0 ${methodColors[method]}`}
              >
                {method}
              </span>
            )}
            {path && (
              <pre className=" flex-1 border-secondary/10 border p-1 rounded-lg pl-3">
                <CodeBlock>
                  <p className="w-full ">{path}</p>
                </CodeBlock>
              </pre>
            )}
            {tryItBaseUrl && (
              <button
                onClick={() => setIsOpen(true)}
                className="ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md shadow text-sm transition"
              >
                <i className="pi pi-play" />
                Try it
              </button>
            )}
          </div>
        )}


        <div className="flex flex-col gap-4">
        <Security security={security} securitySchemas={securitySchemas} />
        <Parameters parameters={parameters} />
        <RequestBody reqBody={requestBody as any} />
        <Response responses={responses}/>
        </div>

        <Transition show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/40" />
            </Transition.Child>
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-950 p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Try {title}
                  </Dialog.Title>
                  {parameters?.map((param:any, i:number) => (
                    <div key={i} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {param.name} ({param.in})
                      </label>
                      <input
                        type="text"
                        value={formData[param.name ?? ""] || ""}
                        onChange={(e) => handleInputChange(param.name ?? "", e.target.value)}
                        className="w-full border rounded-lg p-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send"}
                    </button>
                  </div>
                  {responseData && (
                    <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-neutral-900 text-sm overflow-auto max-h-64">
                      <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {JSON.stringify(responseData, null, 2)}
                      </pre>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
      {asideRoot &&
        createPortal(
          <aside className="hidden xl:block sidebar  flex-shrink-0 sticky top-18 max-h-[90dvh] overflow-y-auto [grid-area:toc]">

                  <ResponseTabs responses={responses}/>



          </aside>,
          asideRoot
        )}
    </>
  );
}

