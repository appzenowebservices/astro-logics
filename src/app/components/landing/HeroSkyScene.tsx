"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const SKY_URL = "/scrollsky/ScrollSky.jpg";

type LayerConfig = {
  url: string;
  z: number;
  /** Plane height as a multiple of the visible height at that depth. */
  heightFactor: number;
  /** Never narrower than this multiple of the visible width. */
  minWidthFactor: number;
  /** Resting vertical offset in visible-height units (negative = pushed down). */
  bottomInset: number;
  /** How far below the resting position the layer starts, in visible heights. */
  hiddenOffset: number;
  /** Scroll progress (0–1) where the layer starts / finishes rising. */
  startAt: number;
  endAt: number;
  imageAspect: number;
};

const HERO_LAYERS: LayerConfig[] = [
  {
    url: "/layers/earth_layer.webp",
    z: -32,
    heightFactor: 0.75,
    minWidthFactor: 1.05,
    bottomInset: 0.02,
    hiddenOffset: 0.95,
    startAt: 0.1,
    endAt: 0.6,
    imageAspect: 16 / 9,
  },
  {
    url: "/layers/ground_layer.webp",
    z: -12,
    heightFactor: 0.68,
    minWidthFactor: 1.08,
    bottomInset: 0,
    hiddenOffset: 0.45,
    startAt: 0.24,
    endAt: 0.55,
    imageAspect: 16 / 9,
  },
];

type SceneLayer = LayerConfig & {
  mesh: THREE.Mesh;
  texture: THREE.Texture | null;
  restY: number;
  hiddenY: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

/**
 * Three.js hero backdrop.
 *
 * One unlit sky plane far behind the camera carries the tall ScrollSky
 * panorama (deep space → atmosphere). Two transparent 2.5D layers — earth and
 * ground — rise through the scene at different depths and speeds as the page
 * scrolls, so the composition has real parallax rather than a flat image.
 *
 * Rendering is on-demand (scroll / resize / texture load): no idle loop.
 */
export default function HeroSkyScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#2a4170");

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
    camera.position.set(0, 0, 0);

    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];

    const loadTexture = (url: string) => {
      const texture = loader.load(url, () => {
        layout();
        render();
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      textures.push(texture);
      return texture;
    };

    const visibleHeightAt = (z: number) =>
      2 * Math.tan((camera.fov * Math.PI) / 360) * Math.abs(z);

    // ── Sky panorama ──────────────────────────────────────────────────────
    const skyGeometry = new THREE.PlaneGeometry(1, 1);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: loadTexture(SKY_URL),
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.set(0, 0, -50);
    scene.add(sky);

    // ── 2.5D story layers ─────────────────────────────────────────────────
    const layers: SceneLayer[] = HERO_LAYERS.map((config) => {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: loadTexture(config.url),
        transparent: true,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, config.z);
      scene.add(mesh);

      return {
        ...config,
        mesh,
        texture: material.map,
        restY: 0,
        hiddenY: 0,
      };
    });

    let frame = 0;
    let reducedMotion = false;
    let scrollProgress = 0;

    const layout = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";

      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();

      // Sky: 1600×6400 source (1:4), covers the frustum width at z = -50.
      const skyVisibleHeight = visibleHeightAt(sky.position.z);
      const skyVisibleWidth = skyVisibleHeight * camera.aspect;
      const skyWidth = skyVisibleWidth * 1.02;
      const skyHeight = skyWidth / 0.25;
      sky.scale.set(skyWidth, skyHeight, 1);

      // Story layers: height-cover sizing so portrait viewports keep the
      // composition instead of shrinking the art to a strip.
      for (const layer of layers) {
        const visibleHeight = visibleHeightAt(layer.z);
        const visibleWidth = visibleHeight * camera.aspect;

        const height2d = visibleHeight * layer.heightFactor;
        const minWidth2d = visibleWidth * layer.minWidthFactor;
        const width2d = Math.max(height2d * layer.imageAspect, minWidth2d);
        const finalHeight = width2d / layer.imageAspect;

        layer.mesh.scale.set(width2d, finalHeight, 1);
        layer.restY =
          -visibleHeight / 2 +
          finalHeight / 2 +
          layer.bottomInset * visibleHeight;
        layer.hiddenY = layer.restY - layer.hiddenOffset * visibleHeight;
      }
    };

    const render = () => {
      renderer.render(scene, camera);
    };

    const applyScroll = () => {
      frame = 0;

      const scrollable = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      scrollProgress = reducedMotion
        ? 0.55
        : clamp01(window.scrollY / scrollable);

      // Sky slides from the top of the panorama (space) to its bottom
      // (atmosphere), keeping the image's edges flush with the viewport.
      const skyVisibleHeight = visibleHeightAt(sky.position.z);
      const skyStartY = skyVisibleHeight / 2 - sky.scale.y / 2;
      const skyTravel = Math.max(0, sky.scale.y - skyVisibleHeight);
      sky.position.y = skyStartY + scrollProgress * skyTravel;

      // Each layer rises from below at its own pace.
      for (const layer of layers) {
        const local = clamp01(
          (scrollProgress - layer.startAt) / (layer.endAt - layer.startAt),
        );
        const eased = easeOutCubic(local);
        layer.mesh.position.y =
          layer.hiddenY + (layer.restY - layer.hiddenY) * eased;
      }

      render();
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(applyScroll);
    };

    const handleResize = () => {
      layout();
      applyScroll();
    };

    reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    layout();
    applyScroll();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", handleResize);
      if (frame) window.cancelAnimationFrame(frame);

      for (const layer of layers) {
        layer.mesh.geometry.dispose();
        (layer.mesh.material as THREE.MeshBasicMaterial).dispose();
      }

      skyGeometry.dispose();
      skyMaterial.dispose();
      for (const texture of textures) texture.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--color-primary-dark)]"
    >
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
