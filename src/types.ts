export type User = {
  id: string
  email: string
}

export type Permission = {
  id: string
  name: string
  description: string
  createdAt: string
}

export type Role = {
  id: string
  name: string
  createdAt: string
  permissionCount?: number
}