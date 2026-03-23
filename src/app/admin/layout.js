import { DashboardShell } from "@/components/dashboard-shell.jsx";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/logs", label: "Activity logs" },
  { href: "/admin/export", label: "Export CSV" },
];

export default function AdminLayout({ children }) {
  return (
    <DashboardShell title="Admin" nav={nav}>
      {children}
    </DashboardShell>
  );
}
