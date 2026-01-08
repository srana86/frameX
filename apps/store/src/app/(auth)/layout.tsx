import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className='min-h-screen'>
      <div className='container mx-auto px-4 py-4'>
        <Button asChild variant='ghost'>
          <Link href='/' className='flex items-center gap-2'>
            <ArrowLeft className='w-4 h-4' />
            Back Home
          </Link>
        </Button>
      </div>
      <section className='-mt-5'>{children}</section>
    </main>
  );
}
