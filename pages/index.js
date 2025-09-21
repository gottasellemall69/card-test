"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function LandingPage() {
    const router = useRouter();
    const [ animate, setAnimate ] = useState( false );

    useEffect( () => {
        // trigger entrance animation after mount
        const timer = setTimeout( () => setAnimate( true ), 100 );
        return () => clearTimeout( timer );
    }, [] );

    const goTo = ( path ) => {
        router.push( path );
    };

    return (
        <div className="min-h-screen w-full mx-auto flex overflow-hidden">
            {/* Yu-Gi-Oh! Panel */ }
            <div
                onClick={ () => goTo( "/yugioh" ) }
                className={ `
           relative flex-1 flex items-center justify-center cursor-pointer
          transition-all duration-700 ease-in-out
          ${ animate ? "translate-x-0" : "-translate-x-full" }
          bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500
          group
        `}
            >
                <div className="text-center text-white">
                    <h1 className="text-4xl font-extrabold mb-4 p-4 group-hover:scale-110 transition-transform">
                        Yu-Gi-Oh! Cards Prices
                    </h1>
                    <p className="text-lg opacity-90">Explore TCG sets and card values</p>
                </div>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
            </div>
            {/* Sports Panel */ }
            <div
                onClick={ () => goTo( "/sports" ) }
                className={ `
                    relative flex-1 flex items-center justify-center cursor-pointer
                    transition-all duration-700 ease-in-out
                    ${ animate ? "translate-x-0" : "translate-x-full" }
                    bg-gradient-to-br from-red-500 via-orange-600 to-yellow-500
                    group
                  `}
            >
                <div className="text-center text-white">
                    <h1 className="text-4xl font-extrabold p-4 mb-4 group-hover:scale-110 transition-transform">
                        Sports Cards Prices
                    </h1>
                    <p className="text-lg opacity-90">Browse, track, and compare sports cards</p>
                </div>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
            </div>
        </div>
    );
}
