import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login - Maids For Care",
  description: "Admin authentication for Maids For Care platform",
};

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-auth-layout">
      {children}
    </div>
  );
}