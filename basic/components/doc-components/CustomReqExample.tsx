import React, { ReactNode, isValidElement } from "react";

interface ExampleBlockProps {
  type: "request" | "response";
  language: string;
  code: string;
}

const parseExampleBlock = (child: any): ExampleBlockProps | null => {
  if (!isValidElement(child)) {
    console.log('invalid element: ',child)
    return null
  }

  const preNode = child as any;
  const codeNode = preNode.props?.children;
  if (!codeNode?.props) return null;

  // MDX puede devolver children como string, array o ReactNode
  const rawChildren = codeNode.props.children;
  const rawText =
    typeof rawChildren === "string"
      ? rawChildren
      : Array.isArray(rawChildren)
      ? rawChildren.join("")
      : "";

  const className = codeNode.props.className || "";
  const language = className.replace("language-", "").trim();
  const meta = String(codeNode.props.metastring || "").toLowerCase();

  const explicitType =
    (typeof meta === "string" && meta.includes("request")) ||
    (typeof rawText === "string" && rawText.includes("curl"))
      ? "request"
      : (typeof meta === "string" && meta.includes("response")) ||
        (typeof rawText === "string" &&
          rawText.trimStart().startsWith("{"))
      ? "response"
      : undefined;

  if (!explicitType) return null;

  return {
    type: explicitType,
    language: language || "bash",
    code: rawText.trim(),
  };
};

export const ExampleVisualizer = ({ children }: { children: ReactNode }) => {
  console.log(children)
  const childArray = React.Children.toArray(children);
  const procesedInnerData = childArray.map((pre:any)=>{
       return pre.props
  })
  console.log(procesedInnerData)

  const parsedBlocks = childArray
    .map((child) => parseExampleBlock(child))
    .filter((b): b is ExampleBlockProps => !!b);

  if (parsedBlocks.length === 0) return null;

  const responseBlocks = parsedBlocks.filter((b) => b.type === "response");
  const requestBlocks = parsedBlocks.filter((b) => b.type === "request");

  return (
    <div className="example-visualizer my-6 border border-gray-700 rounded-lg overflow-hidden">
      {requestBlocks.length > 0 && (
        <div className="p-4 bg-gray-900 text-gray-100">
          <h4 className="font-semibold text-sm mb-2 uppercase text-blue-400">
            Request Example
          </h4>
          {requestBlocks.map((block, i) => (
            <pre
              key={i}
              className={`language-${block.language} bg-black/40 p-3 rounded-md text-sm overflow-x-auto`}
            >
              <code>{block.code}</code>
            </pre>
          ))}
        </div>
      )}

      {responseBlocks.length > 0 && (
        <div className="p-4 bg-gray-800 text-gray-100 border-t border-gray-700">
          <h4 className="font-semibold text-sm mb-2 uppercase text-green-400">
            Response Example
          </h4>
          {responseBlocks.map((block, i) => (
            <pre
              key={i}
              className={`language-${block.language} bg-black/40 p-3 rounded-md text-sm overflow-x-auto`}
            >
              <code>{block.code}</code>
            </pre>
          ))}
        </div>
      )}
    </div>
  );
};

