import { FastifyInstance } from "fastify";
import { listProducts } from "../controllers/products.controller";

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        summary: "Listar produtos",
        description: "Lista de produtos com filtros opcionais (busca, preço, ordenação e paginação)",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, description: "Número da página" },
            limit: { type: "integer", minimum: 1, description: "Quantidade de itens por página" },
            minPrice: { type: "number", minimum: 0, description: "Preço mínimo" },
            maxPrice: { type: "number", minimum: 0, description: "Preço máximo" },
            search: { type: "string", description: "Termo de busca (nome ou descrição)" },
            sortBy: {
              type: "string",
              enum: ["price", "name", "createdAt"],
              description: "Campo para ordenação",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Direção da ordenação",
            },
          },
        },
        response: {
          200: {
            description: "Lista de produtos retornada com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                description: { type: ["string", "null"] },
                price: { type: "number" },
                stock: { type: "integer" },
                image: { type: ["string", "null"] },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
    listProducts,
  );
}
