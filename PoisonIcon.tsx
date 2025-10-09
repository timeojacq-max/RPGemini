import React from 'react';

const PoisonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13 2c-2.29.5-4.43 1.94-5.99 3.99S4 10.37 4 13c0 3.31 2.69 6 6 6h4c3.31 0 6-2.69 6-6 0-2.63-1.67-4.88-4-5.65V6c0-2.21-1.79-4-4-4zm-2 11h-2v2h2v-2zm4 0h-2v2h2v-2zM9 4.34c1.22-.67 2.58-1.02 4-1.15-1.54.91-2.88 2.27-3.79 3.81H9V4.34z"/>
  </svg>
);

export default PoisonIcon;
