
export const isAuthenticated = async ({ jwt, set }: { jwt: any; set: any }) => {
  const payload = await jwt.verify()
  if (!payload) {
    set.status = 401
    return 'Unauthorized'
  }
  return payload
}