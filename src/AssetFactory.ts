import * as THREE from 'three';
import { HubData } from './data';

// --- TEXTURE GENERATORS ---

export const createPlanetTexture = (baseColor: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#' + baseColor.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 8000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        ctx.beginPath();
        ctx.arc(Math.random() * 1024, Math.random() * 512, Math.random() * 12, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let y = 0; y < 512; y += Math.random() * 20 + 10) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
        ctx.fillRect(0, y, 1024, Math.random() * 30);
        
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
        ctx.fillRect(0, y + 10, 1024, Math.random() * 20);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export const createRingTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 256, 1);
    
    const drawBand = (uStart: number, uEnd: number, color: string) => {
        const xStart = Math.floor(uStart * 256);
        const width = Math.ceil((uEnd - uStart) * 256);
        ctx.fillStyle = color;
        ctx.fillRect(xStart, 0, width, 1);
    };

    // Saturn-like bands
    drawBand(0.0, 0.1, 'rgba(180, 160, 130, 0.1)'); // Inner faint
    drawBand(0.1, 0.4, 'rgba(210, 190, 150, 0.8)'); // B ring
    drawBand(0.4, 0.45, 'rgba(0, 0, 0, 0.0)');      // Cassini Division
    drawBand(0.45, 0.7, 'rgba(190, 170, 130, 0.7)'); // A ring
    drawBand(0.7, 0.75, 'rgba(0, 0, 0, 0.0)');      // Encke Gap
    drawBand(0.75, 0.9, 'rgba(170, 150, 120, 0.5)'); // Outer A ring
    drawBand(0.9, 1.0, 'rgba(120, 110, 90, 0.2)');   // F ring

    // Add fine noise
    for(let i=0; i<256; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
        ctx.fillRect(i, 0, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export const createAtmosphereGlow = (radius: number, color: number) => {
    const group = new THREE.Group();
    
    // Custom Shader for Outer Atmosphere Glow
    const atmosphereGeo = new THREE.SphereGeometry(radius * 1.25, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                // Calculate fresnel effect for outer glow
                float intensity = pow(0.55 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                vec3 glowColor = vec3(${((color >> 16) & 255) / 255}, ${((color >> 8) & 255) / 255}, ${(color & 255) / 255});
                // Darker, richer color with higher intensity
                gl_FragColor = vec4(glowColor * 0.4, intensity * 3.5);
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    group.add(atmosphere);

    // Custom Shader for Inner Edge Glow
    const innerGlowGeo = new THREE.SphereGeometry(radius * 1.01, 64, 64);
    const innerGlowMat = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                // Calculate fresnel effect for inner edge glow
                float intensity = pow(1.0 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
                vec3 glowColor = vec3(${((color >> 16) & 255) / 255}, ${((color >> 8) & 255) / 255}, ${(color & 255) / 255});
                // Subtle, dark inner glow
                gl_FragColor = vec4(glowColor * 0.3, intensity * 1.5);
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);
    
    return group;
};

// --- MESH FACTORIES ---

export const createPlanetMesh = (h: HubData, isLowEnd: boolean) => {
    const textureLoader = new THREE.TextureLoader();
    const ringTexture = createRingTexture();

    let geo;
    if (h.geometryType === 'torus') geo = new THREE.TorusGeometry(h.radius, h.radius * 0.4, isLowEnd ? 16 : 32, isLowEnd ? 16 : 64);
    else if (h.geometryType === 'icosahedron') geo = new THREE.IcosahedronGeometry(h.radius, isLowEnd ? 0 : 1);
    else geo = new THREE.SphereGeometry(h.radius, isLowEnd ? 16 : 64, isLowEnd ? 16 : 64);

    // Load textures if available, otherwise fallback to procedural
    let mapTex = (!isLowEnd && h.textureUrl) ? textureLoader.load(h.textureUrl) : createPlanetTexture(h.color);
    if (mapTex) mapTex.colorSpace = THREE.SRGBColorSpace;
    
    let normalTex = (!isLowEnd && h.normalUrl) ? textureLoader.load(h.normalUrl) : null;
    let specularTex = (!isLowEnd && h.specularUrl) ? textureLoader.load(h.specularUrl) : null;

    // Use MeshPhysicalMaterial for realistic planets
    const mat = isLowEnd ? new THREE.MeshLambertMaterial({
        color: h.color,
        map: mapTex,
        wireframe: h.geometryType === 'icosahedron'
    }) : new THREE.MeshPhysicalMaterial({ 
        color: h.textureUrl ? 0xffffff : h.color, // Base color is white if using real texture
        map: mapTex,
        normalMap: normalTex,
        roughnessMap: specularTex, // Use specular as roughness approximation
        roughness: h.specularUrl ? 1.0 : 0.7, // Let roughness map control it
        metalness: 0.1,
        clearcoat: 0.1,
        clearcoatRoughness: 0.8,
        wireframe: h.geometryType === 'icosahedron' 
    }); 
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = !isLowEnd;
    mesh.receiveShadow = !isLowEnd;
    
    // Add Cloud Layer if URL exists
    if (!isLowEnd && h.cloudsUrl) {
        const cloudGeo = new THREE.SphereGeometry(h.radius * 1.01, 64, 64);
        const cloudTex = textureLoader.load(h.cloudsUrl);
        cloudTex.colorSpace = THREE.SRGBColorSpace;
        const cloudMat = new THREE.MeshLambertMaterial({
            map: cloudTex,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        cloudMesh.userData = { isCloud: true, rotationSpeed: 0.002 };
        mesh.add(cloudMesh);
    }

    // Add Night Lights Layer
    if (!isLowEnd && h.nightUrl) {
        const nightTex = textureLoader.load(h.nightUrl);
        nightTex.colorSpace = THREE.SRGBColorSpace;
        const nightGeo = new THREE.SphereGeometry(h.radius * 1.002, 64, 64);
        const nightMat = new THREE.ShaderMaterial({
            uniforms: {
                nightTexture: { value: nightTex }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vUv = uv;
                    vNormal = normalize(mat3(modelMatrix) * normal);
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D nightTexture;
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vec4 nightColor = texture2D(nightTexture, vUv);
                    // Sun is at origin (0,0,0). Direction to sun is -vWorldPosition
                    vec3 sunDir = normalize(-vWorldPosition);
                    float lightIntensity = dot(normalize(vNormal), sunDir);
                    
                    // Smooth transition at the terminator line
                    float nightIntensity = smoothstep(0.1, -0.2, lightIntensity);
                    
                    // Boost the brightness of the lights slightly
                    gl_FragColor = vec4(nightColor.rgb * nightIntensity * 1.5, nightIntensity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const nightMesh = new THREE.Mesh(nightGeo, nightMat);
        mesh.add(nightMesh);
    }

    // Add Atmosphere Glow (Fresnel Approximation)
    if (!isLowEnd && h.geometryType === 'sphere') {
        const atmosphereGlow = createAtmosphereGlow(h.radius, h.color);
        mesh.add(atmosphereGlow);
    }
    
    if (h.hasRing && ringTexture) { 
        const innerRadius = h.radius * 1.4;
        const outerRadius = h.radius * 2.6;
        const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, isLowEnd ? 32 : 128); 
        
        // Fix UVs to be radial (u = radius, v = angle)
        const pos = ringGeo.attributes.position;
        const uvs = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const radius = Math.sqrt(x*x + y*y);
            const u = (radius - innerRadius) / (outerRadius - innerRadius);
            uvs.setXY(i, u, 0); // v doesn't matter for a 1D texture
        }
        
        const ringMat = isLowEnd ? new THREE.MeshBasicMaterial({
            map: ringTexture,
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            alphaTest: 0.01
        }) : new THREE.MeshPhysicalMaterial({ 
            map: ringTexture,
            color: 0xffffff,
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.9, 
            roughness: 0.8, 
            metalness: 0.1,
            alphaMap: ringTexture,
            alphaTest: 0.01
        }); 
        const ring = new THREE.Mesh(ringGeo, ringMat); 
        ring.rotation.x = -Math.PI / 2; 
        ring.rotation.y = Math.PI / 12; 
        ring.receiveShadow = !isLowEnd;
        ring.castShadow = !isLowEnd;
        mesh.add(ring); 
    }
    
    if (h.geometryType === 'icosahedron') {
        const innerGeo = new THREE.IcosahedronGeometry(h.radius * 0.6, 0);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        mesh.add(inner);
    }

    return mesh;
};

export const createUFOMesh = (isLowEnd: boolean, color: number = 0x00ffcc) => {
    const ufoGroup = new THREE.Group();
    ufoGroup.userData = { isDragging: false, type: 'ufo' };
    
    // 1. Dark, Reflective Hull
    const ufoBodyGeo = new THREE.CylinderGeometry(3.5, 1.5, 1.2, isLowEnd ? 24 : 32);
    const ufoMat = isLowEnd ? new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5, metalness: 0.5 }) : new THREE.MeshPhysicalMaterial({ 
        color: 0xdddddd, 
        emissive: 0x444444,
        metalness: 0.6, 
        roughness: 0.2, 
        clearcoat: 1.0, 
        clearcoatRoughness: 0.1 
    });
    const ufoBody = new THREE.Mesh(ufoBodyGeo, ufoMat);
    ufoGroup.add(ufoBody);
    
    // 2. Glass Dome
    const ufoDomeGeo = new THREE.SphereGeometry(2, isLowEnd ? 24 : 32, isLowEnd ? 12 : 16, 0, Math.PI*2, 0, Math.PI/2);
    const ufoDomeMat = isLowEnd ? new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.8, roughness: 0.1, metalness: 0.1 }) : new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, 
        transmission: 0.95, 
        opacity: 1, 
        transparent: true, 
        roughness: 0.05, 
        metalness: 0.1,
        ior: 1.5,
        thickness: 0.5
    });
    const ufoDome = new THREE.Mesh(ufoDomeGeo, ufoDomeMat);
    ufoDome.position.y = 0.5;
    ufoGroup.add(ufoDome);
    
    // 3. Spinning Outer Ring with Glowing Nodes
    const ringGroup = new THREE.Group();
    const ufoRingGeo = new THREE.TorusGeometry(4, 0.15, isLowEnd ? 6 : 16, isLowEnd ? 16 : 64);
    const ufoRingMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        metalness: 0.9, 
        roughness: 0.4 
    });
    const ufoRing = new THREE.Mesh(ufoRingGeo, ufoRingMat);
    ringGroup.add(ufoRing);

    // Add glowing nodes to the ring
    if (!isLowEnd) {
        const nodeGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const nodeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: color,
            emissiveIntensity: 2.0,
            toneMapped: false
        });
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            node.position.set(Math.cos(angle) * 4, 0, Math.sin(angle) * 4);
            ringGroup.add(node);
        }
    }
    ufoGroup.add(ringGroup); // This is children[2], which gets rotated in the animation loop
    
    // 4. Glowing Core inside the dome
    const coreGeo = new THREE.CylinderGeometry(0.5, 1.0, 1.0, isLowEnd ? 8 : 16);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: color,
        emissiveIntensity: isLowEnd ? 1.0 : 3.0,
        toneMapped: !isLowEnd
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 1.0;
    ufoGroup.add(core);

    // 5. Dynamic Lighting
    if (!isLowEnd) {
        const ufoLight = new THREE.PointLight(color, 5, 40);
        ufoLight.position.y = 1.0;
        ufoGroup.add(ufoLight);
    }
    
    return ufoGroup;
};

export const createShipMesh = (isLowEnd: boolean, color: number = 0xff4400) => {
    const shipGroup = new THREE.Group();
    shipGroup.userData = { isDragging: false, type: 'ship' };
    
    // 1. Pure White, Reflective Hull
    const shipMat = isLowEnd ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.5 }) : new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, 
        emissive: 0xaaaaaa, // Increased to make it look whiter
        emissiveIntensity: 0.2,
        metalness: 0.3, 
        roughness: 0.2, 
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
    });

    // Glowing accent material
    const accentMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: color,
        emissiveIntensity: isLowEnd ? 1.5 : 3.0,
        toneMapped: !isLowEnd
    });

    // Red UFO-like glow material
    const redGlowMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: isLowEnd ? 2.0 : 5.0,
        toneMapped: !isLowEnd
    });

    // Add pulse animation logic to userData
    shipGroup.userData = {
        ...shipGroup.userData,
        pulsePhase: Math.random() * Math.PI * 2,
        update: (time: number) => {
            if (isLowEnd) return;
            const pulse = (Math.sin(time * 3 + shipGroup.userData.pulsePhase) + 1) * 0.5;
            redGlowMat.emissiveIntensity = 3.0 + pulse * 4.0;
            shipMat.emissiveIntensity = 0.2 + pulse * 0.1;
        }
    };
    
    const shipBodyGeo = new THREE.CapsuleGeometry(1.2, 6, isLowEnd ? 8 : 16, isLowEnd ? 8 : 16);
    const shipBody = new THREE.Mesh(shipBodyGeo, shipMat);
    shipBody.rotation.x = -Math.PI / 2; 
    shipGroup.add(shipBody);
    
    const wingGeo = new THREE.ConeGeometry(4, 8, isLowEnd ? 3 : 3);
    const wing = new THREE.Mesh(wingGeo, shipMat);
    wing.rotation.x = -Math.PI / 2;
    wing.rotation.z = Math.PI / 2;
    wing.scale.set(1, 1, 0.1);
    wing.position.set(0, 0, 1);
    shipGroup.add(wing);

    // Wing Accents (Glowing strips)
    if (!isLowEnd) {
        const wingAccentGeo = new THREE.BoxGeometry(7.5, 0.2, 0.2);
        const wingAccent = new THREE.Mesh(wingAccentGeo, accentMat);
        wingAccent.position.set(0, 0, 1.5);
        shipGroup.add(wingAccent);

        // Red Glowing Wing Tips (UFO style)
        const lightGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const lightLeft = new THREE.Mesh(lightGeo, redGlowMat);
        lightLeft.position.set(4, 0, 1);
        shipGroup.add(lightLeft);

        const lightRight = new THREE.Mesh(lightGeo, redGlowMat);
        lightRight.position.set(-4, 0, 1);
        shipGroup.add(lightRight);

        // Small red lights along the edge
        for (let i = -3; i <= 3; i += 1.5) {
            if (i === 0) continue;
            const smallLight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), redGlowMat);
            smallLight.position.set(i, 0, 0.5);
            shipGroup.add(smallLight);
        }
    }

    const tailGeo = new THREE.ConeGeometry(2, 3, 3);
    const tail = new THREE.Mesh(tailGeo, shipMat);
    tail.rotation.x = -Math.PI / 2;
    tail.scale.set(0.1, 1, 1);
    tail.position.set(0, 1.5, 3);
    shipGroup.add(tail);
    
    const cockpitGeo = new THREE.CapsuleGeometry(0.7, 2, isLowEnd ? 8 : 16, isLowEnd ? 8 : 16);
    const cockpitMat = isLowEnd ? new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 }) : new THREE.MeshPhysicalMaterial({ 
        color: 0x000000, 
        metalness: 0.9, 
        roughness: 0.05, 
        clearcoat: 1.0,
        transmission: 0.8,
        ior: 1.5
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.rotation.x = -Math.PI / 2;
    cockpit.position.set(0, 0.8, -1);
    shipGroup.add(cockpit);
    
    const engineGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.5, isLowEnd ? 12 : 16);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.5 });
    
    // Engine Cores (Glowing)
    const engineCoreGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6, isLowEnd ? 12 : 16);
    
    const engine1 = new THREE.Mesh(engineGeo, engineMat);
    engine1.rotation.x = Math.PI / 2;
    engine1.position.set(-1, 0, 3.5);
    const core1 = new THREE.Mesh(engineCoreGeo, accentMat);
    core1.rotation.x = Math.PI / 2;
    core1.position.set(-1, 0, 3.5);
    shipGroup.add(engine1);
    shipGroup.add(core1);

    const engine2 = engine1.clone();
    engine2.position.set(1, 0, 3.5);
    const core2 = new THREE.Mesh(engineCoreGeo, accentMat);
    core2.rotation.x = Math.PI / 2;
    core2.position.set(1, 0, 3.5);
    shipGroup.add(engine2);
    shipGroup.add(core2);
    
    if (!isLowEnd) {
        const shipLight = new THREE.PointLight(color, 4, 30);
        shipLight.position.set(0, 0, 4);
        shipGroup.add(shipLight);
    }
    
    return shipGroup;
};

export const createSunMesh = (isLowEnd: boolean) => {
    const segs = isLowEnd ? 16 : 64; 
    const coreGeo = new THREE.SphereGeometry(10, segs, segs); 
    // Use a color > 1 to trigger bloom
    const coreMat = new THREE.MeshBasicMaterial({ color: isLowEnd ? 0xffaa00 : new THREE.Color(2, 1.5, 0.5) });
    const mesh = new THREE.Mesh(coreGeo, coreMat); 
    
    // Add a glow effect to the sun
    if (!isLowEnd) {
        const sunGlowGeo = new THREE.SphereGeometry(12, 64, 64);
        const sunGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.8, 0.2), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
        const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
        mesh.add(sunGlow);
    }

    return mesh;
};
