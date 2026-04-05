import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";
import { dispatchAuthStateChange } from "@/utils/authState";

const DEFAULT_REDIRECT_PATH = "/yugioh/my-collection";
const LOCALHOST_FALLBACK_ORIGIN = "http://localhost:3000";

const getBaseOrigin = () => {
  if ( typeof window !== "undefined" && window.location?.origin ) {
    return window.location.origin;
  }

  if ( process.env.NEXT_PUBLIC_APP_URL ) {
    try {
      return new URL( process.env.NEXT_PUBLIC_APP_URL ).origin;
    } catch {
      // Ignore invalid NEXT_PUBLIC_APP_URL values and fall back to localhost.
    }
  }

  return LOCALHOST_FALLBACK_ORIGIN;
};

const BLOCKED_PATHS = new Set( [ "/login", "/register", "/api", "/api/auth/login", "/api/auth/register" ] );

const resolveRedirectPath = ( queryParam ) => {
  if ( typeof queryParam !== "string" ) {
    return DEFAULT_REDIRECT_PATH;
  }

  const trimmed = queryParam.trim();

  if ( !trimmed ) {
    return DEFAULT_REDIRECT_PATH;
  }

  // Reject protocol-relative, absolute URLs to other origins, and javascript: style values early.
  if ( /^([a-zA-Z][a-zA-Z\d+\-.]*:)?\/\//.test( trimmed ) ) {
    return DEFAULT_REDIRECT_PATH;
  }

  const relativePath = trimmed.startsWith( "/" ) ? trimmed : `/${ trimmed }`;

  try {
    const baseOrigin = getBaseOrigin();
    const candidate = new URL( relativePath, baseOrigin );

    if ( candidate.origin !== baseOrigin ) {
      return DEFAULT_REDIRECT_PATH;
    }

    const { pathname } = candidate;

    if ( BLOCKED_PATHS.has( pathname ) || pathname.startsWith( "/api" ) ) {
      return DEFAULT_REDIRECT_PATH;
    }

    const safePath = `${ pathname }${ candidate.search }${ candidate.hash }`.trim();
    return safePath || DEFAULT_REDIRECT_PATH;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
};

export default function LoginPage() {
  const [ username, setUsername ] = useState( "" );
  const [ password, setPassword ] = useState( "" );
  const [ error, setError ] = useState( null );
  const [ isSubmitting, setIsSubmitting ] = useState( false );
  const router = useRouter();

  const handleSubmit = async ( e ) => {
    e.preventDefault();

    if ( isSubmitting ) {
      return;
    }

    setError( null );

    const trimmedUsername = username.trim();

    if ( !trimmedUsername || !password ) {
      setError( "Username and password are required." );
      return;
    }

    setIsSubmitting( true );

    try {
      const response = await fetch( `/api/auth/login`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( { username: trimmedUsername, password } ),
      } );

      let data = null;
      const contentType = response.headers.get( "Content-Type" ) || "";

      if ( contentType.includes( "application/json" ) ) {
        try {
          data = await response.json();
        } catch {
          // Non-JSON response, keep data as null.
        }
      }

      if ( response.ok ) {
        dispatchAuthStateChange( true );
        const rawFromParam = Array.isArray( router.query?.from )
          ? router.query?.from[ 0 ]
          : router.query?.from;
        const decodedFromParam =
          typeof rawFromParam === "string" ? decodeURIComponent( rawFromParam ) : rawFromParam;
        const redirectTarget = resolveRedirectPath( decodedFromParam );

        if ( typeof window !== "undefined" ) {
          window.location.assign( redirectTarget );
        } else {
          await router.push( redirectTarget );
        }
      } else {
        setError( data?.error || "Login failed. Please try again." );
      }
    } catch ( err ) {
      setError( "An unexpected error occurred. Please try again later." );
    } finally {
      setIsSubmitting( false );
    }
  };

  return (
    <main className="login relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.3),rgba(2,6,23,0.82)),radial-gradient(circle_at_top,rgba(96,165,250,0.2),transparent_34%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/15 bg-slate-950/72 p-6 text-white shadow-[0_30px_80px_-45px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">Account Access</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Log In</h1>
          <p className="text-sm leading-6 text-slate-300">
            Sign in to manage saved cards, compare prices, and keep your collection in sync.
          </p>
        </div>

        <form
          id="login-form"
          onSubmit={ handleSubmit }
          className="space-y-5"
        >
          { error && <p className="rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">{ error }</p> }
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/85">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={ username }
              onChange={ ( e ) => setUsername( e.target.value ) }
              className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-black outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/35"
              required={ true }
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/85">
              Password
            </label>
            <input
              id="pass"
              type="password"
              value={ password }
              onChange={ ( e ) => setPassword( e.target.value ) }
              className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-black outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/35"
              required={ true }
            />
          </div>
          <button
            id="login"
            type="submit"
            disabled={ isSubmitting }
            className={ `inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60 focus:ring-offset-2 focus:ring-offset-slate-950 ${ isSubmitting ? "cursor-not-allowed opacity-60" : "" }` }
          >
            { isSubmitting ? "Logging In..." : "Log In" }
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-200">
          Don&apos;t have an account?{ " " }
          <Link
            href="/register"
            className="font-semibold text-amber-300 underline decoration-amber-300/50 underline-offset-4 hover:text-amber-200"
          >
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}

LoginPage.getLayout = ( page ) => page;
