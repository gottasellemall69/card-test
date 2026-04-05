export default function LogoutPage() {
    return (
        <main className="login relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
            <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.84)),radial-gradient(circle_at_center,rgba(248,113,113,0.16),transparent_30%)]"
                aria-hidden="true"
            />
            <div className="relative z-10 w-full max-w-2xl rounded-[2.25rem] border border-white/15 bg-slate-950/72 px-6 py-12 text-center text-white shadow-[0_30px_80px_-45px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:px-10">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">Session Ended</p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">You Have Been Logged Out</h1>
            </div>
        </main>
    );
}

LogoutPage.getLayout = ( page ) => page;
