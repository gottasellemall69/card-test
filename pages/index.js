"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PANELS = [
    {
        id: "yugioh",
        index: "01",
        href: "/yugioh",
        side: "left",
        kicker: "Trading Card Game",
        title: "Yu-Gi-Oh! Card Prices",
        body: "Browse sets, compare values, and move into the Yu-Gi-Oh! market from a dedicated left-side panel.",
        action: "Browse Yu-Gi-Oh! Prices",
        accent: "124, 58, 237",
        backgroundImage: "/uRl6tFT0uQxyhWgCKm4TQjbIjMl4TcQYxVGVvGmt.jpg",
        backgroundPosition: "center center",
        overlay: "linear-gradient(90deg, rgba(2, 6, 23, 0.97) 0%, rgba(2, 6, 23, 0.82) 34%, rgba(2, 6, 23, 0.3) 100%)",
        focusImage: "/images/yugiohImages/46986414.jpg",
        focusPosition: "86% 60%",
        focusSize: "clamp(15rem, 24vw, 21rem)",
        focusOpacity: 0.94,
        focusBlendMode: "normal",
    },
    {
        id: "sports",
        index: "02",
        href: "/sports",
        side: "right",
        kicker: "Sports Collectibles",
        title: "Sports Cards Prices",
        body: "Open the sports side to compare values, research pricing, and follow the sports card market from a dedicated right-side panel.",
        action: "Browse Sports Prices",
        accent: "20, 184, 166",
        backgroundImage: "/backgrounds/sports/sportsbg.svg",
        backgroundPosition: "center center",
        overlay: "linear-gradient(270deg, rgba(2, 6, 23, 0.97) 0%, rgba(2, 6, 23, 0.82) 34%, rgba(2, 6, 23, 0.24) 100%)",
        focusImage: "/icons/sports/sportsPrices.svg",
        focusPosition: "16% 56%",
        focusSize: "clamp(19rem, 34vw, 32rem)",
        focusOpacity: 0.26,
        focusBlendMode: "screen",
    },
];

function MarketPanel( { activePanel, animate, onActiveChange, panel } ) {
    const panelRef = useRef( null );
    const frameRef = useRef( 0 );

    const resetParallax = () => {
        const element = panelRef.current;
        if ( !element ) {
            return;
        }

        if ( frameRef.current ) {
            cancelAnimationFrame( frameRef.current );
            frameRef.current = 0;
        }

        element.style.setProperty( "--pointer-x", "0" );
        element.style.setProperty( "--pointer-y", "0" );
        element.style.setProperty( "--glow-x", "50%" );
        element.style.setProperty( "--glow-y", "50%" );
    };

    useEffect( () => {
        const element = panelRef.current;
        if ( element ) {
            element.style.setProperty( "--pointer-x", "0" );
            element.style.setProperty( "--pointer-y", "0" );
            element.style.setProperty( "--glow-x", "50%" );
            element.style.setProperty( "--glow-y", "50%" );
        }

        return () => {
            if ( frameRef.current ) {
                cancelAnimationFrame( frameRef.current );
            }
        };
    }, [] );

    const handlePointerMove = ( event ) => {
        if (
            typeof window !== "undefined" &&
            ( !window.matchMedia( "(pointer: fine)" ).matches ||
                window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches )
        ) {
            return;
        }

        const element = panelRef.current;
        if ( !element ) {
            return;
        }

        const { clientX, clientY } = event;

        if ( frameRef.current ) {
            cancelAnimationFrame( frameRef.current );
        }

        frameRef.current = requestAnimationFrame( () => {
            const rect = element.getBoundingClientRect();
            const nextX = Math.max( 0, Math.min( 1, ( clientX - rect.left ) / rect.width ) );
            const nextY = Math.max( 0, Math.min( 1, ( clientY - rect.top ) / rect.height ) );
            const offsetX = ( nextX - 0.5 ) * 2;
            const offsetY = ( nextY - 0.5 ) * 2;

            element.style.setProperty( "--pointer-x", offsetX.toFixed( 3 ) );
            element.style.setProperty( "--pointer-y", offsetY.toFixed( 3 ) );
            element.style.setProperty( "--glow-x", `${ ( nextX * 100 ).toFixed( 2 ) }%` );
            element.style.setProperty( "--glow-y", `${ ( nextY * 100 ).toFixed( 2 ) }%` );
        } );
    };

    const isMuted = Boolean( activePanel ) && activePanel !== panel.id;
    const numberPosition = panel.side === "right"
        ? "left-5 md:left-auto md:right-8"
        : "left-5 md:left-8";
    const copyPosition = panel.side === "right"
        ? "items-start text-left md:ml-auto md:items-end md:text-right"
        : "items-start text-left";
    const copyRail = panel.side === "right"
        ? "border-l border-white/25 pl-5 md:border-l-0 md:border-r md:pl-0 md:pr-5"
        : "border-l border-white/25 pl-5";
    const justifyCopy = panel.side === "right"
        ? "justify-start md:justify-end"
        : "justify-start";
    const panelDirection = panel.side === "right" ? "panel-right" : "panel-left";

    return (
        <Link
            href={ panel.href }
            className={ `market-link ${ isMuted ? "is-muted" : "" }` }
            onPointerEnter={ () => onActiveChange( panel.id ) }
            onPointerLeave={ () => {
                onActiveChange( null );
                resetParallax();
            } }
            onPointerMove={ handlePointerMove }
            onFocus={ () => onActiveChange( panel.id ) }
            onBlur={ () => {
                onActiveChange( null );
                resetParallax();
            } }
            aria-label={ panel.title }
        >
            <article
                ref={ panelRef }
                className={ `market-panel ${ panelDirection } ${ animate ? "is-ready" : "" }` }
                style={ { "--accent-rgb": panel.accent } }
            >
                <span className={ `panel-number ${ numberPosition }` }>{ panel.index }</span>
                <span
                    className="panel-base"
                    aria-hidden="true"
                    style={ {
                        backgroundImage: `url("${ panel.backgroundImage }")`,
                        backgroundPosition: panel.backgroundPosition,
                    } }
                />
                <span className="panel-grid" aria-hidden="true" />
                <span
                    className="panel-overlay"
                    aria-hidden="true"
                    style={ { background: panel.overlay } }
                />
                <span className="panel-glow" aria-hidden="true" />
                <span
                    className="panel-focus"
                    aria-hidden="true"
                    style={ {
                        backgroundImage: `url("${ panel.focusImage }")`,
                        backgroundPosition: panel.focusPosition,
                        backgroundSize: panel.focusSize,
                        opacity: panel.focusOpacity,
                        mixBlendMode: panel.focusBlendMode,
                    } }
                />
                <span className={ `copy-shell ${ justifyCopy }` }>
                    <span className={ `copy-block ${ copyPosition } ${ copyRail }` }>
                        <span className="market-kicker">{ panel.kicker }</span>
                        <h1 className="market-title">{ panel.title }</h1>
                        <p className="market-body">{ panel.body }</p>
                        <span className="market-action">{ panel.action }</span>
                    </span>
                </span>
            </article>
        </Link>
    );
}

export default function LandingPage() {
    const [ animate, setAnimate ] = useState( false );
    const [ activePanel, setActivePanel ] = useState( null );

    useEffect( () => {
        const timer = setTimeout( () => setAnimate( true ), 120 );
        return () => clearTimeout( timer );
    }, [] );

    return (
        <>
            <main className="relative min-h-screen overflow-hidden bg-[#02030a] text-white">
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(20,184,166,0.14),transparent_36%),linear-gradient(180deg,#04050d_0%,#02030a_100%)]"
                    aria-hidden="true"
                />
                <section className="relative flex min-h-screen flex-col md:flex-row">
                    { PANELS.map( ( panel ) => (
                        <MarketPanel
                            key={ panel.id }
                            activePanel={ activePanel }
                            animate={ animate }
                            onActiveChange={ setActivePanel }
                            panel={ panel }
                        />
                    ) ) }
                </section>
            </main>
            <style jsx>{ `
                .market-link
                {
                    position: relative;
                    display: block;
                    flex: 1 1 50%;
                    min-height: 50svh;
                }

                .market-link.is-muted .market-panel
                {
                    opacity: 0.8;
                    filter: saturate(0.82) brightness(0.86);
                }

                .market-link:focus-visible
                {
                    outline: none;
                }

                .market-link:focus-visible .market-panel::after
                {
                    border-color: rgba(var(--accent-rgb), 0.55);
                    box-shadow:
                        inset 0 0 0 1px rgba(255, 255, 255, 0.14),
                        0 0 0 1px rgba(var(--accent-rgb), 0.28);
                }

                .market-panel
                {
                    --pointer-x: 0;
                    --pointer-y: 0;
                    --glow-x: 50%;
                    --glow-y: 50%;
                    position: relative;
                    min-height: 50svh;
                    isolation: isolate;
                    overflow: hidden;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    opacity: 0;
                    transition:
                        transform 720ms cubic-bezier(0.22, 1, 0.36, 1),
                        opacity 420ms ease,
                        filter 280ms ease;
                }

                .market-panel.panel-left
                {
                    transform: translate3d(-28px, 24px, 0);
                }

                .market-panel.panel-right
                {
                    transform: translate3d(28px, 24px, 0);
                }

                .market-panel.is-ready
                {
                    transform: translate3d(0, 0, 0);
                    opacity: 1;
                }

                .market-panel::after
                {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    pointer-events: none;
                    z-index: 5;
                }

                .panel-number
                {
                    position: absolute;
                    top: 1.5rem;
                    z-index: 4;
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.4em;
                    color: rgba(255, 255, 255, 0.68);
                }

                .panel-base,
                .panel-grid,
                .panel-overlay,
                .panel-glow,
                .panel-focus
                {
                    position: absolute;
                    inset: -4%;
                    pointer-events: none;
                    will-change: transform, opacity;
                    transition: transform 220ms ease-out, opacity 280ms ease;
                }

                .panel-base
                {
                    background-repeat: no-repeat;
                    background-size: cover;
                    filter: brightness(0.42) contrast(1.12) saturate(1.06);
                    transform: translate3d(calc(var(--pointer-x) * -18px), calc(var(--pointer-y) * -18px), 0) scale(1.08);
                }

                .panel-grid
                {
                    background-image:
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 5.75rem 5.75rem;
                    opacity: 0.1;
                    transform: translate3d(calc(var(--pointer-x) * -10px), calc(var(--pointer-y) * -10px), 0);
                }

                .panel-overlay
                {
                    inset: 0;
                }

                .panel-glow
                {
                    inset: 0;
                    background:
                        radial-gradient(circle at var(--glow-x) var(--glow-y), rgba(var(--accent-rgb), 0.26), transparent 24%),
                        radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.08), transparent 34%);
                    transform: translate3d(calc(var(--pointer-x) * 10px), calc(var(--pointer-y) * 10px), 0);
                    mix-blend-mode: screen;
                }

                .panel-focus
                {
                    inset: 10% 6% 8%;
                    background-repeat: no-repeat;
                    filter: drop-shadow(0 28px 48px rgba(2, 6, 23, 0.65));
                    transform:
                        translate3d(calc(var(--pointer-x) * 26px), calc(var(--pointer-y) * 18px), 0)
                        rotate(calc(var(--pointer-x) * 5deg))
                        scale(1.01);
                }

                .market-link:hover .panel-focus,
                .market-link:focus-visible .panel-focus
                {
                    transform:
                        translate3d(calc(var(--pointer-x) * 30px), calc(var(--pointer-y) * 20px), 0)
                        rotate(calc(var(--pointer-x) * 6deg))
                        scale(1.04);
                }

                .copy-shell
                {
                    position: relative;
                    z-index: 4;
                    display: flex;
                    height: 100%;
                    width: 100%;
                    align-items: flex-end;
                    padding: 4.75rem 1.5rem 1.75rem;
                }

                .copy-block
                {
                    display: flex;
                    width: min(100%, 30rem);
                    flex-direction: column;
                    gap: 0.95rem;
                    padding-block: 0.35rem;
                    text-shadow: 0 10px 28px rgba(2, 6, 23, 0.65);
                }

                .market-kicker
                {
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.38em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.72);
                }

                .market-title
                {
                    margin: 0;
                    font-size: clamp(2.4rem, 5vw, 4.8rem);
                    line-height: 0.96;
                    font-weight: 700;
                    letter-spacing: -0.04em;
                    font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
                    text-wrap: balance;
                }

                .market-body
                {
                    margin: 0;
                    max-width: 29rem;
                    font-size: clamp(0.98rem, 1.5vw, 1.15rem);
                    line-height: 1.7;
                    color: rgba(226, 232, 240, 0.88);
                }

                .market-action
                {
                    display: inline-flex;
                    width: fit-content;
                    font-size: 0.76rem;
                    font-weight: 700;
                    letter-spacing: 0.32em;
                    text-transform: uppercase;
                    color: rgb(255, 255, 255);
                }

                @media (min-width: 768px)
                {
                    .market-link
                    {
                        min-height: 100vh;
                    }

                    .market-panel
                    {
                        min-height: 100vh;
                        border-bottom: none;
                    }

                    .panel-left
                    {
                        border-right: 1px solid rgba(255, 255, 255, 0.08);
                    }

                    .copy-shell
                    {
                        padding: 6rem 3rem 2.75rem;
                    }

                    .panel-number
                    {
                        top: 2rem;
                    }
                }

                @media (max-width: 767px)
                {
                    .panel-base
                    {
                        transform: scale(1.08);
                    }

                    .panel-grid,
                    .panel-glow,
                    .panel-focus
                    {
                        transform: none;
                    }
                }

                @media (prefers-reduced-motion: reduce)
                {
                    .market-panel,
                    .panel-base,
                    .panel-grid,
                    .panel-glow,
                    .panel-focus
                    {
                        transition: none;
                        transform: none;
                    }
                }
            ` }</style>
        </>
    );
}
