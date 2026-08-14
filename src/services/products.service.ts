import { prisma } from "../utils/prisma";
import { ProductFilters } from "../types";
import { Prisma } from "../../generated/prisma/client";

export const getProducts = async (filters: ProductFilters = {}) => {
  const {
    page,
    limit,
    minPrice,
    maxPrice,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const where: Prisma.ProductWhereInput = {};

  // 1. Filtro de busca textual (nome ou descrição)
  if (search && search.trim() !== "") {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  // 2. Filtro de faixa de preço (minPrice e maxPrice)
  const min = minPrice !== undefined && minPrice !== null ? Number(minPrice) : undefined;
  const max = maxPrice !== undefined && maxPrice !== null ? Number(maxPrice) : undefined;

  if ((min !== undefined && !isNaN(min)) || (max !== undefined && !isNaN(max))) {
    where.price = {};
    if (min !== undefined && !isNaN(min)) {
      where.price.gte = min;
    }
    if (max !== undefined && !isNaN(max)) {
      where.price.lte = max;
    }
  }

  // 3. Paginação (page e limit)
  const pageNum = page !== undefined && page !== null ? Math.max(1, Number(page)) : undefined;
  const limitNum = limit !== undefined && limit !== null ? Math.max(1, Number(limit)) : undefined;
  const skip = pageNum && limitNum ? (pageNum - 1) * limitNum : undefined;

  // 4. Ordenação (sortBy e sortOrder)
  const orderField = sortBy === "price" || sortBy === "name" || sortBy === "createdAt" ? sortBy : "createdAt";
  const orderDirection = sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";

  const products = await prisma.product.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    take: limitNum,
    skip,
    orderBy: {
      [orderField]: orderDirection,
    },
  });

  return products;
};


