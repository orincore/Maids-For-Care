'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { colors, colorStyles } from '@/lib/colors';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary[950] }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.background.secondary }}>
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => router.push('/')} className="inline-block hover:opacity-90 transition-opacity">
            <img src="/logo/MFC_logo-bg.png" alt="Maids For Care" className="h-20 w-auto mx-auto" />
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold" style={colorStyles.textPrimary}>Welcome Back</h2>
            <p className="mt-1.5 text-sm" style={colorStyles.textSecondary}>
              Sign in to book professional home services
            </p>
          </div>

          {/* Google Sign-in */}
          <button
            onClick={() => signIn('google')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            style={{ backgroundColor: '#ffffff', borderColor: '#dadce0', color: '#3c4043' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white" style={colorStyles.textTertiary}>or</span>
            </div>
          </div>

          <div className="text-center text-sm" style={colorStyles.textSecondary}>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => router.push('/auth/register')}
              className="font-semibold underline underline-offset-2 transition-colors"
              style={colorStyles.textPrimary}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.secondary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.primary}
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Footer link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-sm transition-colors"
            style={colorStyles.textSecondary}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}