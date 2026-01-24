"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface CategoryFiltersProps {
  categories: Array<{ id: string; name: string }>;
  selectedCategory?: string;
}

export function CategoryFilters({ categories, selectedCategory: selectedCategoryProp }: CategoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get selected category from URL params or prop
  const selectedCategory = selectedCategoryProp || searchParams?.get("category") || null;

  const handleCategoryClick = (categoryName: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (categoryName === "All Items" || !categoryName) {
        params.delete("category");
      } else {
        params.set("category", categoryName);
      }
      const newUrl = params.toString() ? `/?${params.toString()}` : "/";
      router.push(newUrl);
      // Scroll to top on category change
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const allCategories = [
    { id: "all", name: "All Items" },
    ...categories.map((cat) => ({ id: cat.id, name: cat.name })),
  ];

  return (
    <div className='mb-6 overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
      <div className='flex gap-2 pb-2'>
        {allCategories.map((category) => {
          const isSelected = selectedCategory
            ? category.name === selectedCategory
            : category.id === "all";

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.name)}
              disabled={isPending}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all disabled:opacity-50",
                isSelected
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

