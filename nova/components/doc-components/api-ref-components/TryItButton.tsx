"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

import {ApiReference as ApiReferenceProps} from '../../../models/ApiReference.models'




export const TryItButton = (
  {title,
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
}: ApiReferenceProps) =>{

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
              <button
                onClick={() => setIsOpen(true)}
                className="ml-auto flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] dark:bg-[#22c55e] dark:hover:bg-[#16a34a] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 border border-transparent shadow-sm"
              >
                Try
              </button>

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
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-1.5 rounded-lg bg-nova-100 dark:bg-nova-800 text-nova-700 dark:text-nova-300 text-sm font-medium transition-all duration-300 hover:bg-nova-200 dark:hover:bg-nova-700 border border-nova-200 dark:border-nova-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/15 text-accent-primary text-sm font-medium transition-all duration-300 disabled:opacity-50 border border-accent-primary/20 hover:border-accent-primary/30"
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




</>

  )

}
