import { boolean } from "zod";

export interface ProductFilters {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "price" | "name" | "createdAt";
  sortOrder?: "asc" | "desc";
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
  image?: string[];
}