
export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10
  })
}

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await Bun.password.verify(password, hash)
}