import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const RightDrawer: React.FC<Props> = ({ open, onClose, title, children }) => {
  return (
    <div
      className={`
        fixed top-0 right-0 h-full w-[32rem]
        bg-white dark:bg-slate-900
        shadow-2xl border-l
        border-slate-200 dark:border-slate-700
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "translate-x-full"}
        z-50
      `}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">{children}</div>
    </div>
  );
};

export default RightDrawer;