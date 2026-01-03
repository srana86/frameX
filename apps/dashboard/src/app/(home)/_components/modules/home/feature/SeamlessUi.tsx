import Image from "next/image";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";

// Integration icons paths
const bikashImg = "/integration-icons/bikash.png";
const nagadImg = "/integration-icons/nagad.png";
const paperflyImg = "/integration-icons/paperfly.png";
const pathaoImg = "/integration-icons/pathao.png";
const redxImg = "/integration-icons/redx.png";
const roketImg = "/integration-icons/roket.png";
const sslCommerceImg = "/integration-icons/ssl-commerce.png";
const steadfastImg = "/integration-icons/steadfast.png";
const upayImg = "/integration-icons/upay.png";

interface IntegrationData {
  src: string;
  alt: string;
  name: string;
}

const integrations: IntegrationData[] = [
  { src: pathaoImg, alt: "Pathao", name: "Pathao" },
  { src: sslCommerceImg, alt: "SSL Commerce", name: "SSL Commerce" },
  { src: redxImg, alt: "RedX", name: "RedX" },
  { src: paperflyImg, alt: "Paperfly", name: "Paperfly" },
  { src: bikashImg, alt: "bKash", name: "bKash" },
  { src: roketImg, alt: "Roket", name: "Roket" },
  { src: nagadImg, alt: "Nagad", name: "Nagad" },
  { src: upayImg, alt: "Upay", name: "Upay" },
  { src: steadfastImg, alt: "Steadfast", name: "Steadfast" },
];

export function SeamlessUi() {
  // Split integrations into two groups for two orbiting circles
  const outerIntegrations = integrations.slice(0, 5);
  const innerIntegrations = integrations.slice(5);

  return (
    <div className='relative flex h-80 w-full flex-col items-center justify-center overflow-hidden'>
      <OrbitingCircles radius={130} iconSize={60}>
        {outerIntegrations.map((integration) => (
          <IntegrationIcon key={integration.name} src={integration.src} alt={integration.alt} />
        ))}
      </OrbitingCircles>
      <OrbitingCircles iconSize={45} radius={60} reverse speed={2}>
        {innerIntegrations.map((integration) => (
          <IntegrationIcon key={integration.name} src={integration.src} alt={integration.alt} />
        ))}
      </OrbitingCircles>
    </div>
  );
}

interface IntegrationIconProps {
  src: string;
  alt: string;
}

function IntegrationIcon({ src, alt }: IntegrationIconProps) {
  return (
    <div className='relative flex size-full items-center justify-center rounded-full bg-white/80 p-1 shadow-lg dark:bg-gray-800/80 cursor-pointer group-hover:scale-[1.05] overflow-hidden'>
      <Image src={src} alt={alt} width={40} height={40} className='size-full object-contain rounded-full' />
    </div>
  );
}
