import * as React from "react";

interface GridIconProps extends React.SVGProps<SVGSVGElement> {}

const GridIcon = (props: GridIconProps) => (
  <svg width={59} height={59} viewBox='0 0 59 59' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <g filter='url(#filter0_i_9134_3096)'>
      <path
        d='M27 9.5V19.5C27 21.4891 26.2098 23.3968 24.8033 24.8033C23.3968 26.2098 21.4891 27 19.5 27H9.5C7.51088 27 5.60322 26.2098 4.1967 24.8033C2.79018 23.3968 2 21.4891 2 19.5V9.5C2 7.51088 2.79018 5.60322 4.1967 4.1967C5.60322 2.79018 7.51088 2 9.5 2H19.5C21.4891 2 23.3968 2.79018 24.8033 4.1967C26.2098 5.60322 27 7.51088 27 9.5ZM49.5 2H39.5C37.5109 2 35.6032 2.79018 34.1967 4.1967C32.7902 5.60322 32 7.51088 32 9.5V19.5C32 21.4891 32.7902 23.3968 34.1967 24.8033C35.6032 26.2098 37.5109 27 39.5 27H49.5C51.4891 27 53.3968 26.2098 54.8033 24.8033C56.2098 23.3968 57 21.4891 57 19.5V9.5C57 7.51088 56.2098 5.60322 54.8033 4.1967C53.3968 2.79018 51.4891 2 49.5 2ZM19.5 32H9.5C7.51088 32 5.60322 32.7902 4.1967 34.1967C2.79018 35.6032 2 37.5109 2 39.5V49.5C2 51.4891 2.79018 53.3968 4.1967 54.8033C5.60322 56.2098 7.51088 57 9.5 57H19.5C21.4891 57 23.3968 56.2098 24.8033 54.8033C26.2098 53.3968 27 51.4891 27 49.5V39.5C27 37.5109 26.2098 35.6032 24.8033 34.1967C23.3968 32.7902 21.4891 32 19.5 32ZM49.5 32H39.5C37.5109 32 35.6032 32.7902 34.1967 34.1967C32.7902 35.6032 32 37.5109 32 39.5V49.5C32 51.4891 32.7902 53.3968 34.1967 54.8033C35.6032 56.2098 37.5109 57 39.5 57H49.5C51.4891 57 53.3968 56.2098 54.8033 54.8033C56.2098 53.3968 57 51.4891 57 49.5V39.5C57 37.5109 56.2098 35.6032 54.8033 34.1967C53.3968 32.7902 51.4891 32 49.5 32Z'
        fill='#6468F0'
      />
    </g>
    <defs>
      <filter id='filter0_i_9134_3096' x={2} y={2} width={55} height={59} filterUnits='userSpaceOnUse' colorInterpolationFilters='sRGB'>
        <feFlood floodOpacity={0} result='BackgroundImageFix' />
        <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
        <feColorMatrix in='SourceAlpha' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha' />
        <feOffset dy={4} />
        <feGaussianBlur stdDeviation={2} />
        <feComposite in2='hardAlpha' operator='arithmetic' k2={-1} k3={1} />
        <feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0' />
        <feBlend mode='normal' in2='shape' result='effect1_innerShadow_9134_3096' />
      </filter>
    </defs>
  </svg>
);

export default GridIcon;
