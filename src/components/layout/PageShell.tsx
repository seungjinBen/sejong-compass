import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface PageShellProps {
  title: string;
  breadcrumb?: string[];
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function PageShell({ title, breadcrumb, children, fullWidth = false }: PageShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* TopBar */}
      <TopBar title={title} breadcrumb={breadcrumb} onMenuClick={() => setMobileOpen(true)} />

      {/* Main content */}
      <main className="pt-14 min-h-screen lg:ml-60">
        <div className={fullWidth ? '' : 'p-6'}>{children}</div>
      </main>
    </div>
  );
}
