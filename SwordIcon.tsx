import React from 'react';

const SwordIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M19.78,18.36L4.64,3.22a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41L18.36,19.78a1,1,0,0,0,1.42,0A1,1,0,0,0,19.78,18.36ZM5.41,20.59a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L3.64,15.93a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.42Zm14-15a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l3.2,3.2a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.41Z" />
  </svg>
);

export default SwordIcon;