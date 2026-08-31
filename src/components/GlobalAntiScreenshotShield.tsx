import React from 'react';

interface GlobalAntiScreenshotShieldProps {
  children: React.ReactNode;
}

export const GlobalAntiScreenshotShield: React.FC<GlobalAntiScreenshotShieldProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full font-sans">
      {children}
    </div>
  );
};

