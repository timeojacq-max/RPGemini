import React from 'react';

const D20Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 2.05l9.3 5.37v10.56L12 23.35l-9.3-5.37V7.42L12 2.05M12 4.22l-7.3 4.22v7.12L12 19.78l7.3-4.22V8.44L12 4.22z" />
  </svg>
);

export default D20Icon;
