import React from 'react';
import logo from '../logo_bw.png';

export default function BuildWiseLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`} aria-label="BuildWise Logo">
      <img src={logo} alt="BuildWise Logo" className="h-8 w-auto mr-2" />
      {/* <span className="font-bold text-xl text-white align-middle">BuildWise</span> */}
    </div>
  );
} 