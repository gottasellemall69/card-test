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

const resolveRedirectPath = ( queryParam ) => {
  const baseOrigin = getBaseOrigin();

  if ( typeof queryParam !== "string" ) {
    return DEFAULT_REDIRECT_PATH;
  }

  const sanitizedParam = queryParam.trim();

  if ( !sanitizedParam || sanitizedParam.startsWith( "/" ) ) {
    return DEFAULT_REDIRECT_PATH;
  }

  if ( sanitizedParam.startsWith( "/" ) ) {
    return sanitizedParam.startsWith( "/api" )
      ? DEFAULT_REDIRECT_PATH
      : sanitizedParam;
  }

  try {
    const candidate = new URL( sanitizedParam, baseOrigin );

    if ( candidate.origin !== baseOrigin ) {
      return DEFAULT_REDIRECT_PATH;
    }

    if ( candidate.pathname.startsWith( "/api" ) ) {
      return DEFAULT_REDIRECT_PATH;
    }

    return `${ candidate.pathname }${ candidate.search }${ candidate.hash }` || DEFAULT_REDIRECT_PATH;
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
        const redirectTarget = resolveRedirectPath( router.query?.from );
        await router.push( redirectTarget );
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
    <div className="mt-10 p-5 text-black min-h-screen flex flex-col items-center justify-items-start login">
      <h1 className="text-3xl text-white font-bold mb-6">Login</h1>
      <form
        id="login-form"
        onSubmit={ handleSubmit }
        className="border text-black shadow-lg rounded-lg p-6 w-full max-w-md glass backdrop text-shadow"
      >
        { error && <p className="text-red-500 text-sm mb-4">{ error }</p> }
        <div className="mb-4 text-black">
          <label className="block text-white text-sm font-bold mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={ username }
            onChange={ ( e ) => setUsername( e.target.value ) }
            className="w-full px-3 py-2 border border-white rounded-sm text-white text-shadow bg-transparent"
            required={ true }
          />
        </div>
        <div className="mb-6">
          <label className="block text-white text-sm font-bold mb-2">
            Password
          </label>
          <input
            id="pass"
            type="password"
            value={ password }
            onChange={ ( e ) => setPassword( e.target.value ) }
            className="w-full px-3 py-2 border border-white rounded-sm text-white text-shadow bg-transparent"
            required={ true }
          />
        </div>
        <button
          id="login"
          type="submit"
          disabled={ isSubmitting }
          className={ `w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 ${ isSubmitting ? "opacity-60 cursor-not-allowed" : "" }` }
        >
          { isSubmitting ? "Logging In..." : "Log In" }
        </button>
      </form>
      <p className="mt-4 text-white">
        Don't have an account?{ " " }
        <Link
          href="/register" passHref
          className="text-orange-300 underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
