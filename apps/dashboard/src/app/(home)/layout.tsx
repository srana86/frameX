import { ReactNode } from "react";
import Navbar from "./_components/shared/Navbar";
import Footer from "./_components/shared/Footer";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-white scroll-smooth'>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
