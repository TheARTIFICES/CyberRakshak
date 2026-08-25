import type { ReactNode } from "react";

/**
 * Shared table chrome, canonicalised on the Vulnerabilities / Asset Inventory
 * header treatment (uppercase, tracked, muted, no filled header bar) since that
 * is the style the rest of the app was asked to match.
 *
 * These are thin styling wrappers, not a data-grid abstraction — pages keep
 * full control of their own columns and row content.
 */

export const TableWrap = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">{children}</table>
  </div>
);

export const Th = ({ children, align = "left" }: { children?: ReactNode; align?: "left" | "right" | "center" }) => (
  <th
    className={`p-3 font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider text-xs whitespace-nowrap ${
      align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
    }`}
  >
    {children}
  </th>
);

export const Tr = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <tr
    onClick={onClick}
    className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition ${
      onClick ? "cursor-pointer" : ""
    }`}
  >
    {children}
  </tr>
);

export const Td = ({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) => (
  <td
    className={`p-3 ${
      align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
    } ${className}`}
  >
    {children}
  </td>
);
