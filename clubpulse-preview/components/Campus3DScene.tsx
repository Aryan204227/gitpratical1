'use client';

import { useEffect, useRef } from 'react';

type CampusVariant = 'landing' | 'dashboard' | 'auth';

/**
 * Small, transparent WebGL campus scene. It loads Three.js only on the client,
 * caps pixel ratio for mobile devices, respects reduced motion, and falls back
 * to the CSS illustration if WebGL is unavailable.
 */
export function Campus3DScene({ variant = 'landing' }: { variant?: CampusVariant }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    let cancelled = false;
    let frameId = 0;
    let renderer: import('three').WebGLRenderer | null = null;
    let scene: import('three').Scene | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let cameraTargetX = 0;
    let cameraTargetY = 0;
    let cleanupScene: (() => void) | null = null;

    const onPointerMove = (event: PointerEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      pointerX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointerY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    import('three').then((THREE) => {
      if (cancelled || !container) return;

      try {
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const localScene = new THREE.Scene();
        scene = localScene;

        const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
        camera.position.set(variant === 'auth' ? 0 : 0, variant === 'dashboard' ? 5.4 : variant === 'auth' ? 2.25 : 5.8, variant === 'dashboard' ? 9.9 : variant === 'auth' ? 7.6 : 10.7);
        camera.lookAt(0, variant === 'auth' ? 1.12 : 0.15, 0);

        const localRenderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: width > 460,
          powerPreference: 'low-power',
          premultipliedAlpha: false,
        });
        renderer = localRenderer;
        localRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        localRenderer.setSize(width, height, false);
        localRenderer.setClearColor(0x000000, 0);
        localRenderer.outputColorSpace = THREE.SRGBColorSpace;
        localRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        localRenderer.toneMappingExposure = 1.24;
        localRenderer.domElement.className = 'cp-campus-webgl-canvas';
        localRenderer.domElement.setAttribute('aria-hidden', 'true');
        container.appendChild(localRenderer.domElement);
        container.classList.add('is-ready');
        container.parentElement?.classList.add('cp-webgl-ready');

        localScene.add(new THREE.AmbientLight(0x97d8e1, 1.55));
        const keyLight = new THREE.DirectionalLight(0xe4f8ff, 2.3);
        keyLight.position.set(-4, 8, 5);
        localScene.add(keyLight);
        const limeLight = new THREE.PointLight(0xc6ff3d, 8, 10);
        limeLight.position.set(0, 2.2, 0);
        localScene.add(limeLight);
        const cyanLight = new THREE.PointLight(0x00e5d5, 7, 12);
        cyanLight.position.set(-3.5, 1.3, 2.2);
        localScene.add(cyanLight);
        const violetLight = new THREE.PointLight(0x8275ff, 5, 11);
        violetLight.position.set(3.1, 2.5, -2.1);
        localScene.add(violetLight);

        const campus = new THREE.Group();
        localScene.add(campus);
        campus.scale.setScalar(variant === 'dashboard' ? 0.72 : variant === 'auth' ? 0 : 1);

        const platformMaterial = new THREE.MeshStandardMaterial({
          color: 0x152c3b, roughness: 0.35, metalness: 0.62,
          emissive: 0x031d23, emissiveIntensity: 0.7,
        });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 4.2, 0.46, 8, 1), platformMaterial);
        base.position.y = -0.2;
        base.rotation.y = Math.PI / 8;
        campus.add(base);

        const deckMaterial = new THREE.MeshStandardMaterial({
          color: 0x183b3d, roughness: 0.3, metalness: 0.58,
          emissive: 0x07342c, emissiveIntensity: 0.85,
        });
        const deck = new THREE.Mesh(new THREE.CylinderGeometry(3.74, 3.85, 0.16, 8, 1), deckMaterial);
        deck.position.y = 0.09;
        deck.rotation.y = Math.PI / 8;
        campus.add(deck);

        const trimMaterial = new THREE.MeshBasicMaterial({ color: 0xc6ff3d, transparent: true, opacity: 0.8 });
        const cyanTrimMaterial = new THREE.MeshBasicMaterial({ color: 0x00e5d5, transparent: true, opacity: 0.8 });
        const baseTrim = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.025, 8, 120), trimMaterial);
        baseTrim.rotation.x = Math.PI / 2;
        baseTrim.position.y = 0.15;
        campus.add(baseTrim);
        const lowerTrim = new THREE.Mesh(new THREE.TorusGeometry(4.07, 0.016, 6, 120), cyanTrimMaterial);
        lowerTrim.rotation.x = Math.PI / 2;
        lowerTrim.position.y = -0.28;
        campus.add(lowerTrim);

        const windowGeometry = new THREE.BoxGeometry(0.045, 0.065, 0.014);
        const windowMaterials = [
          new THREE.MeshBasicMaterial({ color: 0xc6ff3d }),
          new THREE.MeshBasicMaterial({ color: 0x61f5e2 }),
          new THREE.MeshBasicMaterial({ color: 0x9286ff }),
        ];
        const edgeMaterials = [
          new THREE.LineBasicMaterial({ color: 0xc6ff3d, transparent: true, opacity: 0.72 }),
          new THREE.LineBasicMaterial({ color: 0x54f5e4, transparent: true, opacity: 0.76 }),
          new THREE.LineBasicMaterial({ color: 0x9b8cff, transparent: true, opacity: 0.72 }),
        ];
        const buildingMaterial = new THREE.MeshStandardMaterial({
          color: 0x12263a, roughness: 0.28, metalness: 0.74,
          emissive: 0x071726, emissiveIntensity: 1.0,
        });

        function addBuilding(x: number, z: number, w: number, h: number, d: number, tint: number) {
          const building = new THREE.Group();
          building.position.set(x, 0.17, z);
          const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMaterial);
          body.position.y = h / 2;
          building.add(body);
          const edge = new THREE.LineSegments(
            new THREE.EdgesGeometry(body.geometry),
            edgeMaterials[tint % edgeMaterials.length],
          );
          edge.position.copy(body.position);
          building.add(edge);

          const roof = new THREE.Mesh(
            new THREE.BoxGeometry(w * 1.12, 0.055, d * 1.12),
            windowMaterials[tint % windowMaterials.length],
          );
          roof.position.y = h + 0.025;
          building.add(roof);

          const columns = Math.max(2, Math.floor(w / 0.15));
          const rows = Math.max(2, Math.floor(h / 0.22));
          const spacingX = w / (columns + 0.5);
          const spacingY = h / (rows + 1);
          for (let row = 1; row <= rows; row += 1) {
            for (let col = 1; col <= columns; col += 1) {
              const windowMesh = new THREE.Mesh(windowGeometry, windowMaterials[(tint + row + col) % windowMaterials.length]);
              windowMesh.position.set(
                -w / 2 + col * spacingX,
                row * spacingY,
                d / 2 + 0.009,
              );
              building.add(windowMesh);
            }
          }
          campus.add(building);
        }

        addBuilding(-1.95, -0.2, 0.58, 0.78, 0.62, 1);
        addBuilding(-1.28, 0.78, 0.52, 1.36, 0.55, 0);
        addBuilding(-0.54, -1.0, 0.79, 0.68, 0.72, 2);
        addBuilding(0.37, -0.55, 0.57, 1.05, 0.6, 1);
        addBuilding(1.22, 0.45, 0.64, 1.48, 0.58, 0);
        addBuilding(2.03, -0.45, 0.46, 0.86, 0.52, 1);
        addBuilding(0.25, 1.35, 0.74, 0.74, 0.65, 2);
        addBuilding(-0.75, 1.52, 0.42, 0.58, 0.5, 0);

        const centralTower = new THREE.Group();
        centralTower.position.set(0.14, 0.18, 0.37);
        const spire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.18, 1.48, 6, 1),
          new THREE.MeshStandardMaterial({
            color: 0xc6ff3d, emissive: 0xc6ff3d, emissiveIntensity: 2.1,
            metalness: 0.48, roughness: 0.18,
          }),
        );
        spire.position.y = 0.78;
        centralTower.add(spire);
        const beacon = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.19, 0),
          new THREE.MeshBasicMaterial({ color: 0xdfff76 }),
        );
        beacon.position.y = 1.62;
        centralTower.add(beacon);
        const beaconGlow = new THREE.Mesh(
          new THREE.SphereGeometry(0.36, 20, 16),
          new THREE.MeshBasicMaterial({ color: 0xc6ff3d, transparent: true, opacity: 0.08, depthWrite: false }),
        );
        beaconGlow.position.y = 1.62;
        centralTower.add(beaconGlow);
        campus.add(centralTower);

        const campusRing = new THREE.Mesh(new THREE.TorusGeometry(4.35, 0.012, 6, 150), cyanTrimMaterial);
        campusRing.position.set(0, 0.3, 0);
        campusRing.rotation.set(1.16, 0.05, -0.25);
        localScene.add(campusRing);
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(4.9, 0.01, 6, 150), trimMaterial);
        orbit.position.set(0, 0.48, 0);
        orbit.rotation.set(1.28, -0.14, 0.48);
        localScene.add(orbit);
        const farOrbit = new THREE.Mesh(
          new THREE.TorusGeometry(5.45, 0.006, 5, 150),
          new THREE.MeshBasicMaterial({ color: 0x9185ff, transparent: true, opacity: 0.46 }),
        );
        farOrbit.position.set(0, 0.4, -0.2);
        farOrbit.rotation.set(1.42, 0.18, -0.78);
        localScene.add(farOrbit);

        const planet = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 32, 24),
          new THREE.MeshPhysicalMaterial({
            color: 0x4b78bc, roughness: 0.34, metalness: 0.25,
            emissive: 0x101c43, emissiveIntensity: 0.75, clearcoat: 0.75,
          }),
        );
        planet.position.set(3.4, 2.35, -1.25);
        localScene.add(planet);
        const planetRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 80), cyanTrimMaterial);
        planetRing.position.copy(planet.position);
        planetRing.rotation.set(0.7, 0.2, -0.35);
        localScene.add(planetRing);
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 18, 16),
          new THREE.MeshBasicMaterial({ color: 0xc6ff3d }),
        );
        moon.position.set(2.73, 2.08, -1.1);
        localScene.add(moon);

        const characterGroup = new THREE.Group();
        localScene.add(characterGroup);

        if (variant === 'auth') {
          campus.visible = false;
          campusRing.visible = false;
          orbit.visible = false;
          farOrbit.visible = false;

          const skyline = new THREE.Group();
          localScene.add(skyline);
          const skylineMats = [
            new THREE.MeshStandardMaterial({ color: 0x101f35, roughness: 0.5, metalness: 0.3, emissive: 0x061b30, emissiveIntensity: 0.8 }),
            new THREE.MeshStandardMaterial({ color: 0x18203c, roughness: 0.45, metalness: 0.35, emissive: 0x0b1034, emissiveIntensity: 0.9 }),
            new THREE.MeshStandardMaterial({ color: 0x103038, roughness: 0.4, metalness: 0.35, emissive: 0x032925, emissiveIntensity: 0.9 }),
          ];
          const cityWindowMats = [
            new THREE.MeshBasicMaterial({ color: 0x4bded6 }),
            new THREE.MeshBasicMaterial({ color: 0xc6ff3d }),
            new THREE.MeshBasicMaterial({ color: 0x9286ff }),
          ];
          const cityWindowGeometry = new THREE.BoxGeometry(0.035, 0.06, 0.014);
          const cityHeights = [1.0,1.65,1.25,2.05,1.45,2.42,1.22,1.82,1.35,2.2,1.48,2.5,1.17,1.95,1.38,1.72,1.06,2.15];
          cityHeights.forEach((height, index) => {
            const width = 0.34 + (index % 3) * 0.08;
            const depth = 0.25 + (index % 2) * 0.08;
            const building = new THREE.Group();
            const x = -4.25 + index * 0.5;
            const z = -1.25 - (index % 4) * 0.18;
            const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), skylineMats[index % skylineMats.length]);
            body.position.set(x, height / 2 - 0.1, z);
            building.add(body);
            const edge = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), edgeMaterials[index % edgeMaterials.length]);
            edge.position.copy(body.position);
            building.add(edge);
            const rows = Math.max(2, Math.floor(height / 0.23));
            for (let row = 1; row <= rows; row += 1) {
              for (let col = 0; col < 2; col += 1) {
                const light = new THREE.Mesh(cityWindowGeometry, cityWindowMats[(index + row + col) % cityWindowMats.length]);
                light.position.set(x - width * 0.22 + col * width * 0.43, row * height / (rows + 1), z + depth / 2 + 0.009);
                building.add(light);
              }
            }
            skyline.add(building);
          });

          const groundGrid = new THREE.GridHelper(14, 32, 0x23d9ca, 0x14394c);
          groundGrid.position.y = -0.06;
          (groundGrid.material as THREE.Material).transparent = true;
          (groundGrid.material as THREE.Material).opacity = 0.42;
          skyline.add(groundGrid);

          const hoodie = new THREE.MeshStandardMaterial({
            color: 0x0b1422, roughness: 0.65, metalness: 0.1,
            emissive: 0x07141c, emissiveIntensity: 0.8,
          });
          const jacket = new THREE.Mesh(
            new THREE.CylinderGeometry(0.33, 0.57, 1.1, 7, 1, false),
            hoodie,
          );
          jacket.position.set(-0.6, 0.87, 0.25);
          characterGroup.add(jacket);

          const hood = new THREE.Mesh(
            new THREE.SphereGeometry(0.37, 14, 10),
            new THREE.MeshStandardMaterial({
              color: 0x111d2d, roughness: 0.72, metalness: 0.08,
              emissive: 0x0a111f, emissiveIntensity: 0.5,
            }),
          );
          hood.position.set(-0.6, 1.67, 0.25);
          hood.scale.set(1.04, 1.05, 0.91);
          characterGroup.add(hood);
          const hoodRim = new THREE.Mesh(
            new THREE.TorusGeometry(0.31, 0.035, 6, 32, Math.PI),
            new THREE.MeshBasicMaterial({ color: 0x263d4a }),
          );
          hoodRim.position.set(-0.6, 1.67, 0.48);
          hoodRim.rotation.z = Math.PI;
          characterGroup.add(hoodRim);

          const pack = new THREE.Mesh(
            new THREE.BoxGeometry(0.48, 0.65, 0.22),
            new THREE.MeshStandardMaterial({ color: 0x142235, roughness: 0.45, metalness: 0.25, emissive: 0x08181d, emissiveIntensity: 0.8 }),
          );
          pack.position.set(-0.6, 0.98, 0.56);
          characterGroup.add(pack);
          const packSeam = new THREE.Mesh(
            new THREE.BoxGeometry(0.022, 0.42, 0.02),
            new THREE.MeshBasicMaterial({ color: 0xc6ff3d }),
          );
          packSeam.position.set(-0.69, 1.0, 0.682);
          characterGroup.add(packSeam);

          const armGeometry = new THREE.CylinderGeometry(0.105, 0.14, 0.84, 7);
          const leftArm = new THREE.Mesh(armGeometry, hoodie);
          leftArm.position.set(-1.04, 0.85, 0.26);
          leftArm.rotation.z = -0.18;
          characterGroup.add(leftArm);
          const rightArm = new THREE.Mesh(armGeometry, hoodie);
          rightArm.position.set(-0.16, 0.85, 0.26);
          rightArm.rotation.z = 0.18;
          characterGroup.add(rightArm);

          const legGeometry = new THREE.CylinderGeometry(0.13, 0.16, 0.7, 6);
          const leftLeg = new THREE.Mesh(legGeometry, hoodie);
          leftLeg.position.set(-0.78, 0.18, 0.18);
          characterGroup.add(leftLeg);
          const rightLeg = new THREE.Mesh(legGeometry, hoodie);
          rightLeg.position.set(-0.42, 0.18, 0.18);
          characterGroup.add(rightLeg);

          const characterEdge = new THREE.Mesh(
            new THREE.TorusGeometry(0.66, 0.012, 5, 60),
            new THREE.MeshBasicMaterial({ color: 0x00e5d5, transparent: true, opacity: 0.45 }),
          );
          characterEdge.position.set(-0.6, 0.92, 0.1);
          characterEdge.rotation.x = Math.PI / 2;
          characterGroup.add(characterEdge);

          const skylineGlow = new THREE.PointLight(0x00e5d5, 4.2, 8);
          skylineGlow.position.set(-2.8, 1.7, 0.5);
          localScene.add(skylineGlow);
          const skylineViolet = new THREE.PointLight(0x7568ff, 3.7, 8);
          skylineViolet.position.set(3.0, 2.0, -0.2);
          localScene.add(skylineViolet);
        }

        const starPositions = new Float32Array(390 * 3);
        for (let i = 0; i < 390; i += 1) {
          const a = i * 12.9898;
          starPositions[i * 3] = Math.sin(a * 0.97) * 8.4;
          starPositions[i * 3 + 1] = Math.cos(a * 1.73) * 4.5 + 0.8;
          starPositions[i * 3 + 2] = Math.sin(a * 2.37) * 5.3 - 1.4;
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const stars = new THREE.Points(
          starGeometry,
          new THREE.PointsMaterial({ color: 0xd9fffc, size: 0.025, transparent: true, opacity: 0.85, depthWrite: false }),
        );
        localScene.add(stars);

        const resize = () => {
          if (!container || !renderer) return;
          const nextWidth = Math.max(1, container.clientWidth);
          const nextHeight = Math.max(1, container.clientHeight);
          camera.aspect = nextWidth / nextHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(nextWidth, nextHeight, false);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        };
        resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
        resizeObserver?.observe(container);
        window.addEventListener('resize', resize, { passive: true });

        const clock = new THREE.Clock();
        const renderFrame = () => {
          if (cancelled || !renderer) return;
          frameId = window.requestAnimationFrame(renderFrame);
          const elapsed = clock.getElapsedTime();
          if (!reducedMotion) {
            campus.rotation.y = Math.sin(elapsed * 0.15) * 0.045 + Math.sin(elapsed * 0.42) * 0.018;
            campus.position.y = Math.sin(elapsed * 0.8) * 0.035;
            centralTower.rotation.y = Math.sin(elapsed * 0.6) * 0.06;
            beacon.rotation.y = elapsed * 0.3;
            campusRing.rotation.z += 0.0007;
            orbit.rotation.z -= 0.00055;
            farOrbit.rotation.z += 0.00035;
            planet.rotation.y = elapsed * 0.1;
            planetRing.rotation.y = elapsed * 0.13;
            moon.position.x = 3.4 + Math.cos(elapsed * 0.38) * 0.66;
            moon.position.z = -1.25 + Math.sin(elapsed * 0.38) * 0.42;
            cameraTargetX += (pointerX * 0.48 - cameraTargetX) * 0.025;
            cameraTargetY += (pointerY * 0.12 - cameraTargetY) * 0.025;
            camera.position.x = cameraTargetX;
            camera.position.y = (variant === 'dashboard' ? 5.4 : variant === 'auth' ? 2.25 : 5.8) - cameraTargetY;
            camera.lookAt(0, variant === 'auth' ? 1.12 : 0.15, 0);
            characterGroup.position.y = variant === 'auth' ? Math.sin(elapsed * 0.75) * 0.018 : 0;
          }
          renderer.render(localScene, camera);
        };
        resize();
        if (reducedMotion) {
          renderer.render(localScene, camera);
        } else {
          frameId = window.requestAnimationFrame(renderFrame);
        }

        cleanupScene = () => {
          window.removeEventListener('resize', resize);
          resizeObserver?.disconnect();
          localScene.traverse((object) => {
            const renderable = object as import('three').Mesh;
            if (renderable.geometry?.dispose) renderable.geometry.dispose();
            if (renderable.material) {
              const materials = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
              materials.forEach((material) => material.dispose());
            }
          });
          localRenderer.dispose();
          localRenderer.domElement.remove();
          container.classList.remove('is-ready');
          container.parentElement?.classList.remove('cp-webgl-ready');
        };
      } catch {
        container.classList.add('webgl-fallback');
      }
    }).catch(() => {
      if (!cancelled && container) container.classList.add('webgl-fallback');
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      resizeObserver?.disconnect();
      cleanupScene?.();
      if (renderer && container.contains(renderer.domElement)) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [variant]);

  return <div ref={host} className={'cp-webgl-scene cp-webgl-scene-' + variant} aria-hidden="true"/>;
}
