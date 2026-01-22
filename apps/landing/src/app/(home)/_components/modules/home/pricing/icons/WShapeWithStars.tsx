import RadiusCircles from "./RadiousCircle";

interface StarPosition {
  top: string;
  left: string;
  size: string;
  opacity: number;
}

const WShapeWithStars = () => {
  // 7 strategically placed stars for a cool design
  const stars: StarPosition[] = [
    // Top left peak - larger star
    { top: "8%", left: "5%", size: "size-1", opacity: 0.95 },

    // Left side accent
    { top: "25%", left: "12%", size: "size-1", opacity: 0.85 },

    // Center bottom - prominent star
    { top: "10%", left: "43%", size: "size-1.5", opacity: 1 },

    // Middle left connection
    { top: "42%", left: "28%", size: "size-1.5", opacity: 0.75 },

    // Middle right connection
    { top: "42%", left: "62%", size: "size-1.5", opacity: 0.75 },

    // Right side accent
    { top: "25%", left: "78%", size: "size-1", opacity: 0.85 },

    // Top right peak - larger star
    { top: "8%", left: "85%", size: "size-1", opacity: 0.95 },
  ];

  const Star = ({ top, left, size, opacity }: StarPosition) => (
    <div
      className={`absolute ${size} animate-pulse drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]`}
      style={{
        top,
        left,
        opacity,
      }}
    >
      <svg width='100%' height='100%' viewBox='0 0 10 10' className='w-full h-full'>
        <path d='M5 0L6.12 3.45L9.51 3.45L6.69 5.55L7.82 9L5 6.9L2.18 9L3.31 5.55L0.49 3.45L3.88 3.45L5 0Z' fill='white' />
      </svg>
    </div>
  );

  return (
    <div className='relative w-full h-full flex items-center justify-center'>
      <div className='relative w-[150px] h-[50px]'>
        {/* Left circle - positioned top left (W shape left peak) */}
        <div className='absolute -top-0.5 -left-3.5'>
          <RadiusCircles.RadiusCircle1 />
        </div>

        {/* Middle circle - positioned bottom center (W shape center dip) */}
        <div className='absolute -top-0.5 left-5'>
          <RadiusCircles.RadiusCircle2 />
        </div>

        {/* Right circle - positioned top right (W shape right peak) */}
        <div className='absolute -top-0.5 right-0'>
          <RadiusCircles.RadiusCircle3 />
        </div>

        {/* Small white stars scattered along the W shape */}
        {stars.map((star, index) => (
          <Star key={index} {...star} />
        ))}
      </div>
    </div>
  );
};

export default WShapeWithStars;
