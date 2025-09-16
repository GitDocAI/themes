'use client';
import { useEffect, useState } from "react";

export function JsonHighlight({ json }:{json:any}) {
  const [highlighted, setHighlighted] = useState("");
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

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
      console.log(theme)

      const html = await shiki.codeToHtml(code, {
        lang: "json",
        theme: theme=="dark"?"github-dark":"github-light",
      });
      setHighlighted(html);
    });
  }, [json,theme]);

  return (
    <div
      className="json-highlight !bg-transparent rounded-xl overflow-hidden"
      style={{ fontFamily: "monospace", fontSize: 18 }}
      dangerouslySetInnerHTML={{ __html: highlighted || "<pre></pre>" }}
    />
  );
}

