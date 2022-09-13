import type { PrismaClient } from '@prisma/client'

export interface DBEnv {
  prismaClient: PrismaClient
}
export interface ServerEnv extends DBEnv {}
