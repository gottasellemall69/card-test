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
        <div className="min-h-screen mx-auto flex flex-wrap overflow-clip inset-1 max-w-full w-auto">
            {/* Yu-Gi-Oh! Panel */ }
            <div
                onClick={ () => goTo( "/yugioh" ) }
                className={ `yugioh-bg mix-blend-color-dodge relative flex-1 flex items-center justify-center cursor-pointer transition-all duration-700 ease-in-out ${ animate ? "translate-x-0" : "-translate-x-full" } group ` }
            >
                <div className="text-shadow glass p-3 text-center text-white">
                    <h1 className="text-4xl font-extrabold mb-4 group-hover:scale-95 transition-transform">
                        Yu-Gi-Oh! Cards Prices
                    </h1>
                    <p className="text-lg opacity-90">Explore TCG sets and card values</p>
                </div>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
            </div>
            {/* Sports Panel */ }
            <div
                onClick={ () => goTo( "/sports" ) }
                className={ `relative flex-1 flex items-center justify-center cursor-pointer transition-all duration-700 ease-in-out ${ animate ? "translate-x-0" : "translate-x-full" } sports-bg bg-black/80 mix-blend-color-dodge group ` }
            >
                <div className="text-shadow glass p-3 text-center text-white">
                    <h1 className="text-4xl font-extrabold mb-4 group-hover:scale-95 transition-transform">
                        Sports Cards Prices
                    </h1>
                    <p className="text-lg opacity-90">Browse, track, and compare sports cards</p>
                </div>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
            </div>
        </div>
    );
}
