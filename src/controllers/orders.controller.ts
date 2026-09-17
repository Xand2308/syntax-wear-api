import { FastifyRequest, FastifyReply } from 'fastify'
import { orderFiltersSchema, createOrderSchema, updateOrderSchema } from '../utils/validators'
import { OrderFilters, CreateOrder, UpdateOrder } from '../types'
import { getOrders, getOrderById, createOrder, updateOrder, cancelOrder } from '../services/orders.service'

export async function listOrders(request: FastifyRequest, reply: FastifyReply) {
  const filters = orderFiltersSchema.parse(request.query as OrderFilters)
  const user = request.user as { id: number; role: string }
  const orders = await getOrders(filters, user.id, user.role === "ADMIN")
  reply.status(200).send(orders)
}

export async function getOrder(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const id = parseInt(request.params.id, 10)
  const user = request.user as { id: number; role: string }
  const requestingUserId = user.id
  const isAdmin = user.role === "ADMIN"

  const order = await getOrderById(id, requestingUserId, isAdmin)
  reply.status(200).send(order)
}

export async function createNewOrder(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { id: number }
  const data = createOrderSchema.parse({
    ...(request.body as CreateOrder),
    userId: user.id,
  })
  const order = await createOrder(data)
  reply.status(201).send({
    message: 'Pedido criado com sucesso',
    orderId: order.id,
  })
}

export async function updateExistingOrder(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = parseInt(request.params.id, 10)

  const user = request.user as { id: number; role: string }
  const requestingUserId = user.id
  const isAdmin = user.role === "ADMIN"

  const data = updateOrderSchema.parse(request.body as UpdateOrder)

  const order = await updateOrder(
    id,
    data,
    requestingUserId,
    isAdmin
  )

  reply.status(200).send(order)
}

export async function deleteExistingOrder(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = parseInt(request.params.id, 10)
  await cancelOrder(id)
  reply.status(200).send({
    message: 'Pedido cancelado com sucesso',
  })
}
