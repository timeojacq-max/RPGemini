import React from 'react';

const BurnIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM12 20c-3.31 0-6-2.69-6-6 0-2.34 1.35-4.37 3.29-5.43.32.48.71.91 1.15 1.28.88.73 1.95 1.15 3.07 1.15s2.19-.42 3.07-1.15c.44-.37.83-.8 1.15-1.28C16.65 9.63 18 11.66 18 14c0 3.31-2.69 6-6 6z"/>
  </svg>
);

export default BurnIcon;
