'use client';
import { useEffect, useState } from "react";

interface JsonHighlightProps {
  json: any;
  className?: string;
  fontSize?: number;
  fontFamily?: string;
}

export function JsonHighlight({
  json,
  className = "",
  fontSize = 14,
  fontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace"
}: JsonHighlightProps) {
  const [highlighted, setHighlighted] = useState("");
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(false);

 useEffect(() => {
    function checkDark() {
      setTheme(document.documentElement.classList.contains("dark-theme")?'dark':'light');
    }
    checkDark();
    const observer = new MutationObserver(() => {
      checkDark();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
    };
  }, []);



  useEffect(() => {
    const code = typeof json === "string" ? json : JSON.stringify(json, null, 2);
    import('shiki/bundle/web').then(async (shiki) => {

      const html = await shiki.codeToHtml(code, {
        lang: "json",
        theme: theme=="dark"?"one-dark-pro":"min-light",
      });
      setHighlighted(html);
    });
  }, [json,theme]);

  if (isLoading) {
    return (
      <div className={`json-highlight-loading rounded-xl p-4 bg-gray-100 dark:bg-gray-800 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`json-highlight-container ${className}`}>
      <div
        className="json-highlight rounded-xl overflow-hidden overflow-x-auto [&>pre]:!bg-transparent [&>pre]:!border-none [&>pre]:!shadow-none [&>pre]:!m-0 [&>pre]:!p-0"
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          lineHeight: 1.5,
          backgroundColor: 'transparent'
        }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
}

