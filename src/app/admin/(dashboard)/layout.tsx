import { AdminNav } from "./AdminNav";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-dark/30">
      <AdminNav />
      <div className="container-page py-8">{children}</div>
    </div>
  );
}
