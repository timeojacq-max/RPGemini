import React from 'react';

const MonsterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-4 6c1.11 0 2 .89 2 2s-.89 2-2 2-2-.89-2-2 .89-2 2-2zm8 0c1.11 0 2 .89 2 2s-.89 2-2 2-2-.89-2-2 .89-2 2-2zm-4 6c-2.33 0-4.32 1.45-5.12 3.5h10.24c-.8-2.05-2.79-3.5-5.12-3.5z" />
  </svg>
);

export default MonsterIcon;