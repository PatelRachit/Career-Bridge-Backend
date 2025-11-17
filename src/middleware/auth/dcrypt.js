import crypto from 'crypto'

const secret = process.env.JWT_SECRET
const algorithm = 'aes-128-cbc'

// 32 bytes (256 bits).
const key = crypto.scryptSync(secret, 'salt', 16)
const iv = Buffer.alloc(16, 0) // Initialization crypto vector

/**
 * Decrypts text
 */
const decrypt = (text = '') => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv)

  try {
    let decrypted = decipher.update(text, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    return err
  }
}

export { decrypt }
