import { FastifyInstance } from "fastify";

import {
  createNewProduct,
  getProduct,
  listProducts,
  updateExistingProduct,
  deleteExistingProduct,
} from "../controllers/products.controller";

export default async function productRoutes(fastify: FastifyInstance) {

  // =====================================================
  // GET /products
  // Listar produtos
  // =====================================================
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        description: "Lista produtos com filtros opcionais",

        querystring: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            minPrice: { type: "number" },
            maxPrice: { type: "number" },
            search: { type: "string" },
            categoryId: { type: "number" },
            sortBy: {
              type: "string",
              enum: ["price", "name", "createdAt"],
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    description: { type: "string" },
                    price: { type: "number" },

                    colors: {
                      type: "array",
                      items: { type: "string" },
                    },

                    sizes: {
                      type: "array",
                      items: { type: "string" },
                    },

                    images: {
                      type: "array",
                      items: { type: "string" },
                    },

                    slug: { type: "string" },
                    stock: { type: "number" },
                    active: { type: "boolean" },
                    categoryId: { type: "number" },
                    createdAt: { type: "string" },
                    updatedAt: { type: "string" },
                  },
                },
              },

              total: { type: "number" },
              page: { type: "number" },
              limit: { type: "number" },
              totalPages: { type: "number" },
            },
          },

          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },

    listProducts
  );

  // =====================================================
  // GET /products/:id
  // Buscar produto por ID
  // =====================================================
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Obter um produto pelo ID",

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "number",
              description: "ID do produto",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              description: { type: "string" },
              price: { type: "number" },

              colors: {
                type: "array",
                items: { type: "string" },
              },

              sizes: {
                type: "array",
                items: { type: "string" },
              },

              images: {
                type: "array",
                items: { type: "string" },
              },

              slug: { type: "string" },
              stock: { type: "number" },
              active: { type: "boolean" },
              categoryId: { type: "number" },

              createdAt: {
                type: "string",
                format: "date-time",
              },

              updatedAt: {
                type: "string",
                format: "date-time",
              },

              category: {
                type: "object",
                nullable: true,
                properties: {
                  id: { type: "number" },
                  name: { type: "string" },
                  slug: { type: "string" },
                },
              },
            },
          },

          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },

          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },

    getProduct
  );

  // =====================================================
  // POST /products
  // Criar produto
  // =====================================================
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Products"],
        description: "Criar um novo produto",

        body: {
          type: "object",
          required: [
            "name",
            "description",
            "price",
            "categoryId",
          ],

          properties: {
            name: {
              type: "string",
              description: "Nome do produto",
            },

            description: {
              type: "string",
              description: "Descrição do produto",
            },

            price: {
              type: "number",
              description: "Preço do produto",
            },

            categoryId: {
              type: "number",
              description: "ID da categoria",
            },

            stock: {
              type: "number",
              description: "Quantidade em estoque",
            },

            active: {
              type: "boolean",
              description: "Produto ativo",
            },

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
          201: {
            type: "object",
            properties: {
              message: { type: "string" },
              productId: { type: "number" },
            },
          },

          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },

          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },

          500: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },

    createNewProduct
  );

  // =====================================================
  // PUT /products/:id
  // Atualizar produto
  // =====================================================
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Atualizar produto",

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "number",
              description: "ID do produto",
            },
          },
        },

        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            categoryId: { type: "number" },
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
            type: "object",
          },

          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },

          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },

          500: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },

    updateExistingProduct
  );

  // =====================================================
  // DELETE /products/:id
  // Deletar produto
  // =====================================================
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Deletar um produto",

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "number",
              description: "ID do produto",
            },
          },
        },

        response: {
          // IMPORTANTE:
          // 200 permite retornar uma mensagem.
          200: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },

          404: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },

          500: {
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

    deleteExistingProduct
  );
}