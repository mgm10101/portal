// src/components/Icons/PaymentPlanIcon.tsx

import React from 'react';

interface PaymentPlanIconProps {
  className?: string;
  size?: number;
}

export const PaymentPlanIcon: React.FC<PaymentPlanIconProps> = ({ className = "", size = 20 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Paper/document background */}
      <path 
        d="M4 2C3.44772 2 3 2.44772 3 3V21C3 21.5523 3.44772 22 4 22H16C16.5523 22 17 21.5523 17 21V7L12 2H4Z" 
        fill="currentColor" 
        stroke="currentColor" 
        strokeWidth="1"
      />
      {/* Folded corner */}
      <path 
        d="M12 2V7H17" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1"
      />
      {/* Clock circle */}
      <circle 
        cx="12" 
        cy="15" 
        r="3" 
        fill="white" 
        stroke="currentColor" 
        strokeWidth="1"
      />
      {/* Clock hands */}
      <line 
        x1="12" 
        y1="15" 
        x2="12" 
        y2="13" 
        stroke="currentColor" 
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line 
        x1="12" 
        y1="15" 
        x2="13.5" 
        y2="16" 
        stroke="currentColor" 
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};
