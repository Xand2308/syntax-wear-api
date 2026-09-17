import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
	if(error instanceof ZodError){
		return reply.status(400).send({
			message: "Erro de validação (zod)",
			errors: z.treeifyError(error),
		});
	}

	if(error.code === "FST_ERR_VALIDATION"){
		return reply.status(400).send({
			message: "Erro de validação (fastify)",
			errors: error.validation,
		});
	}



	console.error("ERRO REAL:", error);

	const isDevelopment = process.env.NODE_ENV !== "production";
	return reply.status(error.statusCode && error.statusCode >= 400 ? error.statusCode : 500).send({
		message: isDevelopment ? error.message : "Erro interno do servidor",
		...(isDevelopment ? { debug: error.message } : {}),
	});
}