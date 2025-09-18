'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[] = []
) => {
  const AuthComponent = (props: P) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return; // Do nothing while loading
      if (status === 'unauthenticated') {
        router.push('/login');
      } else if (session?.error === 'RefreshAccessTokenError') {
        signOut({ callbackUrl: '/login' });
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(session?.user?.role || '')) {
        router.push('/dashboard'); // Redirect if role is not allowed
      }
    }, [session, status, router]);

    if (status === 'loading' || !session) {
      return <LoadingSpinner />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
      return null; // Render nothing while redirecting
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;