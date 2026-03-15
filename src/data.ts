import * as THREE from 'three';

export type HubType = 'shop' | 'ai_tools' | 'fun_hub';

export interface HubData {
    id: string;
    name: string;
    type: HubType;
    radius: number;
    distance: number;
    speed: number;
    color: number;
    description: string;
    icon: string;
    hasRing?: boolean;
    geometryType?: 'sphere' | 'torus' | 'icosahedron';
    textureUrl?: string;
    normalUrl?: string;
    specularUrl?: string;
    cloudsUrl?: string;
    nightUrl?: string;
}

export const HUBS_DATA: HubData[] = [
  { id: "shop", name: "Galactic Shop", type: 'shop', radius: 4.0, distance: 30, speed: 0.01, color: 0x4aa3ff, hasRing: false, description: "All Shopping (Mobile, Laptop, etc.)", icon: "🛒", geometryType: 'sphere', textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg', normalUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg', specularUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg', cloudsUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png', nightUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg' },
  { id: "ai_tools", name: "AI Tools", type: 'ai_tools', radius: 3.5, distance: 60, speed: 0.008, color: 0xff4444, description: "Chat, Image Gen, Video Gen", icon: "🤖", geometryType: 'sphere', textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg', normalUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg', specularUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg', cloudsUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png', nightUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg' },
  { id: "fun_hub", name: "Fun Hub", type: 'fun_hub', radius: 4.5, distance: 90, speed: 0.005, color: 0xffaa00, hasRing: true, description: "Web Browser & Games", icon: "🎮", geometryType: 'sphere', textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg', normalUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg', specularUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg', cloudsUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png', nightUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg' },
];
