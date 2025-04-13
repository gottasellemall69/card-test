import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";



export default function LoginPage() {
  const [ username, setUsername ] = useState( "" );
  const [ password, setPassword ] = useState( "" );
  const [ error, setError ] = useState( null );
  const router = useRouter();

  const handleSubmit = async ( e ) => {
    e.preventDefault();
    setError( null );

    if ( !username || !password ) {
      setError( "Username and password are required." );
      return;
    }

    try {
      const response = await fetch( `/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( { username, password } ),
      } );

      const data = await response.json();

      if ( response.ok ) {
        localStorage.setItem( "token", data.token );
        router.push( "/yugioh/my-collection" );
      } else {
        setError( data.error || "Login failed. Please try again." );
      }
    } catch ( err ) {
      setError( "An unexpected error occurred." );
    }
  };

  return (
    <div className="text-black min-h-screen flex flex-col items-center justify-center bg-transparent text-shadow">
      <h1 className="text-3xl text-white font-bold mb-6">Login</h1>
      <form
        id="login-form"
        onSubmit={ handleSubmit }
        className="bg-transparent border text-black shadow-lg rounded-lg p-6 w-full max-w-md glass"
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
            className="w-full px-3 py-2 border border-black rounded-lg text-black"
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
            className="w-full px-3 py-2 border rounded-lg text-black"
            required={ true }
          />
        </div>
        <button
          id="login"
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Log In
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
