import React, { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  user?: { name: string; avatar?: string };
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg-deep)] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Interface */}
      <div className="relative z-10 flex h-full w-full">
        {children}
      </div>
    </div>
  );
};
