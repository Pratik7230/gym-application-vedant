import { DashboardShell } from "@/components/dashboard-shell.jsx";

const nav = [
  { href: "/client", label: "Home" },
  { href: "/client/profile", label: "Profile" },
  { href: "/client/subscription", label: "Subscription" },
  { href: "/client/workouts", label: "Workouts" },
  { href: "/client/payments", label: "Payments" },
  { href: "/client/attendance", label: "Attendance" },
];

export default function ClientLayout({ children }) {
  return (
    <DashboardShell title="Member" nav={nav}>
      {children}
    </DashboardShell>
  );
}
