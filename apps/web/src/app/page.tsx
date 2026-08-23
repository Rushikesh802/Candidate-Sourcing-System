export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-6 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Phase 0 Initialized
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          Candidate Sourcing System
        </h1>
        <p className="text-slate-600 mb-8 max-w-lg mx-auto">
          Job Requisition, Public Posting & Candidate Application Platform.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-1">FastAPI Backend</h2>
            <p className="text-xs text-slate-500 mb-3">REST API service running with Pydantic & SQLAlchemy.</p>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              Open API Docs (/docs) &rarr;
            </a>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-1">Health Check</h2>
            <p className="text-xs text-slate-500 mb-3">Unified health endpoint proxied to FastAPI.</p>
            <a
              href="/health"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
            >
              Check Health (/health) &rarr;
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/jobs"
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-sm"
          >
            Explore Careers
          </a>
          <a
            href="/login"
            className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 transition"
          >
            Admin & Candidate Login
          </a>
        </div>
      </div>
    </main>
  );
}
