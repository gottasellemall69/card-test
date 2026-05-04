"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

const MOBILE_BACKGROUND = "/images/backgrounds/yugioh/background.svg";
const DESKTOP_CHARACTER = "/yugioh-parallax/character.png";
const DESKTOP_GLOW = "/yugioh-parallax/glow.png";
const DESKTOP_QUERY = "(min-width: 901px)";
const ORIGINAL_SIDEBAR_BREAKPOINT = 1024;
const ORIGINAL_SIDEBAR_WIDTH = 324;
const ANIMATION_EASING = 0.08;
const SETTLE_EPSILON = 0.002;

const clampNumber = ( value, min, max ) => Math.min( Math.max( value, min ), max );

const bindMediaQuery = ( mediaQuery, handler ) => {
    if ( typeof mediaQuery.addEventListener === "function" ) {
        mediaQuery.addEventListener( "change", handler );
        return () => mediaQuery.removeEventListener( "change", handler );
    }

    mediaQuery.addListener( handler );
    return () => mediaQuery.removeListener( handler );
};

export default function YugiohSiteBackground() {
    const router = useRouter();
    const sceneRef = useRef( null );
    const stageRef = useRef( null );
    const cameraRef = useRef( null );
    const glowRef = useRef( null );
    const characterRef = useRef( null );
    const sparksRef = useRef( null );
    const usesOriginalBackgroundPosition = [
        "/yugioh",
        "/yugioh/sets/set-index",
        "/yugioh/sets/[...letter]",
        "/yugioh/deck-builder",
    ].includes( router.pathname );
    const isCollectionPage = router.pathname.startsWith( "/yugioh/my-collection" );
    const isSetDetailPage = router.pathname === "/yugioh/sets/[letter]/[setName]";
    const usesMeasuredArtBand = isCollectionPage || isSetDetailPage;

    useEffect( () => {
        if ( typeof window === "undefined" ) {
            return undefined;
        }

        const scene = sceneRef.current;
        const stage = stageRef.current;
        const camera = cameraRef.current;
        const glow = glowRef.current;
        const character = characterRef.current;
        const sparks = sparksRef.current;

        if ( !scene || !stage || !camera || !glow || !character || !sparks ) {
            return undefined;
        }

        const desktopQuery = window.matchMedia( DESKTOP_QUERY );
        let isDesktop = desktopQuery.matches;
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        let rafId = 0;
        let desktopMetrics = {
            contentLeft: 0,
            usableWidth: window.innerWidth,
            contentCenterPercent: 50,
            sceneOffsetPx: 0,
        };
        let scenePageTop = 0;
        let scenePageLeft = 0;

        const getDesktopMetrics = () => {
            if ( usesOriginalBackgroundPosition ) {
                const sidebarWidth = window.innerWidth >= ORIGINAL_SIDEBAR_BREAKPOINT
                    ? ORIGINAL_SIDEBAR_WIDTH
                    : 0;
                const usableWidth = Math.max( 1, window.innerWidth - sidebarWidth );
                const contentCenter = sidebarWidth + ( usableWidth / 2 );

                return {
                    contentLeft: sidebarWidth,
                    usableWidth,
                    contentCenterPercent: ( contentCenter / window.innerWidth ) * 100,
                    sceneOffsetPx: sidebarWidth / 2,
                };
            }

            const mainRegion = document.querySelector( ".app-shell-main" );
            const mainRect = mainRegion?.getBoundingClientRect();
            const contentLeft = mainRect ? Math.max( 0, mainRect.left ) : 0;
            const usableWidth = Math.max( 1, window.innerWidth - contentLeft );
            const contentCenter = contentLeft + ( usableWidth / 2 );

            return {
                contentLeft,
                usableWidth,
                contentCenterPercent: ( contentCenter / window.innerWidth ) * 100,
                sceneOffsetPx: contentCenter - ( window.innerWidth / 2 ),
            };
        };

        const syncMeasurements = () => {
            const rect = scene.getBoundingClientRect();

            desktopMetrics = getDesktopMetrics();
            scenePageTop = rect.top + window.scrollY;
            scenePageLeft = rect.left + window.scrollX;
            scene.style.setProperty( "--scene-offset-x", `${ desktopMetrics.sceneOffsetPx }px` );
        };

        const syncMeasuredArtBounds = () => {
            if ( !usesMeasuredArtBand ) {
                return;
            }

            const resultsBand = document.getElementById( "collection-results-art-band" )
                || document.getElementById( "set-results-art-band" );

            if ( !resultsBand ) {
                scene.style.removeProperty( "--scene-art-y" );
                scene.style.removeProperty( "--scene-character-height" );
                scene.style.removeProperty( "--scene-glow-height" );
                return;
            }

            const sceneRect = scene.getBoundingClientRect();
            const bandRect = resultsBand.getBoundingClientRect();
            const top = Math.max( 0, bandRect.top - sceneRect.top );
            const rootFontSize = Number.parseFloat( window.getComputedStyle( document.documentElement ).fontSize ) || 16;
            const characterHeight = clampNumber( window.innerHeight * 1.16, rootFontSize * 50, rootFontSize * 80 );
            const glowHeight = clampNumber( window.innerHeight, rootFontSize * 42, rootFontSize * 72 );

            scene.style.setProperty( "--scene-art-y", `${ top }px` );
            scene.style.setProperty( "--scene-character-height", `${ characterHeight }px` );
            scene.style.setProperty( "--scene-glow-height", `${ glowHeight }px` );
        };

        const syncScene = () => {
            syncMeasurements();
            syncMeasuredArtBounds();
        };

        const applyTransforms = ( x, y ) => {
            const { contentCenterPercent } = desktopMetrics;

            stage.style.perspectiveOrigin = isDesktop
                ? `${ ( contentCenterPercent + ( x * 7 ) ).toFixed( 2 ) }% ${ ( 48 + ( y * 5 ) ).toFixed( 2 ) }%`
                : "50% 50%";

            camera.style.transform = isDesktop
                ? `translate3d(${ ( x * -8 ).toFixed( 2 ) }px, ${ ( y * -6 ).toFixed( 2 ) }px, 0) translate3d(0, 1.5%, 0) scale(1.02) rotateX(${ ( y * -4.6 ).toFixed( 3 ) }deg) rotateY(${ ( x * 5.6 ).toFixed( 3 ) }deg)`
                : "translate3d(0, 1.5%, 0) scale(1.02) rotateX(0deg) rotateY(0deg)";

            glow.style.transform = `translate3d(${ ( x * -54 ).toFixed( 2 ) }px, ${ ( y * -50 ).toFixed( 2 ) }px, 40px) scale(1.14)`;
            character.style.transform = `translate3d(${ ( x * -36 ).toFixed( 2 ) }px, ${ ( y * -34 ).toFixed( 2 ) }px, 90px) scale(1.18)`;
            sparks.style.transform = `translate3d(${ ( x * -18 ).toFixed( 2 ) }px, ${ ( y * -16 ).toFixed( 2 ) }px, 20px) scale(1.03)`;
        };

        const stopAnimation = () => {
            if ( !rafId ) {
                return;
            }

            window.cancelAnimationFrame( rafId );
            rafId = 0;
        };

        const animate = () => {
            currentX += ( targetX - currentX ) * ANIMATION_EASING;
            currentY += ( targetY - currentY ) * ANIMATION_EASING;
            applyTransforms( currentX, currentY );

            const hasSettled = Math.abs( targetX - currentX ) < SETTLE_EPSILON
                && Math.abs( targetY - currentY ) < SETTLE_EPSILON;

            if ( hasSettled ) {
                currentX = targetX;
                currentY = targetY;
                applyTransforms( currentX, currentY );
                rafId = 0;
                return;
            }

            rafId = window.requestAnimationFrame( animate );
        };

        const startAnimation = () => {
            if ( !isDesktop || rafId ) {
                return;
            }

            rafId = window.requestAnimationFrame( animate );
        };

        const resetPointer = ( shouldAnimate = true ) => {
            targetX = 0;
            targetY = 0;
            scene.style.setProperty( "--px", "50%" );
            scene.style.setProperty( "--py", "50%" );

            if ( shouldAnimate ) {
                startAnimation();
            }
        };

        const setPointer = ( x, y ) => {
            if ( !isDesktop ) {
                return;
            }

            const { contentLeft, usableWidth } = desktopMetrics;
            const localX = x + window.scrollX - scenePageLeft;
            const localY = y + window.scrollY - scenePageTop;
            const normalizedX = ( ( x - contentLeft ) / usableWidth - 0.5 ) * 2;
            const normalizedY = ( y / window.innerHeight - 0.5 ) * 2;

            targetX = Math.max( -1, Math.min( 1, normalizedX ) );
            targetY = Math.max( -1, Math.min( 1, normalizedY ) );
            scene.style.setProperty( "--px", `${ localX }px` );
            scene.style.setProperty( "--py", `${ localY }px` );
            startAnimation();
        };

        const onPointerMove = ( event ) => {
            if ( event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen" ) {
                return;
            }

            setPointer( event.clientX, event.clientY );
        };

        const onMouseLeave = () => {
            resetPointer();
        };

        const onWindowBlur = () => {
            stopAnimation();
            resetPointer( false );
            currentX = 0;
            currentY = 0;
            applyTransforms( 0, 0 );
        };

        const onVisibilityChange = () => {
            if ( document.visibilityState !== "visible" ) {
                stopAnimation();
                resetPointer( false );
                currentX = 0;
                currentY = 0;
                applyTransforms( 0, 0 );
            }
        };

        const syncViewportMode = () => {
            isDesktop = desktopQuery.matches;
            syncScene();

            if ( !isDesktop ) {
                stopAnimation();
                resetPointer( false );
                currentX = 0;
                currentY = 0;
                applyTransforms( 0, 0 );
                return;
            }

            applyTransforms( currentX, currentY );
        };

        const onResize = () => {
            syncScene();
            applyTransforms( currentX, currentY );
        };

        resetPointer( false );
        syncScene();
        applyTransforms( 0, 0 );
        const postLayoutSyncId = window.requestAnimationFrame( () => {
            syncScene();
            applyTransforms( currentX, currentY );
        } );

        window.addEventListener( "pointermove", onPointerMove, { passive: true } );
        window.addEventListener( "mouseleave", onMouseLeave );
        window.addEventListener( "blur", onWindowBlur );
        window.addEventListener( "resize", onResize );
        document.addEventListener( "visibilitychange", onVisibilityChange );

        const removeMediaListener = bindMediaQuery( desktopQuery, syncViewportMode );
        const mainRegion = document.querySelector( ".app-shell-main" );
        const measuredResultsBand = usesMeasuredArtBand
            ? document.getElementById( "collection-results-art-band" )
                || document.getElementById( "set-results-art-band" )
            : null;
        const resizeObserver = typeof ResizeObserver === "function" && mainRegion
            ? new ResizeObserver( () => {
                syncScene();
                applyTransforms( currentX, currentY );
            } )
            : null;

        if ( resizeObserver && mainRegion ) {
            resizeObserver.observe( mainRegion );
            if ( measuredResultsBand ) {
                resizeObserver.observe( measuredResultsBand );
            }
        }

        return () => {
            window.cancelAnimationFrame( postLayoutSyncId );
            window.removeEventListener( "pointermove", onPointerMove );
            window.removeEventListener( "mouseleave", onMouseLeave );
            window.removeEventListener( "blur", onWindowBlur );
            window.removeEventListener( "resize", onResize );
            document.removeEventListener( "visibilitychange", onVisibilityChange );
            removeMediaListener();
            resizeObserver?.disconnect();
            stopAnimation();
        };
    }, [ usesMeasuredArtBand, usesOriginalBackgroundPosition ] );

    return (
        <>
            <style jsx>{ `
                .ygo-bg {
                    --px: 50%;
                    --py: 50%;
                    --scene-offset-x: 0px;
                    --scene-art-y: clamp(34rem, 62svh, 46rem);
                    --shine: radial-gradient(
                        circle at var(--px) var(--py),
                        rgba(255, 198, 124, 0.18),
                        rgba(255, 198, 124, 0.05) 12%,
                        transparent 22%
                    );

                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    min-height: 100svh;
                    z-index: 0;
                    overflow: hidden;
                    isolation: isolate;
                    pointer-events: none;
                    contain: paint;
                    background:
                        radial-gradient(circle at 50% 35%, rgba(255, 138, 64, 0.22), transparent 28%),
                        radial-gradient(circle at 25% 60%, rgba(255, 102, 0, 0.14), transparent 30%),
                        radial-gradient(circle at 78% 28%, rgba(135, 60, 255, 0.16), transparent 32%),
                        #09090d;
                }

                .ygo-bg.measured-art-band-page {
                    --scene-art-y: clamp(76rem, 132svh, 102rem);
                    --scene-character-height: clamp(50rem, 116vh, 80rem);
                    --scene-glow-height: clamp(42rem, 100vh, 72rem);
                }

                .ygo-bg.original-position-page .stage {
                    position: fixed;
                    contain: layout paint style;
                }

                .ygo-bg.original-position-page .glow {
                    inset: -12% -10%;
                    background-position: calc(50% + var(--scene-offset-x)) 51%;
                }

                .ygo-bg.original-position-page .character {
                    inset: -22% -12%;
                    background-position: calc(50% + var(--scene-offset-x)) 50%;
                }

                .mobile-art {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    display: none;
                    background-image: url("${ MOBILE_BACKGROUND }");
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                }

                .stage {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                    overflow: hidden;
                    perspective: 1200px;
                    perspective-origin: 50% 50%;
                    transform-style: preserve-3d;
                    pointer-events: none;
                    contain: paint style;
                }

                .camera {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    min-height: 100%;
                    transform-style: preserve-3d;
                    will-change: transform;
                    pointer-events: none;
                    transform: translate3d(0, 1.5%, 0) scale(1.02) rotateX(0deg) rotateY(0deg);
                }

                .layer {
                    position: absolute;
                    inset: -6%;
                    background-repeat: no-repeat;
                    pointer-events: none;
                    transform-style: preserve-3d;
                    transform-origin: center center;
                    backface-visibility: hidden;
                }

                .glow {
                    z-index: 4;
                    inset: 0 -10%;
                    background-image: url("${ DESKTOP_GLOW }");
                    background-size: auto clamp(42rem, 100vh, 72rem);
                    background-position: calc(50% + var(--scene-offset-x)) var(--scene-art-y);
                    background-repeat: no-repeat;
                    mix-blend-mode: screen;
                    will-change: transform;
                    opacity: 0.38;
                    filter: blur(12px) saturate(1.14) brightness(1.01);
                    transform: translate3d(0px, 0px, 40px) scale(1.14);
                }

                .character {
                    inset: 0 -12%;
                    z-index: 5;
                    background-image: url("${ DESKTOP_CHARACTER }");
                    background-size: auto clamp(50rem, 116vh, 80rem);
                    background-position: calc(50% + var(--scene-offset-x)) var(--scene-art-y);
                    background-repeat: no-repeat;
                    will-change: transform;
                    filter:
                        drop-shadow(0 14px 18px rgba(0, 0, 0, 0.28))
                        drop-shadow(0 24px 32px rgba(0, 0, 0, 0.2));
                    transform: translate3d(0px, 0px, 90px) scale(1.18);
                }

                .ygo-bg.measured-art-band-page .glow {
                    background-size: auto var(--scene-glow-height);
                }

                .ygo-bg.measured-art-band-page .character {
                    background-size: auto var(--scene-character-height);
                }

                .sparks {
                    position: absolute;
                    z-index: 3;
                    inset: -10%;
                    pointer-events: none;
                    opacity: 0.95;
                    background:
                        radial-gradient(circle at 14% 20%, rgba(255, 225, 154, 0.95) 0 3px, transparent 4px),
                        radial-gradient(circle at 22% 72%, rgba(255, 225, 154, 0.92) 0 4px, transparent 5px),
                        radial-gradient(circle at 36% 18%, rgba(255, 184, 84, 0.9) 0 2px, transparent 3px),
                        radial-gradient(circle at 48% 76%, rgba(255, 184, 84, 0.9) 0 4px, transparent 5px),
                        radial-gradient(circle at 62% 14%, rgba(255, 225, 154, 0.95) 0 3px, transparent 4px),
                        radial-gradient(circle at 79% 25%, rgba(255, 184, 84, 0.9) 0 2px, transparent 3px),
                        radial-gradient(circle at 84% 66%, rgba(255, 225, 154, 0.95) 0 4px, transparent 5px),
                        radial-gradient(circle at 68% 84%, rgba(255, 184, 84, 0.95) 0 3px, transparent 4px);
                    will-change: transform;
                    transform: translate3d(0px, 0px, 20px) scale(1.03);
                    filter: blur(0.2px);
                    backface-visibility: hidden;
                }

                .flare {
                    position: absolute;
                    z-index: 6;
                    inset: 0;
                    pointer-events: none;
                    background:
                        var(--shine),
                        linear-gradient(
                            135deg,
                            rgba(255, 152, 74, 0.05),
                            transparent 34%,
                            rgba(103, 49, 197, 0.08) 78%,
                            transparent
                        );
                    mix-blend-mode: screen;
                    opacity: 0.82;
                }

                .scanlines {
                    position: absolute;
                    z-index: 7;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0.08;
                    background:
                        repeating-linear-gradient(
                            to bottom,
                            rgba(255, 255, 255, 0.14) 0,
                            rgba(255, 255, 255, 0.14) 1px,
                            transparent 2px,
                            transparent 4px
                        );
                }

                .vignette {
                    position: absolute;
                    z-index: 8;
                    inset: 0;
                    pointer-events: none;
                    background:
                        radial-gradient(
                            circle at center,
                            transparent 46%,
                            rgba(8, 8, 12, 0.18) 72%,
                            rgba(3, 3, 6, 0.7) 100%
                        ),
                        linear-gradient(
                            to bottom,
                            rgba(0, 0, 0, 0.28),
                            transparent 24%,
                            transparent 76%,
                            rgba(0, 0, 0, 0.36)
                        );
                }

                @media ( max-width: 900px ) {
                    .mobile-art {
                        display: block;
                    }

                    .stage,
                    .flare {
                        display: none;
                    }
                }
            ` }</style>

            <div
                ref={ sceneRef }
                className={ `ygo-bg${ usesOriginalBackgroundPosition ? " original-position-page" : "" }${ usesMeasuredArtBand ? " measured-art-band-page" : "" }` }
                aria-hidden="true"
            >
                <div className="mobile-art" />
                <div ref={ stageRef } className="stage">
                    <div ref={ cameraRef } className="camera">
                        <div ref={ glowRef } className="layer glow" />
                        <div ref={ sparksRef } className="sparks" />
                        <div ref={ characterRef } className="layer character" />
                    </div>
                    <div className="scanlines" />
                    <div className="vignette" />
                </div>
                <div className="flare" />
            </div>
        </>
    );
}
