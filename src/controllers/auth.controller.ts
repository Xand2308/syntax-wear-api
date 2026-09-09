import { FastifyReply, FastifyRequest } from "fastify";
import {
  loginUser,
  loginWithGoogle,
  registerUser,
} from "../services/auth.service";
import { AuthRequest, RegisterRequest } from "../types";
import { loginSchema, registerSchema } from "../utils/validators";
import { request } from "node:http";

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

  if (!user) return;

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

export const profile = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(200).send({
    user: request.user,
  });
};

export const googleLogin = async (
  request: FastifyRequest<{ Body: { credential: string } }>,
  reply: FastifyReply,
) => {
  const { credential } = request.body;

  if (!credential) {
    reply.status(400).send({ message: "Credencial do Google é obrigatória." });
    return;
  }

  // Lógica de login com Google OAuth2
  const user = await loginWithGoogle(credential, reply);

  if (!user) return;

  const token = request.server.jwt.sign({ userId: user.id });

  reply.setCookie("syntaxwear.token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  reply.status(200).send({ user });
};

export const signOut = async (request: FastifyRequest, reply: FastifyReply) => {
  reply.clearCookie("syntaxwear.token",{
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })

  reply.status(200).send({ message: "Usuário deslogado com sucesso."})
}