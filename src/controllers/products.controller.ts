import { FastifyReply, FastifyRequest } from "fastify";
import { CreateProduct, ProductFilters } from "../types";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/products.service";

import {
  createProductSchema,
  deleteProductSchema,
  productFiltersSchema,
  updateProductSchema,
} from "../utils/validators";
import slugify from "slugify";
import { request } from "node:http";
import { partial } from "zod/mini";

export const listProducts = async (
  request: FastifyRequest<{ Querystring: ProductFilters }>,
  reply: FastifyReply,
) => {
  const filters = productFiltersSchema.parse(request.query);

  const result = await getProducts(filters as ProductFilters);

  reply.status(200).send(result);
};

export const getProduct = async (
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply,
) => {
  const product = await getProductById(request.params.id);

  reply.status(200).send(product);
};

export const createNewProduct = async (
  request: FastifyRequest<{ Body: CreateProduct }>,
  reply: FastifyReply,
) => {
  const body = request.body;

  body.slug = slugify(body.name, {
    lower: true,
    strict: true,
    locale: "pt",
  });

  const validate = createProductSchema.parse(body);

  const product = await createProduct(validate);

  reply.status(201).send({ message: "Produto criado com sucesso!" });
};

export const updateExistingProduct = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: Partial<CreateProduct>;
  }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const body = request.body;

  const validate = updateProductSchema.parse(body);

  if (validate.name) {
    validate.slug = slugify(validate.name, {
      lower: true,
      strict: true,
      locale: "pt",
    });
  }

  const product = await updateProduct(Number(id), validate);
  reply.status(200).send(product);
};

export const deleteExistingProduct = async (
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = request.params;

    const validade = deleteProductSchema.parse({ id });

    await deleteProduct(validade.id);

    return reply.status(200).send({
      message: "Produto deletado com sucesso!",
    });
  } catch (error) {
    console.error("ERRO AO DELETAR PRODUTO:", error);

    return reply.status(500).send({
      message: "Erro ao deletar produto",
      debug: error instanceof Error ? error.message : String(error),
    });
  }
};