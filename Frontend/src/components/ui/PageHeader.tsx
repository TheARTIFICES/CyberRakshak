import type { ReactNode } from "react";

/**
 * The in-page title block (distinct from the Topbar's route title).
 * Extracted from the Dashboard / Compliance Center / Board Portal pattern so
 * newer pages don't re-invent the heading + subtitle + right-aligned action row.
 */
const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex items-start justify-between flex-wrap gap-4">
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="opacity-70 text-sm">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export default PageHeader;
