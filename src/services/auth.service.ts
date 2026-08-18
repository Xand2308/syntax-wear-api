import { AuthRequest, RegisterRequest, UserResponse } from "../types";
import { prisma } from "../utils/prisma";
import { AppError } from "../middlewares/error.middleware";
import bcrypt from "bcrypt";

export const registerUser = async (
  payload: RegisterRequest,
): Promise<UserResponse> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError("Email já cadastrado.", 409);
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const rawBirthDate = payload.dateOfBirth ?? payload.birthDate;
  let parsedBirthDate: Date | undefined = undefined;
  if (rawBirthDate) {
    const d = new Date(rawBirthDate);
    if (!isNaN(d.getTime())) {
      parsedBirthDate = d;
    }
  }

  const newUser = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      cpf: payload.cpf,
      birthDate: parsedBirthDate,
      phone: payload.phone,
      role: "USER",
    },
  });

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const loginUser = async (data: AuthRequest): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError("Email ou senha inválidos.", 401);
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if (!isValidPassword) {
    throw new AppError("Email ou senha inválidos.", 401);
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
