import { type ReactNode } from 'react';

interface OptionsSidebarProps {
  children?: ReactNode;
  theme:string;
}

const OptionsSidebar = ({ children,theme  }: OptionsSidebarProps) => {

  return (
    <>
      <style>{`
        .options-sidebar {
          position: fixed;
          top: 5.9rem;
          right: 0;
          height: calc(100% - 3rem);
          background: ${theme === 'light' ? '#1f293729' : '#ffffff09'} ;
          transition: width 0.3s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .options-sidebar.open {
          width: 16rem;
        }

        .options-sidebar.closed {
          width: 8rem;
        }

        .sidebar-toggle-btn {
          padding: 1rem;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
          width: 100%;
          transition: background-color 0.2s;
        }

        .sidebar-toggle-btn:hover {
          background-color: #374151;
        }

        .sidebar-content {
          padding: 1rem;
          flex: 1;
          overflow-y: auto;
        }

        .sidebar-content ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-content li {
          padding: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
          border-radius: 0.375rem;
          margin-bottom: 0.25rem;
        }

        .sidebar-content li:hover {
          background-color: #374151;
        }

        .sidebar-content::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-content::-webkit-scrollbar-track {
          background: #1f2937;
        }

        .sidebar-content::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }

        .sidebar-content::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }

        .sidebar-item-wrapper {
          padding: 0.5rem;
          transition: background-color 0.2s;
          border-radius: 0.375rem;
          margin-bottom: 0.25rem;
        }

        .sidebar-item-wrapper:hover {
          background-color: #374151;
        }
      `}</style>

      <div className="options-sidebar" >
        <div className="sidebar-content">
          {children ? (
            <div>
              {Array.isArray(children) ? (
                children.map((child, index) => (
                  <div key={index} className="sidebar-item-wrapper">
                    {child}
                  </div>
                ))
              ) : (
                <div className="sidebar-item-wrapper">
                  {children}
                </div>
              )}
            </div>
          ) : (
            <ul>
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default OptionsSidebar;
