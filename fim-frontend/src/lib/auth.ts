import type { Account, Session, User as NextAuthUser } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { AdapterUser } from 'next-auth/adapters';

interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

interface LoginResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: 'RefreshAccessTokenError';
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  let refreshedTokens: RefreshTokenResponse | undefined = undefined;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    refreshedTokens = (await response.json()) as RefreshTokenResponse;

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + refreshedTokens.expiresIn * 1000,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    console.error('Refresh token API response (if available):', JSON.stringify(refreshedTokens));
    return { ...token, error: 'RefreshAccessTokenError' as const };
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        let user: LoginResponse | undefined = undefined;
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          user = (await response.json()) as LoginResponse;

          if (response.ok && user) {
            return {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              accessToken: user.accessToken,
              refreshToken: user.refreshToken,
              accessTokenExpires: Date.now() + user.expiresIn * 1000,
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error('Login error:', error);
          console.error('Login API response (if available):', JSON.stringify(user));
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user: NextAuthUser | AdapterUser; account?: Account | null | undefined }) {
      // Initial sign in
      if (account && user) {
        return {
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.user = {
        id: token.id,
        email: token.email,
        firstName: token.firstName,
        lastName: token.lastName,
        role: token.role,
      };
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.error = token.error as 'RefreshAccessTokenError' | undefined;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

