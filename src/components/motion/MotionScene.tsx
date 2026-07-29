import React, { useLayoutEffect, useRef } from 'react';
import { animate, stagger, type JSAnimation } from 'animejs';

interface MotionSceneProps {
  children: React.ReactNode;
  sceneKey: React.Key;
  className?: string;
}

const isVisible = (element: Element) => {
  const htmlElement = element as HTMLElement;
  return htmlElement.offsetParent !== null && htmlElement.getClientRects().length > 0;
};

/**
 * One motion boundary for an entire screen. The scene itself moves, while its
 * content only fades in, so card hover transforms remain free to do their job.
 */
export default function MotionScene({ children, sceneKey, className = '' }: MotionSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const running: JSAnimation[] = [];
    let observerFrame = 0;
    scene.dataset.motionReady = 'true';

    const decorateSurfaces = () => {
      const surfaces = Array.from(
        scene.querySelectorAll<HTMLElement>('article, section, a, div'),
      ).filter((element) => {
        const classes = element.className;
        return typeof classes === 'string'
          && classes.includes('border')
          && (classes.includes('shadow-[4px_4px') || classes.includes('shadow-[6px_6px'));
      });

      const freshSurfaces = surfaces.filter((surface) => !surface.classList.contains('motion-surface'));
      surfaces.forEach((surface) => {
        surface.classList.add('motion-surface');
        surface.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
          image.classList.add('motion-media');
        });
      });
      return { surfaces, freshSurfaces };
    };

    const { surfaces: hardShadowSurfaces } = decorateSurfaces();

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(observerFrame);
      observerFrame = requestAnimationFrame(() => {
        const { freshSurfaces } = decorateSurfaces();
        if (reducedMotion || freshSurfaces.length === 0) return;

        running.push(
          animate(freshSurfaces.slice(0, 24), {
            opacity: { from: 0 },
            delay: stagger(42),
            duration: 460,
            ease: 'outQuad',
          }),
        );
      });
    });
    observer.observe(scene, { childList: true, subtree: true });

    if (!reducedMotion) {
      const directChildren = Array.from(scene.children).filter(isVisible);
      const markedItems = Array.from(
        scene.querySelectorAll<HTMLElement>('[data-motion-item], [data-motion-group] > *'),
      ).filter(isVisible);
      const items = Array.from(
        new Set([...directChildren, ...markedItems, ...hardShadowSurfaces]),
      ).slice(0, 36);

      running.push(
        animate(scene, {
          opacity: { from: 0 },
          y: { from: 18 },
          duration: 720,
          ease: 'outExpo',
        }),
      );

      if (items.length > 1) {
        running.push(
          animate(items, {
            opacity: { from: 0 },
            delay: stagger(48, { start: 90 }),
            duration: 520,
            ease: 'outQuad',
          }),
        );
      }
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(observerFrame);
      running.forEach((animation) => animation.revert());
    };
  }, [sceneKey]);

  return (
    <div ref={sceneRef} className={`motion-scene ${className}`} data-motion-scene={String(sceneKey)}>
      {children}
    </div>
  );
}