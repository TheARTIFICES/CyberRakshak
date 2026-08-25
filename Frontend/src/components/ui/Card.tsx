import type { ReactNode } from "react";

/**
 * The canonical surface primitive for the whole app.
 *
 * Before this existed the same `bg-white dark:bg-slate-800 shadow rounded-xl p-6`
 * string was inlined in 55 places, with two older ad-hoc variants
 * (`dark:bg-[#1e293b]`, `dark:bg-[#111625]`) scattered across ~27 more — which
 * is exactly why Remediation / Scenario Simulator / Chat looked like a
 * different design pass from Dashboard. Everything should render through here.
 */
interface CardProps {
  children: ReactNode;
  className?: string;
  /** Removes internal padding when the card owns a full-bleed child (e.g. a table). */
  flush?: boolean;
}

const Card = ({ children, className = "", flush = false }: CardProps) => (
  <div className={`bg-white dark:bg-slate-800 shadow rounded-xl ${flush ? "" : "p-6"} ${className}`}>
    {children}
  </div>
);

export default Card;
