import dotenv from 'dotenv-safe'
import { NODE_ENV } from '../constant/common.js'

const envFile = process.env.NODE_ENV === NODE_ENV.dev ? '.env.dev' : '.env'

export const envConfig = dotenv.config({ path: envFile })
