'use client'

import { FC, useState } from 'react'
import 'primeicons/primeicons.css'

type BannerConfig = string | {
  message: string;
  colors?: {
    light?: string;
    dark?: string;
  };
};

export const Banner: FC<{ content: BannerConfig }> = ({ content }) => {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const message = typeof content === 'string' ? content : content.message;
  const colors = typeof content === 'object' ? content.colors : null;

  const lightBg = colors ? `${colors.light}20` : undefined;
  const darkBg = colors ? `${colors.dark}20` : undefined;
  const lightBorder = colors ? `${colors.light}40` : undefined;
  const darkBorder = colors ? `${colors.dark}40` : undefined;

  return (
    <>
      {colors && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .custom-banner {
              background-color: ${lightBg};
              color: ${colors.light};
              border-color: ${lightBorder};
            }
            .dark-theme .custom-banner {
              background-color: ${darkBg};
              color: ${colors.dark};
              border-color: ${darkBorder};
            }
          `
        }} />
      )}
      <div
        className={`px-4 py-1 rounded relative text-xs sm:text-md flex items-center justify-between gap-4 shadow-sm border ${
          colors ? 'custom-banner' : 'bg-red-100 border-yellow-300 text-yellow-800'
        }`}
      >
        <div className="flex items-center gap-2 justify-center w-full flex-1">
          <i className="pi pi-info-circle" />
          <span>{message}</span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className={`cursor-pointer transition ${
            colors ? 'hover:opacity-80' : 'text-yellow-800 hover:text-yellow-900'
          }`}
          aria-label="Close"
        >
          <i className="pi pi-times" />
        </button>
      </div>
    </>
  )
}
