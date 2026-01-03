import * as React from "react";

interface StarIconProps extends React.SVGProps<SVGSVGElement> {}

const StarIcon = (props: StarIconProps) => (
  <svg width={71} height={71} viewBox='0 0 71 71' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <g filter='url(#filter0_i_9134_3050)'>
      <path
        d='M33.4173 5.69183C34.1273 3.75116 36.8727 3.75116 37.5827 5.69183L39.7038 11.4842C41.3673 16.0283 44.0016 20.155 47.4233 23.5767C50.845 26.9983 54.9717 29.6327 59.5157 31.2962L65.3082 33.4173C67.2518 34.1273 67.2518 36.8727 65.3082 37.5827L59.5157 39.7038C54.9717 41.3673 50.845 44.0016 47.4233 47.4233C44.0016 50.845 41.3673 54.9717 39.7038 59.5157L37.5827 65.3082C36.8727 67.2518 34.1273 67.2518 33.4173 65.3082L31.2962 59.5157C29.6327 54.9717 26.9983 50.845 23.5767 47.4233C20.155 44.0016 16.0283 41.3673 11.4842 39.7038L5.69183 37.5827C3.75116 36.8727 3.75116 34.1273 5.69183 33.4173L11.4842 31.2962C16.0283 29.6327 20.155 26.9983 23.5767 23.5767C26.9983 20.155 29.6327 16.0283 31.2962 11.4842L33.4173 5.69183Z'
        fill='#A8B6FB'
      />
    </g>
    <defs>
      <filter
        id='filter0_i_9134_3050'
        x={4.23633}
        y={4.23633}
        width={62.5293}
        height={66.5298}
        filterUnits='userSpaceOnUse'
        colorInterpolationFilters='sRGB'
      >
        <feFlood floodOpacity={0} result='BackgroundImageFix' />
        <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
        <feColorMatrix in='SourceAlpha' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha' />
        <feOffset dy={4} />
        <feGaussianBlur stdDeviation={2} />
        <feComposite in2='hardAlpha' operator='arithmetic' k2={-1} k3={1} />
        <feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0' />
        <feBlend mode='normal' in2='shape' result='effect1_innerShadow_9134_3050' />
      </filter>
    </defs>
  </svg>
);

export default StarIcon;
