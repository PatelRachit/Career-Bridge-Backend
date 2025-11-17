import { SOCKET_LISTEN_MESSAGE } from '../constant/index.js'
import { getInitialOrders } from '../controller/order/getInitialOrders.js'

export const listenSocketMessage = (socket) => {
  socket.on(SOCKET_LISTEN_MESSAGE.FETCH_INITIAL_ORDERS, (data) => {
    console.log(socket.user)
    getInitialOrders(socket)
  })
}
