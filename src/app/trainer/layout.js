import { DashboardShell } from "@/components/dashboard-shell.jsx";

const nav = [
  { href: "/trainer", label: "Dashboard" },
  { href: "/trainer/clients", label: "Clients" },
  { href: "/trainer/workouts", label: "Workouts" },
];

export default function TrainerLayout({ children }) {
  return (
    <DashboardShell title="Trainer" nav={nav}>
      {children}
    </DashboardShell>
  );
}
