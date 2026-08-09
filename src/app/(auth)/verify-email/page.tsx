'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [verifying, setVerifying] = useState(!!token);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');
  const [devEmails, setDevEmails] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      handleVerifyToken(token);
    }
  }, [token]);

  useEffect(() => {
    fetchDevEmails();
  }, []);

  const fetchDevEmails = async () => {
    try {
      const res = await fetch('/api/dev/emails');
      if (res.ok) {
        const data = await res.json();
        setDevEmails(data.emails || []);
      }
    } catch (e) {}
  };

  const handleVerifyToken = async (verifyToken: string) => {
    setVerifying(true);
    setStatus('IDLE');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('ERROR');
        setMessage(data.error || 'Verification failed');
      } else {
        setStatus('SUCCESS');
        setMessage(data.message || 'Email verified successfully!');
        setTimeout(() => {
          router.push('/access-pending');
        }, 2000);
      }
    } catch (err) {
      setStatus('ERROR');
      setMessage('Failed to connect to verification server');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mt-8 glass-card py-8 px-6 shadow-2xl rounded-2xl border border-surface-800 text-center">
      {verifying ? (
        <div className="py-8 space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="text-lg font-semibold text-surface-100">Verifying your email token...</h3>
          <p className="text-sm text-surface-400">Please wait while we confirm your email address.</p>
        </div>
      ) : status === 'SUCCESS' ? (
        <div className="py-6 space-y-4">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl border border-emerald-500/30">
            ✓
          </div>
          <h3 className="text-xl font-bold text-white">Email Verified Successfully!</h3>
          <p className="text-sm text-surface-300">
            {message} Next, your account will be reviewed by the Super Administrator for access approval.
          </p>
          <div className="pt-2">
            <Link
              href="/access-pending"
              className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg shadow-lg"
            >
              View Approval Status
            </Link>
          </div>
        </div>
      ) : status === 'ERROR' ? (
        <div className="py-6 space-y-4">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl border border-red-500/30">
            ✕
          </div>
          <h3 className="text-xl font-bold text-white">Verification Failed</h3>
          <p className="text-sm text-red-300">{message}</p>
          <Link href="/login" className="inline-block text-xs text-brand-400 font-semibold hover:underline">
            Return to Login
          </Link>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <div className="w-12 h-12 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto text-xl border border-brand-500/30">
            📧
          </div>
          <h3 className="text-xl font-bold text-surface-100">Verify Your Email Address</h3>
          <p className="text-sm text-surface-300">
            We sent a verification email to{' '}
            <strong className="text-brand-300">{emailParam || 'your registered email'}</strong>.
          </p>
          <p className="text-xs text-surface-400">
            Please click the link inside the email to complete verification.
          </p>
        </div>
      )}

      {devEmails.length > 0 && (
        <div className="mt-8 pt-6 border-t border-surface-800 text-left">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              ⚡ Local Dev Email Console ({devEmails.length})
            </span>
            <button
              type="button"
              onClick={fetchDevEmails}
              className="text-[11px] text-surface-400 hover:text-white underline"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {devEmails.map((emailItem) => (
              <div
                key={emailItem.id}
                className="p-3 bg-surface-900 border border-surface-700 rounded-lg text-xs space-y-1"
              >
                <div className="flex justify-between text-surface-300 font-semibold">
                  <span>To: {emailItem.to}</span>
                  <span className="text-[10px] text-surface-500">
                    {new Date(emailItem.sentAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-surface-400 truncate">{emailItem.subject}</p>
                {emailItem.verificationLink && (
                  <a
                    href={emailItem.verificationLink}
                    className="inline-block mt-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/30 font-semibold text-[11px] transition-all"
                  >
                    🔗 Click Dev Verification Link
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
            F
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Field<span className="text-brand-400">Track</span>
          </span>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-surface-400 text-xs">Loading verification form...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
