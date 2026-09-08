import { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, registerUser } from "../services/auth.service";
import { AuthRequest, RegisterRequest } from "../types";
import { loginSchema, registerSchema } from "../utils/validators";

export const register = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const validation = registerSchema.parse(request.body as RegisterRequest);

  const user = await registerUser(validation);
  const token = request.server.jwt.sign({ userId: user.id });

  reply.status(201).send({
    user,
    token,
  });
};

export const login = async (
  request: FastifyRequest<{ Body: AuthRequest }>,
  reply: FastifyReply,
) => {
  const validation = loginSchema.parse(request.body as AuthRequest);

  const user = await loginUser(validation, reply);

  if (!user) return

  const token = request.server.jwt.sign({ userId: user.id });

  reply.setCookie("Syntaxwear.token", token, {
    httpOnly: true, // Não acessivel via JavaScript
    secure: process.env.NODE_ENV === "production", // Apenas em HTTPS no ambiente de produção
    sameSite: "lax", // Protege contra CSRF - Permite requisições de  navegação normais.
    path: "/", // Disponível em todo o site
    maxAge: 60 * 60 * 24, // 1 days
  });

  reply.status(200).send({
    user,
  });
};

export const profile = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply.status(200).send({
    user: request.user,
  });
};
