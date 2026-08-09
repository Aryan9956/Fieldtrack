import Link from 'next/link';

export default function AccessPendingPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="glass-card py-10 px-6 shadow-2xl rounded-2xl border border-amber-500/20 space-y-5">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl border border-amber-500/30">
            ⏳
          </div>
          <h2 className="text-2xl font-bold text-white">Account Approval Pending</h2>
          <p className="text-sm text-surface-300 leading-relaxed">
            Your email is verified! However, your FieldTrack organization account is currently{' '}
            <strong className="text-amber-400">awaiting administrator approval</strong>.
          </p>
          <div className="bg-surface-900/80 p-4 rounded-xl border border-surface-800 text-xs text-surface-400 text-left space-y-2">
            <div className="flex items-center gap-2 text-surface-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Email Status: Verified
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Access Status: PENDING
            </div>
            <p className="text-[11px] pt-1 border-t border-surface-800 text-surface-400">
              Super Admin must review and grant access (specifying duration & employee limits) before you can enter the manager dashboard.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold rounded-lg border border-surface-700"
            >
              Back to Login
            </Link>
            <a
              href="mailto:admin@fieldtrack.com"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-lg"
            >
              Contact Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
