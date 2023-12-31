import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { sendMailQueue } from '@/queues/send-mail-queue'
import { UserAlreadyExistsError } from '@/use-cases/errors/user-already-exists-error'
import { makeRegisterUseCase } from '@/use-cases/factories/make-register-use-case'

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const registerBodySchema = z.object({
    name: z.string().nonempty(),
    email: z.string().email(),
    password: z.string().min(6),
  })

  const { name, email, password } = registerBodySchema.parse(request.body)

  try {
    const useCase = makeRegisterUseCase()

    await useCase.execute({
      name,
      email,
      password,
    })

    await sendMailQueue.add({
      name,
      email,
    })

    return reply.status(201).send()
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return reply.status(409).send({
        message: error.message,
      })
    }

    throw error
  }
}
