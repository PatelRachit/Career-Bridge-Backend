import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const LOGS_DIR = path.join(__dirname, '..', '..', 'logs')

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR)
}

export const LOG_DIR = {
  ERROR_LOG_DIR: path.join(LOGS_DIR, 'error'),
  INFO_LOG_DIR: path.join(LOGS_DIR, 'info'),
}
