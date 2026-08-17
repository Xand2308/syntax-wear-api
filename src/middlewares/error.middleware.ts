import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export const errorHandler = (
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Erro de validação",
      errors: z.treeifyError(error),
    });
  }

  if ("code" in error && error.code === "FST_ERR_VALIDATION") {
    return reply.status(400).send({
      message: "Erro de validação (fastify)",
      errors: (error as FastifyError).validation,
    });
  }

  const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;

  if (statusCode >= 500) {
    request.log.error(error);
  }

  return reply.status(statusCode).send({
    message: statusCode >= 500 ? "Erro interno do servidor" : error.message,
    ...(process.env.NODE_ENV === "development" && { debug: error.message }),
  });
};