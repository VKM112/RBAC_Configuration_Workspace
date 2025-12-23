import "express"

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
      }
      userId?: string
      userEmail?: string
      roles?: string[]
    }
  }
}

export {}
