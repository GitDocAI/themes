'use client';
import { useState } from 'react';
import { JsonHighlight } from '../HighlightedJSON';

interface ResponseTabsProps {
  responses: Record<string, any>;
  className?: string;
}

export function ResponseTabs({ responses, className = "" }: ResponseTabsProps) {
  const responseEntries = Object.entries(responses);
  const [activeTab, setActiveTab] = useState<string>(responseEntries[0]?.[0] || '');
  const [copied, setCopied] = useState<string | null>(null);

  if (responseEntries.length === 0) {
    return null;
  }

  const handleCopy = async (content: any, tabId: string) => {
    try {
      const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(tabId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getJsonContent = (responseData: any) => {
    if (!responseData.content) return null;

    const contentTypes = Object.keys(responseData.content);
    let selectedContentType = contentTypes.find(ct => ct === 'application/json') ||
                             contentTypes.find(ct => ct === '*/*') ||
                             contentTypes[0];

    return {
      contentType: selectedContentType,
      schema: responseData.content[selectedContentType]?.schema
    };
  };

  if(responseEntries.length===0 || responseEntries.every((e:[string,any])=>!e[1] || e[1].description=="No Content"))return null;

console.log(responseEntries)

  const jsonContent = getJsonContent(responseEntries.find(([code])=>code==activeTab)![1]);

  return (

    <div className={`pt-4 px-1 rounded-xl border border-secondary/5  bg-secondary/5 ${className}`}>
      {/* Tab Headers */}
      <div className="flex flex-wrap gap-1 ">

        {responseEntries.map(([code]) => {
          const isActive = activeTab === code;
          return (
            <button
              key={code}
              onClick={() => setActiveTab(code)}
              className={`px-3  font-mono font-bold  rounded-md  transition-all duration-200 ${
                isActive
                  ? `text-primary underline font-semibold underline-offset-8`
                  : 'text-secondary'
              }`}
            >
              {code}
            </button>
          );
        })}
        <button
          onClick={() => handleCopy(jsonContent!.schema, `${jsonContent!.contentType}`)}
          className=" ml-auto  px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors duration-200 cursor-pointer bg-secondary/0 hover:bg-secondary/5 my-auto"
          title={copied === `${jsonContent?.contentType}` ? "Copied!" : "Copy JSON"}
        >
          {copied === `${jsonContent?.contentType}` ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {responseEntries.map(([code, response]) => {
          if (activeTab !== code) return null;
          const jsonContent = getJsonContent(response);
          return (
            <div key={code} className="space-y-4">
              {jsonContent?.schema ? (
                <div className="relative">
                  <div className="">
                    <div className="space-y-2 bg-background rounded-xl p-4">
                      <JsonHighlight
                        json={generateExample(jsonContent.schema)}
                        className="overflow-y-auto max-h-[80dvh]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



function generateExample(schema: any): any {
  if (schema.type === 'array') {
    return [generateExample(schema.items)];
  }

  if (schema.type === 'object' && schema.properties) {
    const example: any = {};
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      example[key] = generateExampleValue(prop);
    });
    return example;
  }

  return generateExampleValue(schema);
}

function generateExampleValue(prop: any): any {
  switch (prop.type) {
    case 'string':
      if (prop.format === 'date-time') return new Date().toISOString();
      if (prop.enum) return prop.enum[0];
      return `example_${prop.type}`;
    case 'integer':
      return 1;
    case 'number':
      return 1.0;
    case 'boolean':
      return true;
    default:
      return null;
  }
}
