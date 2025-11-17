import { NODE_ENV } from '../../constant/index.js'
import { devLogger } from './development.logger.js'
import { productionLogger } from './production.logger.js'

const initLogger = () => {
  if (process.env.NODE_ENV !== NODE_ENV.dev) {
    return devLogger()
  }

  return productionLogger()
}

const logger = initLogger()

export default logger
