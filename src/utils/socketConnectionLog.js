export const socketConnectionLog = () => {
  console.log('****************************')
  console.log('*    Socket Connected ')
  console.log(`*    FRONTEND_URL: ${process.env.FRONTEND_URL || 3000}`)
  console.log('****************************')
}
