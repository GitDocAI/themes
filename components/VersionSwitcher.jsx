"use client"
// components/VersionSwitcher.jsx
import React, { useState } from 'react';

const versions = [
  "v0.0.6-alpha",
  "v0.0.5",
  "v0.0.5-alpha"
];

const Tag = () => {
  return (
    <svg
      className="translate-x-px translate-y-px"
      data-testid="geist-icon"
      height="16"
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      width="16"
      style={{ width: '16px', height: '16px', color: 'currentcolor' }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 1.5H6.34315C7.00619 1.5 7.64207 1.76339 8.11091 2.23223L13.8787 8L8 13.8787L2.23223 8.11091C1.76339 7.64207 1.5 7.00619 1.5 6.34315V1.5ZM16 8L14.9393 6.93934L9.17157 1.17157C8.42143 0.421427 7.40401 0 6.34315 0H1.5H0V1.5V6.34315C0 7.40401 0.421426 8.42143 1.17157 9.17157L6.93934 14.9393L8 16L9.06066 14.9393L14.9393 9.06066L16 8ZM4.5 5.25C4.91421 5.25 5.25 4.91421 5.25 4.5C5.25 4.08579 4.91421 3.75 4.5 3.75C4.08579 3.75 3.75 4.08579 3.75 4.5C3.75 4.91421 4.08579 5.25 4.5 5.25Z"
        fill="currentColor"
      ></path>
    </svg>
  );
};

const Arrw = () => {
  return (
    <svg
      strokeLinecap="round"
      width="24"
      shapeRendering="geometricPrecision"
      height="24"
      data-testid="geist-icon"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      style={{ color: 'currentcolor', width: '20px', height: '20px' }}
      fill="none"
      aria-hidden="true"
      strokeLinejoin="round"
      className="with-icon_icon__MHUeb"
    >
      <path d="M17 8.517L12 3 7 8.517M7 15.48l5 5.517 5-5.517"></path>
    </svg>
  );
};

const VersionSwitcher = ({
  placeholder
  = "Select a version" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);

  const handleOptionClick = (
    index
  ) => {
    setSelectedOption(index);
    setIsOpen(false);
    if (index == 0) {
      window.location.href = '/docs';
    } else {
      window.location.href = `/${versions[index]}`;
    }
  };

  return (
    <div className="dropdown-container">
      <div
        className="dropdown-select"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Tag />
        <span style={{ marginLeft: '7px' }}>{versions[selectedOption] || placeholder}</span>
        <span style={{ marginLeft: 'auto' }}><Arrw /></span>
      </div>
      {isOpen && (
        <ul className="dropdown-menu">
          {versions.map((
            option
            ,
            index
          ) => (
            <li
              key={index}
              className="dropdown-item"
              onClick={() => handleOptionClick(index)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VersionSwitcher
