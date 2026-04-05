import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function RegisterPage() {
  const [ username, setUsername ] = useState( "" );
  const [ password, setPassword ] = useState( "" );
  const [ confirmPassword, setConfirmPassword ] = useState( "" );
  const [ error, setError ] = useState( null );
  const [ success, setSuccess ] = useState( null );
  const router = useRouter();

  const handleSubmit = async ( e ) => {
    e.preventDefault();
    setError( null );
    setSuccess( null );

    if ( !username || !password || !confirmPassword ) {
      setError( "All fields are required." );
      return;
    }

    if ( password !== confirmPassword ) {
      setError( "Passwords do not match." );
      return;
    }

    try {
      const response = await fetch( `/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( { username, password } ),
      } );

      const data = await response.json();

      if ( response.ok ) {
        setSuccess( "Registration successful! Redirecting to login..." );
        setTimeout( () => {
          router.push( "/login" );
        }, 500 );
      } else {
        setError( data.error || "Registration failed. Please try again." );
      }
    } catch ( err ) {
      setError( "An unexpected error occurred." );
    }
  };

  return (
    <main className="login relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.22),rgba(2,6,23,0.84)),radial-gradient(circle_at_bottom,rgba(251,191,36,0.18),transparent_36%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/15 bg-slate-950/72 p-6 text-white shadow-[0_30px_80px_-45px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">Create Account</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Register</h1>
          <p className="text-sm leading-6 text-slate-300">
            Save your collection and return to the cards you care about without rebuilding your list each visit.
          </p>
          <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm italic text-amber-100/90">
            Please remember your password. There is no password recovery system in place.
          </p>
        </div>

        <form
          id="reg-form"
          onSubmit={ handleSubmit }
          className="space-y-5"
        >
          { error && <p className="rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">{ error }</p> }
          { success && <p className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{ success }</p> }
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/85">
              Username
            </label>
            <input
              id="reg-name"
              type="text"
              value={ username }
              onChange={ ( e ) => setUsername( e.target.value ) }
              className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/35"
              required={ true }
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/85">
              Password
            </label>
            <input
              id="reg-pass"
              type="password"
              value={ password }
              onChange={ ( e ) => setPassword( e.target.value ) }
              className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/35"
              required={ true }
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/85">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              type="password"
              value={ confirmPassword }
              onChange={ ( e ) => setConfirmPassword( e.target.value ) }
              className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/35"
              required={ true }
            />
          </div>
          <button
            id="reg-button"
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-200">
          Already have an account?{ " " }
          <Link
            href="/login"
            className="font-semibold text-amber-300 underline decoration-amber-300/50 underline-offset-4 hover:text-amber-200"
          >
            Log in here
          </Link>
        </p>
      </div>
    </main>
  );
}

RegisterPage.getLayout = ( page ) => page;
