import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { adminDb } from "./firebaseAdmin";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Save/update user in Firestore
      try {
        await adminDb.collection("users").doc(user.email!).set(
          {
            name: user.name,
            email: user.email,
            image: user.image,
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error("[Auth] Failed to save user:", e);
      }
      return true;
    },
    async session({ session }) {
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
