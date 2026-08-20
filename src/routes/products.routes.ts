import { FastifyInstance } from "fastify";
import {
  listProducts,
  getProduct,
  createNewProduct,
  updateExistingProduct,
  deleteExistingProduct,
} from "../controllers/products.controller";
import { boolean } from "zod";
import { authenticate } from "../middlewares/auth.middlewares";

export default async function productRoutes(fastify: FastifyInstance) {
  // Listar produtos
  fastify.addHook("onRequest",authenticate);
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        summary: "Listar produtos",
        description:
          "Lista de produtos com filtros opcionais, ordenação e paginação",

        querystring: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              minimum: 1,
              description: "Número da página",
            },
            limit: {
              type: "integer",
              minimum: 1,
              description: "Quantidade de itens por página",
            },
            minPrice: {
              type: "number",
              minimum: 0,
              description: "Preço mínimo",
            },
            maxPrice: {
              type: "number",
              minimum: 0,
              description: "Preço máximo",
            },
            search: {
              type: "string",
              description: "Termo de busca",
            },
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
      },
    },
    listProducts,
  );

  // Buscar produto por ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        summary: "Buscar produto por ID",
        description: "Retorna um produto específico pelo seu ID",

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "integer",
              minimum: 1,
              description: "ID do produto",
            },
          },
        },

        response: {
          200: {
            description: "Produto encontrado",
            type: "object",

            properties: {
              id: {
                type: "integer",
                description: "ID do produto",
              },

              name: {
                type: "string",
                description: "Nome do produto",
              },

              slug: {
                type: "string",
                description: "Slug único do produto",
              },

              description: {
                type: ["string", "null"],
                description: "Descrição do produto",
              },

              price: {
                type: "number",
                description: "Preço do produto",
              },

              colors: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Cores disponíveis do produto",
              },

              stock: {
                type: "integer",
                description: "Quantidade disponível em estoque",
              },

              sizes: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Tamanhos disponíveis do produto",
              },

              image: {
                type: ["string", "null"],
                description: "Imagem principal do produto",
              },

              createdAt: {
                type: "string",
                format: "date-time",
                description: "Data de criação",
              },

              active: {
                type: "boolean",
                description: "Indica se o produto está ativo",
              },

              updatedAt: {
                type: "string",
                format: "date-time",
                description: "Data da última atualização",
              },
            },
          },

          400: {
            description: "Requisição inválida",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },

          404: {
            description: "Produto não encontrado",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },

          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },

          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },
    getProduct,
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Products"],
        description: "Criar um novo produto",
        required: ["name", "description", "price", "slug", "active", "stock"],
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            active: { type: "boolean" },
            stock: { type: "number" },
            colors: {
              type: "array",
              items: { type: "string" },
            },

            image: {
              type: "array",
              items: { type: "string" },
            },

            sizes: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
    createNewProduct,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Atualizar produto",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID do produto" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            active: { type: "boolean" },
            stock: { type: "number" },
            colors: {
              type: "array",
              items: { type: "string" },
            },
            images: {
              type: "array",
              items: { type: "string" },
            },
            sizes: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        response: {
          200: {
            description: "Produto atualizado",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string", nullable: true },
              price: { type: "number" },
              color: { type: "string", nullable: true },
              stock: { type: "integer" },
              tags: { type: "array", items: { type: "string" } },
            },
          },
          400: {
            description: "Erro de validação",
            type: "object",
            properties: {
              error: { type: "string" },
              details: { type: "array", nullable: true },
            },
          },
          404: {
            description: "Produto não encontrado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: {
            description: "Não autenticado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    updateExistingProduct,
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Deletar um produto",
        params: {
          type: "object",
          properties: {
            id: { type: "number", description: "ID do produto" },
          },
          required: ["id"],
        },
        response: {
          204: {
            description: "Produto deletado com sucesso",
            type: "null",
          },
          404: {
            description: "Produto não encontrado",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    deleteExistingProduct,
  );
}
