import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Maids For Care",
  description: "Admin panel for Maids For Care platform",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}