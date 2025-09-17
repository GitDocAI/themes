"use client";

import { ReactNode } from 'react';
import { useState } from "react";
import { Parameter } from "../../../models/ApiReference.models";
import "primeicons/primeicons.css";

interface Props {
  parameters: Parameter[];
}

export function Parameters({ parameters }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const queryParams = parameters.filter((p) => p.in === "query");
  const otherParams = parameters.filter((p) => p.in !== "query");

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const renderConstraints = (schema: any) => {
    const constraints: ReactNode[] = [];
    if (!schema) return null;

    if (schema.minimum !== undefined)
      constraints.push(
        <span>Required range x &ge;
              <span
                className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary"
              >
          {schema.minimum}
            </span>
        </span>

      );
    if (schema.maximum !== undefined)
      constraints.push(
        <span>Required range x &le;
              <span
                className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary"
              >
          {schema.maximum}
            </span>
        </span>
        );
    if (schema.minLength !== undefined)
      constraints.push(
        <span> Min Length
              <span
                className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary"
              >
                {schema.minLength}
            </span>
        </span>
      );
    if (schema.maxLength !== undefined)
      constraints.push(
        <span> Max Length
              <span
                className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary"
              >
                {schema.maxLength}
            </span>
        </span>
      );

    if (schema.pattern !== undefined)
      constraints.push(`Pattern: ${schema.pattern}`);
    if (schema.enum !== undefined){
      constraints.push(
        <span key="enum" className="flex flex-wrap">Available Options:
            {schema.enum.map((option:string)=>(
                <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
                    {option}
                </span>
            ))}
        </span>
      );
    }

    if (schema.default !== undefined)
      constraints.push(`Default: ${JSON.stringify(schema.default)}`);
    if (schema.example !== undefined)
      constraints.push(`Example: ${JSON.stringify(schema.example)}`);
    if (schema.multipleOf !== undefined)
      constraints.push(`MultipleOf: ${schema.multipleOf}`);
    if (schema.uniqueItems !== undefined)
      constraints.push(`UniqueItems: ${schema.uniqueItems}`);
    if (schema.nullable !== undefined)
      constraints.push(`Nullable: ${schema.nullable}`);
    if (schema.deprecated !== undefined)
      constraints.push(`Deprecated: ${schema.deprecated}`);
    if (schema.readOnly !== undefined)
      constraints.push(`Read Only: ${schema.readOnly}`);
    if (schema.writeOnly !== undefined)
      constraints.push(`Write Only: ${schema.writeOnly}`);

    return constraints.length > 0 ? (
      <div className="flex flex-col mt-1 text-sm text-secondary">
        {constraints.map((c, i) => (
          <span key={i} className="text-secondary/60">
            {c}
          </span>
        ))}
      </div>
    ) : null;
  };

  const renderParam = (param: Parameter, parentName?: string) => (
    <div
      key={param.name}
      className="flex flex-col gap-2 border border-transparent border-b-secondary/20 rounded-lg p-3"
    >
      <div className="flex justify-between items-start flex-col">
        <div className="flex flex-row gap-2 mb-2 flex-wrap">
          {!parentName ? (
            <span className="text-primary font-semibold">{param.name}</span>
          ) : (
            <span className="font-semibold">
              {parentName}.
              <span className="text-primary">{param.name}</span>
            </span>
          )}
          {param.description && (
            <span className="text-sm text-gray-600">{param.description}</span>
          )}
          <div className="flex flex-row gap-2 text-xs flex-wrap">
            {(param.in == "query" || !param.in) ? null : (
              <span
                key={param.in}
                className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary"
              >
                {param.in}
              </span>
            )}

            {param.schema?.format && (
              <span
                key={param.schema?.format}
                className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary"
              >
                {param.schema?.type !== "array" ? param.schema?.type : null}
                &lt;{param.schema?.format}&gt;
                {param.schema?.type === "array" ? "[]" : null}
              </span>
            )}

            {param.schema?.type && !param.schema?.format && (
              <span
                key={param.schema?.type}
                className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary"
              >
                {param.schema?.type}
              </span>
            )}

            {param.required && (
              <span
                key="required"
                className="rounded-md bg-red-600/20 px-2 py-0.5 text-xs text-red-600 dark:text-red-300"
              >
                required
              </span>
            )}
          </div>
        </div>

        {renderConstraints(param.schema)}

        {param.schema?.properties && (
          <button
            className={`flex items-center cursor-pointer gap-1 text-sm text-secondary border-secondary/20 border rounded-xl px-4 py-3 w-full ${
              expanded[param.name] ? "border-b-transparent rounded-b-none" : ""
            }`}
            onClick={() => toggleExpand(param.name)}
          >
            <i
              className={`pi mr-2 ${
                expanded[param.name] ? "pi-chevron-up" : "pi-chevron-down"
              }`}
            />
            {expanded[param.name]
              ? "Hide child attributes"
              : "Show child attributes"}
          </button>
        )}
      </div>

      {expanded[param.name] && param.schema?.properties && (
        <div className="border border-secondary/20 border-t-transparent -mt-3">
          {Object.entries(param.schema.properties).map(([childName, child]) => (
            <div key={childName} className="flex flex-col">
              {renderParam(
                {
                  name: `${childName}`,
                  schema: child,
                } as any,
                `${parentName ? parentName + "." : ""}${param.name}`
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {queryParams.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            Query Parameters
          </h3>
          {queryParams.map((p) => renderParam(p))}
        </section>
      )}

      {otherParams.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            Parameters
          </h3>
          {otherParams.map((p) => renderParam(p))}
        </section>
      )}
    </div>
  );
}

