import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "./db";

// Import User model dynamically to avoid issues
async function getUserModel() {
  const { default: User } = await import("@/models/User");
  return User;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo mode: allow hardcoded credentials
        const demoUsers = [
          {
            id: "admin001",
            name: "Dr. Sunway Admin",
            email: "admin@sunwayglobalschool.edu",
            password: "admin123",
            role: "admin",
            avatar: "",
          },
          {
            id: "staff001",
            name: "Mrs. Lakshmi Priya",
            email: "staff@sunwayglobalschool.edu",
            password: "staff123",
            role: "staff",
            avatar: "",
          },
          {
            id: "parent001",
            name: "Mr. Rajesh Kumar",
            email: "parent@sunwayglobalschool.edu",
            password: "parent123",
            role: "parent",
            avatar: "",
          },
        ];

        const demoUser = demoUsers.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (demoUser) {
          return {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
          };
        }

        // Production: check MongoDB
        try {
          await connectDB();
          const User = await getUserModel();
          const user = await User.findOne({ email: credentials.email }).select("+password");

          if (!user) return null;
          if (!user.isActive) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch {
          // If DB not connected, only demo users work
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "praba-school-secret",
};

export default authOptions;
