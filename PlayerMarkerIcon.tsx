import React from 'react';

const PlayerMarkerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-1 5.41c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5V14h2.5c.83 0 1.5.67 1.5 1.5v2c0 .83-.67 1.5-1.5 1.5h-8C8.67 19 8 18.33 8 17.5v-2c0-.83.67-1.5 1.5-1.5H12V7.41c-.53-.25-1-.5-1-1.41z"/>
  </svg>
);

export default PlayerMarkerIcon;
