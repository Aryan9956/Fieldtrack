import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FieldTrack — Production-Ready Employee Field Tracking SaaS',
  description: 'Manage, track, and monitor field employees in real-time. Attendance, GPS location history, tasks, and reports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-900 text-surface-50 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
