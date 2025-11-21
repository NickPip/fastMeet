import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  // Vercel Postgres provides POSTGRES_PRISMA_URL (optimized for Prisma) or POSTGRES_URL
  // Fall back to DATABASE_URL for backwards compatibility
  const databaseUrl = 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Database URL not found. Please set POSTGRES_PRISMA_URL, POSTGRES_URL, or DATABASE_URL in your environment variables."
    );
  }

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Reuse connection in all environments to prevent connection pool exhaustion
  globalForPrisma.prisma = prisma;

  return prisma;
}

// Lazy initialization wrapper to prevent module load failures
let prismaInstance: PrismaClient | null = null;
let initializationError: Error | null = null;

function getPrisma(): PrismaClient {
  if (initializationError) {
    throw initializationError;
  }
  
  if (!prismaInstance) {
    try {
      prismaInstance = getPrismaClient();
    } catch (error) {
      initializationError = error instanceof Error ? error : new Error(String(error));
      throw initializationError;
    }
  }
  
  return prismaInstance;
}

// Export a proxy that lazily initializes Prisma
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = (client as any)[prop];
    
    // If it's a function, bind it to the client
    if (typeof value === "function") {
      return value.bind(client);
    }
    
    return value;
  },
});

