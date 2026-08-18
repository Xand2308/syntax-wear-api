import { FastifyInstance } from "fastify";
import { login, register } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Registrar usuário",
        description: "Registra um novo usuário e retorna um token JWT",
        body: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: {
              type: "string",
              description: "Primeiro nome do usuário",
              examples: ["João"],
            },
            lastName: {
              type: "string",
              description: "Sobrenome do usuário",
              examples: ["Silva"],
            },
            email: {
              type: "string",
              format: "email",
              description: "Email do usuário",
              examples: ["joao.silva@exemplo.com"],
            },
            password: {
              type: "string",
              minLength: 6,
              description: "Senha de acesso",
              examples: ["senhaSegura123"],
            },
            cpf: {
              type: "string",
              description: "CPF do usuário (opcional)",
              examples: ["123.456.789-00"],
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Data de nascimento (opcional)",
              examples: ["1995-05-20"],
            },
            phone: {
              type: "string",
              description: "Telefone de contato (opcional)",
              examples: ["11999999999"],
            },
          },
        },
        response: {
          201: {
            description: "Usuário criado com sucesso e autenticado",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                  role: { type: "string" },
                },
              },
              token: { type: "string" },
            },
          },
        },
      },
    },
    register,
  );

  fastify.post("/login", {
    schema: {
      tags: ["Auth"],
      summary: "Login de usuário",
      description: "Autentica um usuário e retorna um token JWT",
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "Email do usuário",
          },
          password: {
            type: "string",
            minLength: 6,
            description: "Senha do usuário",
          },
        },
      },
      response: {
        200: {
          description: "Usuário autenticado com sucesso",
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                id: { type: "integer" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
              },
            },
            token: { type: "string" },
          },
        },
      },
    },
    handler: login,
  });
}
