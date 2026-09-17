import Decimal from "decimal.js";
import { OrderFilters, CreateOrder, UpdateOrder } from "../types";
import { prisma } from "../utils/prisma";
import { OrderStatus } from "@prisma/client";

class OrderError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "OrderError";
  }
}

export async function getOrders(
  filters: OrderFilters = {},
  requestingUserId: number,
  isAdmin = false,
) {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (!isAdmin) {
    where.userId = requestingUserId
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.userId && isAdmin) {
    where.userId = filters.userId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrderById(
  id: number,
  requestingUserId: number,
  isAdmin: boolean,
) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          cpf: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error("Pedido não encontrado");
  }

  // Verificar se o usuário pode acessar o pedido 
  if (!isAdmin && order.userId !== requestingUserId) {
    throw new Error("Você não tem permissão para acessar este pedido!")
  }

  return order;
}

export async function createOrder(data: CreateOrder) {
  // 1. Buscar todos os produtos para validação
  const productIds = data.items.map((item) => item.productId);
  const uniqueProductIds = [...new Set(productIds)];
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds } },
    include: { category: true },
  });

  // 2. Validar que todos os produtos existem
  if (products.length !== uniqueProductIds.length) {
    const foundIds = products.map((p) => p.id);
    const missingIds = uniqueProductIds.filter((id) => !foundIds.includes(id));
    throw new OrderError(
      `Produto(s) com ID ${missingIds.join(", ")} não encontrado(s)`,
      404,
    );
  }

  let total = new Decimal(0)
  const orderItemData = data.items.map((item) => {
    const product = products.find(product => product.id === item.productId)!

    if (product?.stock < item.quantity) {
      throw new OrderError(
        `Estoque insuficiente para o produto ${product.name}`,
        409,
      )
    }

    const itemTotal = new Decimal(product.price).mul(item.quantity)
    total = total.add(itemTotal)

    return {
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      size: item.size,
    }
  })

  const shippingCost = new Decimal(data.shippingCost || 0)
  total = total.add(shippingCost)

  // transação atômica
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: data.userId,
        total,
        status: OrderStatus.PENDING,
        shippingAddress: JSON.parse(JSON.stringify(data.shippingAddress)),
        shippingCost,
        paymentMethod: data.paymentMethod,
        items: {
          create: orderItemData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          }))
        }
      },

      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true
              }
            }
          }
        }
      }
    })

    for (const item of orderItemData) {
      await tx.product.update({
        where: {
          id: item.productId
        },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    }

    return newOrder

  })

  return order
}


export async function updateOrder(
  id: number,
  data: UpdateOrder,
  requestingUserId: number,
  isAdmin: boolean
) {
  // Verificar se pedido existe
  const existingOrder = await prisma.order.findUnique({
    where: { id },
  });

  if (!existingOrder) {
    throw new Error("Pedido não encontrado");
  }
  if (!isAdmin && existingOrder.userId !== requestingUserId) {
    throw new Error("Você não tem permissão para atualizar este pedido!");
  }

  // Atualizar pedido
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status: data.status,
      shippingAddress: data.shippingAddress as any,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          cpf: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  return updatedOrder;
}

export async function cancelOrder(id: number) {
  // Verificar se pedido existe
  const existingOrder = await prisma.order.findUnique({
    where: { id },
  });

  if (!existingOrder) {
    throw new Error("Pedido não encontrado");
  }

  // Verificar se pedido já foi cancelado
  if (existingOrder.status === "CANCELLED") {
    throw new Error("Pedido já está cancelado");
  }

  // Verificar se pedido já foi entregue
  if (existingOrder.status === "DELIVERED") {
    throw new Error("Não é possível cancelar um pedido já entregue");
  }

  // Atualizar status para CANCELLED (sem reversão de estoque)
  const cancelledOrder = await prisma.order.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  return cancelledOrder;
}
