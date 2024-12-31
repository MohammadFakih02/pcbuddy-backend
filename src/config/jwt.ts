import { env } from './env'

export const JWT_CONFIG = {
  secret: env.JWT_SECRET,
  accessTokenExp: env.JWT_ACCESS_EXPIRES_IN,
  refreshTokenExp: env.JWT_REFRESH_EXPIRES_IN
}