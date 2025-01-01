import { jwt } from '@elysiajs/jwt'

export const isAuthenticated = async ({ jwt, set, request }: { jwt: any; set: any; request: any }) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401
    return { message: 'Unauthorized: No token provided' }
  }

  const token = authHeader.split(' ')[1]
  const payload = await jwt.verify(token)

  if (!payload) {
    set.status = 401
    return { message: 'Unauthorized: Invalid token' }
  }

  return payload
}