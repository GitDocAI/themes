"use client";

import { ReactNode } from 'react';
import { useState } from "react";
import { RequestBody as RequestBodyApi,ApiSchema } from "../../../models/ApiReference.models";
import "primeicons/primeicons.css";

interface Props {
  reqBody:RequestBodyApi
}


export function RequestBody({ reqBody }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const renderConstraints = (schema: ApiSchema) => {
    const constraints: ReactNode[] = [];
    if (!schema) return null;

    if (schema.minimum !== undefined)
      constraints.push(
        <span key="minimum">Required range x ≥
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
            {schema.minimum}
          </span>
        </span>
      );

    if (schema.maximum !== undefined)
      constraints.push(
        <span key="maximum">Required range x ≤
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
            {schema.maximum}
          </span>
        </span>
      );

    if (schema.minLength !== undefined)
      constraints.push(
        <span key="minLength">Min Length
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
            {schema.minLength}
          </span>
        </span>
      );

    if (schema.maxLength !== undefined)
      constraints.push(
        <span key="maxLength">Max Length
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
            {schema.maxLength}
          </span>
        </span>
      );

    if (schema.pattern !== undefined)
      constraints.push(
        <span key="pattern">Pattern:
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
            {schema.pattern}
          </span>
        </span>
      );

    if (schema.enum !== undefined)
      constraints.push(
        <span key="enum" className="flex flex-wrap">Available Options:
            {schema.enum.map((option:string)=>(
                <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
                    {option}
                </span>
            ))}
        </span>
      );

    if (schema.default !== undefined)
      constraints.push(
        <span key="default">Default:
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
            {JSON.stringify(schema.default)}
          </span>
        </span>
      );

    if (schema.example !== undefined)
      constraints.push(
        <span key="example">Example:
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary ml-1">
            {JSON.stringify(schema.example)}
          </span>
        </span>
      );

    if (schema.multipleOf !== undefined)
      constraints.push(
        <span key="multipleOf">MultipleOf: {schema.multipleOf}</span>
      );



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

  const getTypeDisplay = (schema: ApiSchema): string => {
    if (schema.type === "array") {
      if (schema.items) {
        const itemType = schema.items.type || "object";
        return `${itemType}[]`;
      }
      return "array";
    }
    return schema.type || "object";
  };

  const renderProperty = (
    name: string,
    schema: ApiSchema,
    parentName?: string,
    requiredFields?: string[]
  ) => {
    const fullPath = parentName ? `${parentName}.${name}` : name;
    const isRequired = requiredFields?.includes(name);
    const hasChildren = schema.properties || (schema.type === "array" && schema.items?.properties);

    return (
      <div
        key={fullPath}
        className="flex flex-col gap-2 border border-transparent border-b-secondary/20 rounded-lg p-3"
      >
        <div className="flex justify-between items-start flex-col">
          <div className="flex flex-row gap-2 mb-2 flex-wrap items-center">
            {!parentName ? (
              <span className="text-primary font-semibold">{name}</span>
            ) : (
              <span className="font-semibold">
                {parentName}.
                <span className="text-primary">{name}</span>
              </span>
            )}

            <div className="flex flex-row gap-2 text-xs flex-wrap">
              {schema.format ? (
                <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary">
                  {schema.type !== "array" ? schema.type : ""}
                  &lt;{schema.format}&gt;
                  {schema.type === "array" ? "[]" : ""}
                </span>
              ) : (
                <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary">
                  {getTypeDisplay(schema)}
                </span>
              )}

              {isRequired && (
                <span className="rounded-md bg-red-600/20 px-2 py-0.5 text-xs text-red-600 dark:text-red-300">
                  required
                </span>
              )}


           {schema.deprecated &&(
                <span className="rounded-md bg-yellow-200/5 px-2 py-0.5 text-xs text-secondary">
                   deprecated
                </span>
            )}

              {schema.unique_items && (
                <span className="rounded-md bg-blue-600/20 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-300">
                  unique items
                </span>
              )}
            </div>
          </div>

          {renderConstraints(schema)}

          {hasChildren && (
            <button
              className={`flex items-center cursor-pointer gap-1 text-sm text-secondary border-secondary/20 border rounded-xl px-4 py-3 w-full mt-2 ${
                expanded[fullPath] ? "border-b-transparent rounded-b-none" : ""
              }`}
              onClick={() => toggleExpand(fullPath)}
            >
              <i
                className={`pi mr-2 ${
                  expanded[fullPath] ? "pi-chevron-up" : "pi-chevron-down"
                }`}
              />
              {expanded[fullPath]
                ? "Hide child attributes"
                : "Show child attributes"}
            </button>
          )}
        </div>

        {expanded[fullPath] && hasChildren && (
          <div className="border border-secondary/20 border-t-transparent -mt-3">
            {schema.properties &&
              Object.entries(schema.properties).map(([childName, childSchema]) => (
                <div key={childName} className="flex flex-col">
                  {renderProperty(
                    childName,
                    childSchema,
                    fullPath,
                    schema.required_fields
                  )}
                </div>
              ))
            }
            {schema.type === "array" && schema.items?.properties &&
              Object.entries(schema.items.properties).map(([childName, childSchema]) => (
                <div key={childName} className="flex flex-col">
                  {renderProperty(
                    childName,
                    childSchema,
                    `${fullPath}[0]`,
                    schema.items?.required_fields
                  )}
                </div>
              ))
            }
          </div>
        )}
      </div>
    );
  };

  const requestBodySchema = reqBody?.content?.["application/json"]?.schema;

  if (!requestBodySchema) {
    return (
      <div className="text-center text-secondary/60 py-8">
        No request body schema available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2  flex-row justify-between ">
           Body
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary">
            application/json
          </span>
        </h3>

        {requestBodySchema.properties &&
          Object.entries(requestBodySchema.properties).map(([propName, propSchema]) => (
            renderProperty(
              propName,
              propSchema as ApiSchema,
              undefined,
              requestBodySchema.required_fields
            )
          ))
        }
      </section>
    </div>
  );
}
