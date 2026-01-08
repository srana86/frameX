import { CategoriesClient } from "./CategoriesClient";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type InitialData = {
  categories: Array<{
    id: string;
    name: string;
    order: number;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: PaginationData;
};

async function getCategories(page: number = 1, limit: number = 30): Promise<InitialData> {
  try {
    const { getMerchantCollectionForAPI, buildMerchantQuery } = await import("@/lib/api-helpers");
    const col = await getMerchantCollectionForAPI("product_categories");
    const query = await buildMerchantQuery();

    const skip = (page - 1) * limit;
    const totalCount = await col.countDocuments(query);
    const categories = await col.find(query).sort({ order: 1, name: 1 }).skip(skip).limit(limit).toArray();

    const categoriesWithoutId = categories.map(({ _id, ...cat }) => ({
      id: cat.id as string,
      name: cat.name as string,
      order: cat.order as number,
      createdAt: cat.createdAt as string,
      updatedAt: cat.updatedAt as string,
    }));

    return {
      categories: categoriesWithoutId,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      categories: [],
      pagination: {
        page: 1,
        limit: 30,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

export default async function ProductCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }> | { page?: string; limit?: string };
}) {
  const params = await Promise.resolve(searchParams);
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "30", 10);

  const initialData = await getCategories(page, limit);

  return (
    <div className='space-y-6 py-4'>
      <CategoriesClient initialData={initialData} />
    </div>
  );
}
