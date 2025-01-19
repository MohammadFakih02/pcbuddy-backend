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

export const validatePassword = (password:string)=> {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long'
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter'
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter'
  }
  if (!hasNumber) {
    return 'Password must contain at least one number'
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character'
  }
  return null
}