import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/prisma"


export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    await request.jwtVerify();


    // Extrair userId do token e buscar role de usuário

    const userId = (request.user as any).userId;
    if(!userId) {
      return reply.status(401).send({ message: "Token inválido. ID do usuário não encontrado."})
    }
    } catch (err) {
    return reply.status(401).send({ message: "Token inválido ou expirado" });
  }
};
