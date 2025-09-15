"use client";
import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface Parameter {
  name: string;
  in: string;
  description: string;
  schema: { type: string; format?: string };
}

interface ResponseContent {
  description: string;
  content: any;
}

interface ApiReferenceProps {
  title: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  parameters: Parameter[];
  responses: Record<string, ResponseContent>;
  tryItBaseUrl:string
}

export default function ApiReference({
  title,
  method,
  path,
  description,
  parameters,
  responses,
  tryItBaseUrl
}: ApiReferenceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-600",
    POST: "bg-blue-600",
    PUT: "bg-amber-600",
    DELETE: "bg-rose-600",
  };

  return (
    <div className=" rounded-2xl p-6  transition ">
      {/* Header */}
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
        {description}
      </p>

      {/* Endpoint */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className={`px-3 py-1 rounded-md text-sm font-semibold text-white shadow ${methodColors[method]}`}
        >
          {method}
        </span>
        <code className="bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
          {path}
        </code>
        {
          tryItBaseUrl =="" || tryItBaseUrl==null? (<></>) :  (<button
          onClick={() => setIsOpen(true)}
          className="ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md shadow text-sm transition"
        >
          <i className="pi pi-play" />
          Try it
        </button>)
        }
      </div>

      {/* Parameters */}
      {parameters.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Parameters
          </h3>
          <div className="grid gap-3">
            {parameters.map((param) => (
              <div
                key={param.name}
                className="p-4 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                    {param.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300">
                    {param.in}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {param.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Type: {param.schema.type}{" "}
                  {param.schema.format && `(${param.schema.format})`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responses */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Responses
        </h3>
        <div className="grid gap-3">
          {Object.entries(responses).map(([code, res]) => (
            <div
              key={code}
              className="p-4 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60"
            >
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {code}
              </span>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                {res.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
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

                {parameters.map((param) => (
                  <div key={param.name} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {param.name} ({param.in})
                    </label>
                    <input
                      type="text"
                      value={formData[param.name] || ""}
                      onChange={(e) =>
                        handleInputChange(param.name, e.target.value)
                      }
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
                  <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow">
                    Send
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

