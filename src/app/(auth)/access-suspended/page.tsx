import Link from 'next/link';

export default function AccessSuspendedPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="glass-card py-10 px-6 shadow-2xl rounded-2xl border border-orange-500/20 space-y-5">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center mx-auto text-3xl border border-orange-500/30">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-white">Account Suspended</h2>
          <p className="text-sm text-surface-300 leading-relaxed">
            Your FieldTrack account has been temporarily suspended by the platform administrator.
          </p>
          <div className="bg-surface-900/80 p-4 rounded-xl border border-surface-800 text-xs text-surface-400 text-left">
            <span className="text-orange-400 font-semibold block mb-1">Access Status: SUSPENDED</span>
            <p>Please reach out to administration to resolve any outstanding compliance or account issues.</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold rounded-lg border border-surface-700"
            >
              Sign In
            </Link>
            <a
              href="mailto:admin@fieldtrack.com"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow-lg"
            >
              Contact Administrator
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
