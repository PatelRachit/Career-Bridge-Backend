import { io } from '../../app.js'

export const emitSocketMessage = (message, payload) => {
  return io.emit(message, payload)
}
