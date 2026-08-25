import { AlertTriangle, UserCircle2 } from "lucide-react";
import Card from "../ui/Card";
import { TableWrap, Td, Th, Tr } from "../ui/DataTable";

/**
 * User & role administration.
 *
 * The backend has a User model with a `role` field but exposes no endpoint to
 * list, invite, or re-role users (only POST /auth/token). So this tab shows the
 * one user it can truthfully identify — the signed-in account, read from the
 * JWT's `sub` claim — plus the role reference the platform actually enforces.
 * It deliberately does not render a fabricated roster.
 */

export interface RoleMeta {
  key: string;
  label: string;
  description: string;
  badge: string;
}

const ROLES: RoleMeta[] = [
  {
    key: "admin",
    label: "Admin",
    description: "Full platform administration, connector and user management.",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  {
    key: "ciso",
    label: "CISO",
    description: "Org-wide risk posture, investment approval, board reporting.",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    key: "cfo",
    label: "CFO",
    description: "Financial exposure, capital allocation and ROSI review.",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    key: "board_viewer",
    label: "Board Viewer",
    description: "Read-only access to Board Governance roll-ups.",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    key: "compliance_officer",
    label: "Compliance Officer",
    description: "Framework mapping, gap tracking, audit evidence export.",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  {
    key: "analyst",
    label: "Analyst",
    description: "Scanning, triage, attack-path and remediation workflows.",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    key: "auditor",
    label: "Auditor",
    description: "Read-only evidence and audit-trail access.",
    badge: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  },
];

/** Reads the `sub` claim without pulling in a JWT library; falls back to null on any malformed token. */
const readUsernameFromToken = (): string | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.sub === "string" ? decoded.sub : null;
  } catch {
    return null;
  }
};

const UsersRolesTab = () => {
  const username = readUsernameFromToken();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">Signed-in Account</h2>
        <Card>
          {username ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{username}</p>
                <p className="text-xs text-slate-500">Authenticated via bearer token</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <UserCircle2 className="w-5 h-5" />
              No active session token found.
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Roles</h2>

        <div className="flex items-start gap-2 px-3 py-2.5 mb-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Multi-user administration is not available yet — the backend defines these roles on the User model but
            exposes no endpoint to list, invite, or re-role accounts. The reference below documents what each role is
            intended to grant; a roster will appear here once that endpoint exists.
          </span>
        </div>

        <Card flush>
          <TableWrap>
            <thead>
              <tr>
                <Th>Role</Th>
                <Th>Identifier</Th>
                <Th>Intended Access</Th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <Tr key={role.key}>
                  <Td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${role.badge}`}>{role.label}</span>
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">{role.key}</Td>
                  <Td className="text-slate-600 dark:text-slate-300">{role.description}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </div>
    </div>
  );
};

export default UsersRolesTab;
