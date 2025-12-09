import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

// Create a custom adapter to map Customer model to User
const adapter = {
  createUser: (data: any) => prisma.customer.create({ data }),
  getUser: (id: string) => prisma.customer.findUnique({ where: { id } }),
  getUserByEmail: (email: string) => prisma.customer.findUnique({ where: { email } }),
  getUserByAccount: ({ providerAccountId, provider }: any) => 
    prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      select: { user: true }
    }).then(account => account?.user ?? null),
  updateUser: ({ id, ...data }: any) => 
    prisma.customer.update({ where: { id }, data }),
  deleteUser: (id: string) => prisma.customer.delete({ where: { id } }),
  linkAccount: (data: any) => prisma.account.create({ data }),
  unlinkAccount: ({ providerAccountId, provider }: any) => 
    prisma.account.delete({
      where: { provider_providerAccountId: { provider, providerAccountId } }
    }),
  createSession: (data: any) => prisma.session.create({ data }),
  getSessionAndUser: (sessionToken: string) =>
    prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    }),
  updateSession: ({ sessionToken, ...data }: any) => 
    prisma.session.update({ where: { sessionToken }, data }),
  deleteSession: (sessionToken: string) => 
    prisma.session.delete({ where: { sessionToken } }),
  createVerificationToken: (data: any) => 
    prisma.verificationToken.create({ data }),
  useVerificationToken: ({ identifier, token }: any) => 
    prisma.verificationToken.delete({ where: { identifier_token: { identifier, token } } })
}

export const authOptions: NextAuthOptions = {
  adapter: adapter as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Include user ID in session
      session.user.id = user.id
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow all sign-ins for now
      // You can add custom logic here to restrict access
      return true
    },
  },
  pages: {
    signIn: '/student/login',
    error: '/student/login',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
}