"use client";

import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

export default function LandingPage() {
    const router = useRouter();
    const [ animate, setAnimate ] = useState( false );
    const [ hoveredPanel, setHoveredPanel ] = useState( null );
    const parallaxRef = useRef( null );

    useEffect( () => {
        // trigger entrance animation after mount
        const timer = setTimeout( () => setAnimate( true ), 100 );
        return () => clearTimeout( timer );
    }, [] );

    useEffect( () => {
        const elem = parallaxRef.current;
        if ( !elem || !window.matchMedia( "(pointer: fine)" ).matches ) {
            return undefined;
        }

        const parallax = ( e ) => {
            const w = window.innerWidth / 2;
            const h = window.innerHeight / 2;
            const { clientX, clientY } = e;
            const depth1 = `${ 50 - ( clientX - w ) * 0.01 }% ${ 50 - ( clientY - h ) * 0.01 }%`;
            const depth2 = `${ 50 - ( clientX - w ) * 0.02 }% ${ 50 - ( clientY - h ) * 0.02 }%`;
            const depth3 = `${ 50 - ( clientX - w ) * 0.06 }% ${ 50 - ( clientY - h ) * 0.06 }%`;
            elem.style.backgroundPosition = `${ depth3 }, ${ depth2 }, ${ depth1 }`;
        };

        window.addEventListener( "mousemove", parallax );
        return () => window.removeEventListener( "mousemove", parallax );
    }, [] );

    const goTo = ( path ) => {
        router.push( path );
    };

    const panelFocus = ( panel ) => ( hoveredPanel && hoveredPanel !== panel ? "opacity-80 scale-[0.98]" : "opacity-100 scale-100" );

    const overlayGradient = hoveredPanel === "yugioh"
        ? "radial-gradient(circle at 18% 50%, rgba(99, 102, 241, 0.32), transparent 32%), linear-gradient(115deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.76))"
        : hoveredPanel === "sports"
            ? "radial-gradient(circle at 82% 50%, rgba(45, 212, 191, 0.3), transparent 32%), linear-gradient(75deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.74))"
            : "linear-gradient(90deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.78))";

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div
                id="parallax"
                ref={ parallaxRef }
                className={ `parallax-layer absolute inset-0 pointer-events-none ${ hoveredPanel ? "opacity-95" : "opacity-80" }` }
                style={ { zIndex: -2 } }
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 pointer-events-none transition-all duration-500"
                style={ { zIndex: -1, backgroundImage: overlayGradient } }
                aria-hidden="true"
            />
            <div className="relative min-h-screen mx-auto flex flex-wrap overflow-clip inset-1 max-w-full w-auto">
                {/* Yu-Gi-Oh! Panel */ }
                <div
                    onClick={ () => goTo( "/yugioh" ) }
                    onMouseEnter={ () => setHoveredPanel( "yugioh" ) }
                    onMouseLeave={ () => setHoveredPanel( null ) }
                    className={ `panel-root mix-blend-plus-darker relative flex-1 flex items-center justify-center cursor-pointer transition-all duration-700 ease-in-out ${ animate ? "translate-x-0" : "-translate-x-full" } group ${ panelFocus( "yugioh" ) }` }
                >
                    <div className="absolute inset-0 overflow-hidden">
                        <div
                            className="panel-bg"
                            style={ { backgroundImage: 'url("yugioh-dragon-bg/dragon-poster.jpg")' } }
                            aria-hidden="true"
                        />
                    </div>
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
                    <div className="relative z-10 text-shadow glass p-3 text-center text-white">
                        <h1 className="text-4xl font-extrabold mb-4 group-hover:scale-95 transition-transform drop-shadow-lg">
                            Yu-Gi-Oh! Cards Prices
                        </h1>
                        <p className="text-lg opacity-90 drop-shadow">Explore TCG sets and card values</p>
                    </div>
                </div>
                {/* Sports Panel */ }
                <div
                    onClick={ () => goTo( "/sports" ) }
                    onMouseEnter={ () => setHoveredPanel( "sports" ) }
                    onMouseLeave={ () => setHoveredPanel( null ) }
                    className={ `panel-root relative flex-1 flex items-center justify-center cursor-pointer transition-all duration-700 ease-in-out ${ animate ? "translate-x-0" : "translate-x-full" } bg-black/80 mix-blend-color-dodge group ${ panelFocus( "sports" ) }` }
                >
                    <div className="absolute inset-0 overflow-hidden">
                        <div
                            className="panel-bg"
                            style={ { backgroundImage: 'url("/images/backgrounds/sports/sportsbg.svg")' } }
                            aria-hidden="true"
                        />
                    </div>
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
                    <div className="relative z-10 text-shadow glass p-3 text-center text-white">
                        <h1 className="text-4xl font-extrabold mb-4 group-hover:scale-95 transition-transform drop-shadow-lg">
                            Sports Cards Prices
                        </h1>
                        <p className="text-lg opacity-90 drop-shadow text-white">Browse, track, and compare sports cards</p>
                    </div>
                </div>
            </div>
            <style jsx>{ `
                .panel-root {
                    overflow: hidden;
                    isolation: isolate;
                }

                .panel-bg {
                    position: absolute;
                    inset: 0;
                    background-repeat: no-repeat;
                    background-size: cover;
                    background-position: 50% 50%;
                    transition:
                        transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
                        filter 480ms ease,
                        opacity 320ms ease;
                    will-change: transform;
                    z-index: 0;
                }

                .panel-root:hover .panel-bg,
                .panel-root:focus-visible .panel-bg {
                    transform: scale(1.06) translateZ(0);
                    filter: saturate(1.1) brightness(1.05);
                }

                .parallax-layer {
                    background-image:
                        url("https://raw.githubusercontent.com/oscicen/oscicen.github.io/master/img/depth-3.png"),
                        url("https://raw.githubusercontent.com/oscicen/oscicen.github.io/master/img/depth-2.png"),
                        url("https://raw.githubusercontent.com/oscicen/oscicen.github.io/master/img/depth-1.png");
                    background-repeat: no-repeat;
                    background-position: 50% 50%, 50% 50%, 50% 50%;
                    background-size: cover, cover, cover;
                    transition: background-position 120ms ease-out, opacity 320ms ease, filter 320ms ease;
                    filter: saturate(0.95) brightness(1.05);
                }

                @media (max-width: 768px) {
                    .parallax-layer {
                        background-size: 140% auto, 140% auto, 140% auto;
                        opacity: 0.7;
                    }
                }
            ` }
            </style>
        </div>
    );
}
