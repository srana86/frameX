import type { Metadata } from "next";
import { CategoryStatisticsClient } from "./CategoryStatisticsClient";

export const metadata: Metadata = {
  title: "Admin · Orders · Category Statistics",
  description: "Sales performance by product category",
};

export default function CategoryStatisticsPage() {
  return (
    <div className='mx-auto w-full py-4'>
      <CategoryStatisticsClient />
    </div>
  );
}
