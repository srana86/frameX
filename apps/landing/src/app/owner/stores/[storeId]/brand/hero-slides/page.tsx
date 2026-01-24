import { HeroSlidesClient } from "../HeroSlidesClient";

export default async function HeroSlidesPage({ params }: { params: { storeId: string } }) {
  const { storeId } = await params;

  return (
    <div className='max-w-4xl'>
      <HeroSlidesClient storeId={storeId} />
    </div>
  );
}
