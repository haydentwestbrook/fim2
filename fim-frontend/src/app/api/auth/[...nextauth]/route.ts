import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

const nextAuth = NextAuth(authOptions);

export { nextAuth as GET, nextAuth as POST }
