"use client";
import React, { useRef, useEffect } from "react";
import { ENTITY_CONFIG } from "./entityConfig";

interface SceneProps {
  personality: {
    mood: string;
    traits: string[];
    color: string;
    energy: number;
  };
  planet: string;
  isActive: boolean;
}

export default function PlanetScene({
  personality,
  planet,
  isActive,
}: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    let mounted = true;

    // Import Three.js
    import("three").then((THREE) => {
      if (!mounted) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        ENTITY_CONFIG.CAMERA.fov,
        containerRef.current!.clientWidth / containerRef.current!.clientHeight,
        0.1,
        1000,
      );
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });

      renderer.setSize(
        containerRef.current!.clientWidth,
        containerRef.current!.clientHeight,
      );
      renderer.setClearColor(0x0a0a0a, 0);
      containerRef.current!.appendChild(renderer.domElement);

      // Camera setup
      const cameraPos = ENTITY_CONFIG.CAMERA.defaultPosition;
      camera.position.set(...cameraPos);

      // Lighting
      const ambientLight = new THREE.AmbientLight(
        0xffffff,
        ENTITY_CONFIG.VISUALS.ambientIntensity,
      );
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(
        0xffffff,
        ENTITY_CONFIG.VISUALS.directionalIntensity,
      );
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Color
      const colorValue = new THREE.Color(personality.color || "#e29626");

      // Main sphere
      const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: colorValue,
        emissive: colorValue,
        emissiveIntensity: personality.energy * 0.8,
        metalness: ENTITY_CONFIG.VISUALS.metalness,
        roughness: ENTITY_CONFIG.VISUALS.roughness,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      scene.add(sphere);

      // Primary ring
      const primaryRingGeometry = new THREE.TorusGeometry(
        ENTITY_CONFIG.VISUALS.primaryRingScale(personality.energy),
        0.15,
        32,
        32,
      );
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: colorValue,
        emissive: colorValue,
        emissiveIntensity: personality.energy * 0.5,
        transparent: true,
        opacity: ENTITY_CONFIG.VISUALS.primaryRingOpacity,
      });
      const primaryRing = new THREE.Mesh(primaryRingGeometry, ringMaterial);
      primaryRing.rotation.x = Math.PI / 3;
      scene.add(primaryRing);

      // Secondary ring
      const secondaryRingGeometry = new THREE.TorusGeometry(
        ENTITY_CONFIG.VISUALS.secondaryRingScale(personality.energy),
        0.1,
        32,
        32,
      );
      const secondaryRingMaterial = new THREE.MeshStandardMaterial({
        color: colorValue,
        emissive: colorValue,
        emissiveIntensity: personality.energy * 0.3,
        transparent: true,
        opacity: ENTITY_CONFIG.VISUALS.secondaryRingOpacity,
      });
      const secondaryRing = new THREE.Mesh(
        secondaryRingGeometry,
        secondaryRingMaterial,
      );
      secondaryRing.rotation.z = Math.PI / 4.5;
      scene.add(secondaryRing);

      // Point light
      const pointLight = new THREE.PointLight(
        personality.color || "#e29626",
        personality.energy * 0.8,
      );
      pointLight.distance = ENTITY_CONFIG.VISUALS.pointLightDistance;
      scene.add(pointLight);

      // Store references
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      meshRef.current = { sphere, primaryRing, secondaryRing };

      // Mouse tracking for hover
      let isHovered = false;
      const onMouseEnter = () => {
        isHovered = true;
      };
      const onMouseLeave = () => {
        isHovered = false;
      };
      renderer.domElement.addEventListener("mouseenter", onMouseEnter);
      renderer.domElement.addEventListener("mouseleave", onMouseLeave);

      // Animation loop
      const clock = new THREE.Clock();
      const animate = () => {
        if (!mounted) return;
        animationIdRef.current = requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();
        const meshGroup = meshRef.current;

        // Idle float animation
        if (isActive) {
          meshGroup.sphere.position.y =
            Math.sin(elapsed * ENTITY_CONFIG.ANIMATION.idleFloatSpeed) *
            ENTITY_CONFIG.ANIMATION.idleFloatHeight;
          meshGroup.sphere.rotation.z =
            Math.sin(elapsed * 0.4) * ENTITY_CONFIG.ANIMATION.rotationIntensity;
          meshGroup.primaryRing.position.y = meshGroup.sphere.position.y;
          meshGroup.secondaryRing.position.y = meshGroup.sphere.position.y;
        }

        // Hover effect
        if (isHovered) {
          const scale = Math.min(
            meshGroup.sphere.scale.x +
              (ENTITY_CONFIG.ANIMATION.hoverScaleAmount -
                meshGroup.sphere.scale.x) *
                ENTITY_CONFIG.ANIMATION.hoverScaleLerp,
            ENTITY_CONFIG.ANIMATION.hoverScaleAmount,
          );
          meshGroup.sphere.scale.set(scale, scale, scale);
          meshGroup.primaryRing.scale.set(scale, scale, scale);
          meshGroup.secondaryRing.scale.set(scale, scale, scale);
          meshGroup.sphere.rotation.x += 0.01;
        } else {
          const scale = Math.max(
            meshGroup.sphere.scale.x -
              (meshGroup.sphere.scale.x - 1) *
                ENTITY_CONFIG.ANIMATION.hoverScaleLerp,
            1,
          );
          meshGroup.sphere.scale.set(scale, scale, scale);
          meshGroup.primaryRing.scale.set(scale, scale, scale);
          meshGroup.secondaryRing.scale.set(scale, scale, scale);
        }

        // Auto-rotate if not active
        if (!isActive && ENTITY_CONFIG.CAMERA.autoRotate) {
          meshGroup.sphere.rotation.y += 0.005;
          meshGroup.primaryRing.rotation.y += 0.003;
          meshGroup.secondaryRing.rotation.y += 0.002;
        }

        renderer.render(scene, camera);
      };

      animate();

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        mounted = false;
        window.removeEventListener("resize", handleResize);
        renderer.domElement.removeEventListener("mouseenter", onMouseEnter);
        renderer.domElement.removeEventListener("mouseleave", onMouseLeave);
        if (animationIdRef.current !== null) {
          cancelAnimationFrame(animationIdRef.current);
        }
        renderer.dispose();
        sphereGeometry.dispose();
        sphereMaterial.dispose();
        primaryRingGeometry.dispose();
        ringMaterial.dispose();
        secondaryRingGeometry.dispose();
        secondaryRingMaterial.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      };
    });

    return () => {
      mounted = false;
    };
  }, [personality, isActive]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
