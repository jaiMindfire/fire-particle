import * as THREE from "three";
import { useEffect } from "react";

const FireSimulation = () => {
  useEffect(() => {
    let scene, camera, renderer, fireParticles, smokeParticles;
    let fireAttributes = [],
      smokeAttributes = [];
    let fireLight;

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 8;

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      document.body.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      fireLight = new THREE.PointLight(0xff5500, 2, 15);
      fireLight.position.set(0, 1, 0);
      scene.add(fireLight);

      // Fire Particle System
      fireParticles = createParticleSystem(500, {
        texture: "/textures/fire.jpg",
        colorStart: new THREE.Color(1, 0.5, 0),
        colorEnd: new THREE.Color(1, 0, 0),
        sizeStart: 8,
        sizeEnd: 1,
        opacityStart: 1,
        opacityEnd: 0,
      });
      fireParticles.system.position.y = -3;
      fireAttributes = fireParticles.attributes;
      scene.add(fireParticles.system);

      // Smoke Particle System
      smokeParticles = createParticleSystem(100, {
        texture: "/textures/smoke.jpg",
        colorStart: new THREE.Color(0.4, 0.4, 0.4),
        colorEnd: new THREE.Color(0.1, 0.1, 0.1),
        sizeStart: 30,
        sizeEnd: 5,
        opacityStart: 0.6,
        opacityEnd: 0,
      });
      smokeParticles.system.position.y = -1.7;
      smokeAttributes = smokeParticles.attributes;
      scene.add(smokeParticles.system);

      // Add Wood Logs
      const logs = createWoodLogs();
      logs.forEach((log) => {
        log.position.set(
          (Math.random() - 0.5) * 0.5,
          -2.5,
          (Math.random() - 0.5) * 0.5
        );
        scene.add(log);
      });

      // Handle Window Resize
      window.addEventListener("resize", onWindowResize);

      // Animation Loop
      const animate = () => {
        requestAnimationFrame(animate);

        updateParticles(fireParticles, fireAttributes, {
          positionVariance: 0.1,
          flickerIntensity: 0.3,
        });

        updateSmokeParticles(smokeParticles.system, smokeAttributes);

        fireLight.intensity =
          2 + (Math.sin(Date.now() * 0.005) + (Math.random() - 0.5) * 0.3);

        renderer.render(scene, camera);
      };

      animate();

      // Cleanup on Unmount
      return () => {
        renderer.dispose();
        fireParticles.system.geometry.dispose();
        smokeParticles.system.geometry.dispose();
        document.body.removeChild(renderer.domElement);
        window.removeEventListener("resize", onWindowResize);
      };
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const createParticleSystem = (
      count,
      {
        texture,
        colorStart,
        colorEnd,
        sizeStart,
        sizeEnd,
        opacityStart,
        opacityEnd,
      }
    ) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const opacities = new Float32Array(count);

      const attributes = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 0.5; // x
        positions[i * 3 + 1] = 0; // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // z

        colors[i * 3] = colorStart.r;
        colors[i * 3 + 1] = colorStart.g;
        colors[i * 3 + 2] = colorStart.b;

        sizes[i] = sizeStart;
        opacities[i] = opacityStart;

        attributes.push({
          velocity: new THREE.Vector3(0, Math.random() * 0.1 + 0.05, 0),
          lifespan: Math.random() * 100 + 50,
        });
      }

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));

      const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        map: new THREE.TextureLoader().load(texture),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      return { system: new THREE.Points(geometry, material), attributes };
    };

    const createWoodLogs = () => {
      const logGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 32);
      const logTexture = new THREE.TextureLoader().load("/textures/wood.jpg");
      const logMaterial = new THREE.MeshStandardMaterial({ map: logTexture });

      const logs = [];
      for (let i = 0; i < 3; i++) {
        const log = new THREE.Mesh(logGeometry, logMaterial);
        log.rotation.x = Math.PI / 4;
        logs.push(log);
      }
      return logs;
    };

    const updateParticles = (particleSystem, attributes, options) => {
      const { system } = particleSystem;
      const positions = system.geometry.attributes.position.array;

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += attributes[i].velocity.y;
        positions[i * 3] +=
          (Math.random() - 0.5) * options.flickerIntensity || 0;
        positions[i * 3 + 2] +=
          (Math.random() - 0.5) * options.flickerIntensity || 0;

        attributes[i].lifespan--;

        if (attributes[i].lifespan <= 0) {
          positions[i * 3] = (Math.random() - 0.5) * 0.5;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

          attributes[i].lifespan = Math.random() * 100 + 50;
        }
      }

      system.geometry.attributes.position.needsUpdate = true;
    };

    const updateSmokeParticles = (particleSystem, attributes) => {
      const positions = particleSystem.geometry.attributes.position.array;

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += (Math.random() - 0.5) * 0.01;
        positions[i * 3 + 1] += attributes[i].velocity.y;
        positions[i * 3 + 2] += (Math.random() - 0.5) * 0.01;

        attributes[i].lifespan--;

        if (attributes[i].lifespan <= 0) {
          positions[i * 3] = (Math.random() - 0.5) * 0.5;
          positions[i * 3 + 1] = -1.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

          attributes[i].lifespan = Math.random() * 100 + 50;
        }
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
    };

    return init();
  }, []);

  return null;
};

export default FireSimulation;
