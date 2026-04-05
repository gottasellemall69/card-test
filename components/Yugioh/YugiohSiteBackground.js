"use client";

import { useEffect, useRef } from "react";

export default function YugiohSiteBackground() {
    const ref = useRef( null );

    useEffect( () => {
        const scene = ref.current;
        if ( !scene ) {
            return undefined;
        }

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        let rafId = 0;

        const setPointer = ( x, y ) => {
            const nx = ( x / window.innerWidth - 0.5 ) * 2;
            const ny = ( y / window.innerHeight - 0.5 ) * 2;

            targetX = Math.max( -1, Math.min( 1, nx ) );
            targetY = Math.max( -1, Math.min( 1, ny ) );
            scene.style.setProperty( "--px", `${ x }px` );
            scene.style.setProperty( "--py", `${ y }px` );
        };

        const onMouseMove = ( event ) => {
            setPointer( event.clientX, event.clientY );
        };

        const onTouchMove = ( event ) => {
            const touch = event.touches?.[ 0 ];
            if ( !touch ) {
                return;
            }
            setPointer( touch.clientX, touch.clientY );
        };

        const onMouseLeave = () => {
            targetX = 0;
            targetY = 0;
            scene.style.setProperty( "--px", "50%" );
            scene.style.setProperty( "--py", "50%" );
        };

        const animate = () => {
            currentX += ( targetX - currentX ) * 0.08;
            currentY += ( targetY - currentY ) * 0.08;
            scene.style.setProperty( "--mx", currentX.toFixed( 4 ) );
            scene.style.setProperty( "--my", currentY.toFixed( 4 ) );
            rafId = requestAnimationFrame( animate );
        };

        window.addEventListener( "mousemove", onMouseMove );
        window.addEventListener( "touchmove", onTouchMove, { passive: true } );
        window.addEventListener( "mouseleave", onMouseLeave );
        rafId = requestAnimationFrame( animate );

        return () => {
            window.removeEventListener( "mousemove", onMouseMove );
            window.removeEventListener( "touchmove", onTouchMove );
            window.removeEventListener( "mouseleave", onMouseLeave );
            if ( rafId ) {
                cancelAnimationFrame( rafId );
            }
        };
    }, [] );

    return (
        <>
            <style jsx>{ `
                .ygo-bg {
                    --mx: 0;
                    --my: 0;
                    --px: 50%;
                    --py: 50%;
                    --scene-scale: 0.88;
                    --scene-y: 1.5%;
                    --shine: radial-gradient(
                        circle at var(--px) var(--py),
                        rgba(255, 198, 124, 0.18),
                        rgba(255, 198, 124, 0.04) 18%,
                        transparent 32%
                    );

                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                    isolation: isolate;
                    perspective: 1200px;
                    transform-style: preserve-3d;
                    pointer-events: none;
                    background:
                        radial-gradient(circle at 50% 35%, rgba(255, 138, 64, 0.22), transparent 28%),
                        radial-gradient(circle at 25% 60%, rgba(255, 102, 0, 0.14), transparent 30%),
                        radial-gradient(circle at 78% 28%, rgba(135, 60, 255, 0.16), transparent 32%),
                        #09090d;
                }

                .camera {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    transform-style: preserve-3d;
                    will-change: transform;
                    pointer-events: none;
                    transform:
                        translate3d(0, var(--scene-y), 0)
                        rotateX(calc(var(--my) * -4deg))
                        rotateY(calc(var(--mx) * 5deg))
                        scale(var(--scene-scale));
                }

                .layer {
                    position: absolute;
                    inset: -6%;
                    background-repeat: no-repeat;
                    will-change: transform;
                    pointer-events: none;
                    transform-style: preserve-3d;
                    transform-origin: center center;
                    backface-visibility: hidden;
                }

                .depth-1 {
                    z-index: 1;
                    background-image:
                        linear-gradient(rgba(10, 6, 14, 0.12), rgba(10, 6, 14, 0.18)),
                        url("/yugioh-parallax/depth-1.jpg");
                    background-size: cover;
                    background-position: center;
                    filter: blur(10px) brightness(0.52) saturate(1.05);
                    transform:
                        translate3d(calc(var(--mx) * -8px), calc(var(--my) * -8px), -120px)
                        scale(1.12);
                }

                .depth-2 {
                    z-index: 2;
                    background-image: url("/yugioh-parallax/depth-2.jpg");
                    background-size: cover;
                    background-position: center;
                    opacity: 0.78;
                    filter: brightness(0.78) saturate(1.15);
                    transform:
                        translate3d(calc(var(--mx) * -14px), calc(var(--my) * -14px), -40px)
                        scale(1.06);
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
                    transform:
                        translate3d(calc(var(--mx) * -10px), calc(var(--my) * -10px), 20px)
                        scale(1.03);
                    filter: blur(0.2px);
                    backface-visibility: hidden;
                }

                .glow {
                    inset: -1%;
                    z-index: 4;
                    background-image: url("/yugioh-parallax/glow.png");
                    background-size: 92% auto;
                    background-position: 50% 52%;
                    background-repeat: no-repeat;
                    mix-blend-mode: screen;
                    opacity: 0.44;
                    filter: blur(18px) saturate(1.25) brightness(1.02);
                    transform:
                        translate3d(calc(var(--mx) * -30px), calc(var(--my) * -30px), 40px)
                        scale(1);
                }

                .character {
                    inset: 1%;
                    z-index: 5;
                    background-image: url("/yugioh-parallax/character.png");
                    background-size: 125% auto;
                    background-position: 50% 54%;
                    background-repeat: no-repeat;
                    filter:
                        drop-shadow(0 18px 20px rgba(0, 0, 0, 0.32))
                        drop-shadow(0 30px 42px rgba(0, 0, 0, 0.24));
                    transform:
                        translate3d(calc(var(--mx) * -22px), calc(var(--my) * -22px), 90px)
                        scale(0.96);
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
                    opacity: 0.95;
                }

                .scanlines {
                    position: absolute;
                    z-index: 7;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0.16;
                    background:
                        repeating-linear-gradient(
                            to bottom,
                            rgba(255, 255, 255, 0.14) 0,
                            rgba(255, 255, 255, 0.14) 1px,
                            transparent 2px,
                            transparent 4px
                        );
                    mix-blend-mode: soft-light;
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

                @media (max-width: 900px) {
                    .ygo-bg {
                        --scene-scale: 0.88;
                        --scene-y: 0.70%;
                    }

                    .character,
                    .glow {
                        background-size: 96% auto;
                    }
                }
            `}</style>

            <div ref={ ref } className="ygo-bg">
                <div className="camera">
                    <div className="layer depth-1" />
                    <div className="layer depth-2" />
                    <div className="sparks" />
                    <div className="layer glow" />
                    <div className="layer character" />
                </div>
                <div className="flare" />
                <div className="scanlines" />
                <div className="vignette" />
            </div>
        </>
    );
}
