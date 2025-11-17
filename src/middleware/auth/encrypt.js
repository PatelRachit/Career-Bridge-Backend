import * as crypto from 'crypto'

const algorithm = 'aes-128-cbc'
const secret = process.env.JWT_SECRET || ''

const key = crypto.scryptSync(secret, 'salt', 16)
const iv = Buffer.alloc(16, 0) // Initialization crypto vector

const encrypt = (text) => {
  try {
    const cipher = crypto.createCipheriv(algorithm, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  } catch (error) {
    // Handle encryption error
    console.error('Encryption error:', error)
    throw error // Propagate the error or handle it according to your needs
  }
}

export { encrypt }
