import { FastifyInstance } from "fastify"
import { prisma } from "../../lib/prisma"
import z from "zod"
import { redis } from "../../lib/redis"

export async function getPoll(app: FastifyInstance) {
  app.get('/polls/:postId', async (request, reply) => {
    const getPollParams = z.object({
      postId: z.string().uuid()
    })
  
    const { postId } = getPollParams.parse(request.params)
  
    const poll = await prisma.poll.findUnique({
      where: {
        id: postId
      },
      include: {
        options: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if(!poll) {
      return reply.status(400).send({message: 'Enquete não encontrada!'})
    }

    const result = await redis.zrange(postId, 0, -1, 'WITHSCORES')

    const votes = result.reduce((obj, line, index) => {
      if(index % 2 === 0) {
        const score = result[index + 1]

        Object.assign(obj, { [line]: score})
      }

      return obj
    }, {} as Record<string, number>)
  
    return reply.send({ 
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map(option => {
          return {
            id: option.id,
            title: option.title,
            score: (option.id in votes) ? votes[option.id] : 0,
          }
        })
      }
     })
  })
}