import { SignRawPrivateKeyInput } from "node:crypto";
import { StreamDestroyOptions } from "node:quic";
import { boolean } from "zod";

export interface ProductFilters {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  categoryId?: number;
  sortBy?: "price" | "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateCategory {
  name: string;
  description?: string;
  slug: string;
  active: boolean;
}

export interface UpdateCategory {
  name?: string;
  description?: string;
  slug?: string;
  active?: boolean;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  firstName: string;
  lastName: string;
  cpf?: string;
  dateOfBirth?: string;
  birthDate?: string;
  phone?: string;
  role?: "USER" | "ADMIN";
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  cpf?: string | null;
  birthDate?: Date | null;
  phone?: string | null;
  role: "USER" | "ADMIN";
  createdAt?: Date | null;
}

export interface CreateProduct {
  name: string;
  description: string;
  price: number;
  colors?: string[];
  sizes?: string[];
  slug: string;
  stock: number;
  active: boolean;
  image?: string;
  categoryId: number;
}

export interface UpdateProduct extends Partial<CreateProduct> {
  name?: string;
  description?: string;
  price?: number;
  slug?: string;
  stock?: number;
  active?: boolean;
}

// Order Types

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export interface OrderItemInput {
  productId: number;
  quantity: number;
  size?: string;
}

export interface CreateOrder {
  userId?: number;
  items: OrderItemInput[];
  shippingAddress: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    country?: string;
  };
  paymentMethod: string;
}

export interface UpdateOrder {
  status?: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  shippingAddress?: {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}