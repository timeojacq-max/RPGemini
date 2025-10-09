import React from 'react';

const RestartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    {...props}
  >
    <path d="M12,4C7.58,4,4,7.58,4,12s3.58,8,8,8c3.13,0,5.84-1.83,7.15-4.42l-1.46-0.85C16.9,16.92,14.61,18,12,18 c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.66,0,3.14,0.69,4.22,1.78L13,11h7V4l-2.39,2.39C16.1,4.96,14.13,4,12,4z"/>
  </svg>
);

export default RestartIcon;
