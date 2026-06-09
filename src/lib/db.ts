import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (process.env.NODE_ENV === 'production') {
    if (!url) {
      throw new Error('DATABASE_URL or POSTGRES_URL is missing in production environment. Database connection is required.');
    }
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('@base')) {
      throw new Error('DATABASE_URL cannot point to localhost, 127.0.0.1, or base in production environment.');
    }
  } else {
    if (!url) {
      // In dev, we used to fallback to localhost, but let's be strict to avoid confusion
      throw new Error('DATABASE_URL is missing. Please set it in your local .env file.');
    }
  }

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
