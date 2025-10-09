import React from 'react';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        {...props}
    >
        <path d="M12 2L9.5 7.5 4 10l5.5 2.5L12 18l2.5-5.5L20 10l-5.5-2.5z"/>
        <path d="M21 16l-1.5-3.5-3.5-1.5 3.5-1.5L21 6l1.5 3.5 3.5 1.5-3.5 1.5z" transform="scale(0.5) translate(20, -5)"/>
        <path d="M5 19l-1-2.5-2.5-1 2.5-1L5 12l1 2.5 2.5 1-2.5 1z" transform="scale(0.6) translate(-5, 5)"/>
    </svg>
);

export default SparklesIcon;
