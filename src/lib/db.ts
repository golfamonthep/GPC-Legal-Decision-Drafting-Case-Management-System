import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://offline:offline@127.0.0.1:5432/offline';

  if (url.startsWith('prisma+postgres://')) {
    return new PrismaClient({
      accelerateUrl: url,
    });
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
