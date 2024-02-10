import { FastifyInstance } from "fastify";
import { voting } from "../../utils/voting-pub-sub";
import z from "zod";


export async function pollResults(app: FastifyInstance) {
  app.get('/polls/:pollId/results', { websocket: true }, (connection, request) => {
    const getPollParams = z.object({
      postId: z.string().uuid()
    })

    const { postId } = getPollParams.parse(request.params)
    
    voting.subscribe(postId, (message) => {
      connection.socket.send(JSON.stringify(message))
    })
  })
}