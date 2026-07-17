import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class ParticlesSwarm {
    constructor(container, count = 20000) {
        this.count = count;
        this.container = container;
        this.speedMult = 1;
        
        // SETUP
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.01);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 0, 100);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // POST PROCESSING
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.strength = 1.8; bloomPass.radius = 0.4; bloomPass.threshold = 0;
        this.composer.addPass(bloomPass);

        // OBJECTS
        this.dummy = new THREE.Object3D();
        this.color = new THREE.Color();
        this.target = new THREE.Vector3();
        this.pColor = new THREE.Color();
        
        this.geometry = new THREE.TetrahedronGeometry(0.25);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);
        
        this.positions = [];
        for(let i=0; i<this.count; i++) {
            this.positions.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
            this.mesh.setColorAt(i, this.color.setHex(0x00ff88));
        }
        
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        this.animate();
    }

    animate() {
        requestAnimationFrame(this.animate);
        const time = this.clock.getElapsedTime() * this.speedMult;
        
        if(this.material.uniforms && this.material.uniforms.uTime) {
            this.material.uniforms.uTime.value = time;
        }

        // API Stubs
        const PARAMS = {"chaos":2.5,"load":1.2};
        const addControl = (id, l, min, max, val) => {
             return PARAMS[id] !== undefined ? PARAMS[id] : val;
        };
        const setInfo = () => {};
        const annotate = () => {};
        let THREE_LIB = THREE;
        
        let THREE_LIB = THREE;
        const count = this.count; // Alias for user code
        
        for(let i=0; i<this.count; i++) {
            let target = this.target;
            let color = this.pColor;
            
            // INJECTED CODE
            const chaos = addControl("chaos", "Internet Chaos", 0, 10, 2.5);
            const load = addControl("load", "Server Load", 0.5, 3, 1.2);
            
            const boatCount = Math.floor(count * 0.18); 
            const isBoat = i < boatCount;
            
            if (i === 0) {
                setInfo("The Resilient Node", "HomeLab cluster navigating the turbulent ocean of global data.");
            }
            
            let x = 0, y = 0, z = 0;
            
            if (isBoat) {
                const t = i / boatCount;
                const tSlow = time * 0.6;
                
                const pitch = Math.sin(tSlow) * (0.06 + chaos * 0.02);
                const roll = Math.cos(tSlow * 0.8) * (0.04 + chaos * 0.01);
                const bobbing = Math.sin(tSlow * 2) * 0.6;
            
                if (t < 0.4) { 
                    const hullT = t / 0.4;
                    const zRatio = Math.floor(hullT * 55) / 55; 
                    const hCol = (hullT * 25) % 1; 
                    
                    z = (zRatio - 0.5) * 45;
                    const maxWidth = Math.sin(zRatio * Math.PI) * 7;
                    x = (hCol - 0.5) * 2 * maxWidth;
                    
                    const floor = Math.pow(x / (maxWidth + 0.1), 2) * 3.5 - 3.5;
                    const bowLift = zRatio > 0.65 ? Math.pow(zRatio - 0.65, 2) * 120 : 0;
                    y = floor + bowLift;
                    
                } else {
                    const sailT = (t - 0.4) / 0.6;
                    const isFore = sailT < 0.5;
                    const sSubT = isFore ? (sailT * 2) : ((sailT - 0.5) * 2);
                    
                    const row = Math.floor(sSubT * 48) / 48; 
                    const col = (sSubT * 25) % 1;
                    
                    const mastZ = isFore ? 8 : -10; 
                    const h = row * 34 * load; 
                    const lean = h * -0.15; 
                    
                    const currentMastZ = mastZ + lean;
                    const sWidth = (1 - row) * 22 * load; 
                    
                    x = (col - 0.5) * sWidth; 
                    y = h + 2.5;
                    z = currentMastZ + (Math.sin(col * Math.PI) * 3); 
                }
            
                const worldX = x;
                const worldY = y * Math.cos(pitch) - z * Math.sin(pitch) + bobbing;
                const worldZ = y * Math.sin(pitch) + z * Math.cos(pitch);
            
                const finalX = worldX * Math.cos(roll) - worldY * Math.sin(roll);
                const finalY = worldX * Math.sin(roll) + worldY * Math.cos(roll);
            
                target.set(finalX, finalY, worldZ);
                color.setHSL(0.12, 0.8, 0.7);
            
            } else {
                const oceanIdx = (i - boatCount) / (count - boatCount);
                const gridX = ((oceanIdx * 1537) % 1) * 200 - 100;
                const gridZ = ((oceanIdx * 723) % 1) * 200 - 100;
            
                const wave1 = Math.sin(gridX * 0.1 + time * 1.2) * 2;
                const wave2 = Math.cos(gridZ * 0.15 - time * 0.8) * 2;
                const interference = Math.sin((gridX + gridZ) * 0.05 + time) * chaos;
                const ripple = Math.sin(Math.sqrt(gridX * gridX + gridZ * gridZ) * 0.2 - time * 3) * (chaos * 0.2);
            
                y = wave1 + wave2 + interference + ripple - 5;
            
                target.set(gridX, y, gridZ);
            
                const depth = Math.max(0, Math.min(1, (y + 10) / 15));
                color.setHSL(0.55 + depth * 0.1, 0.8, 0.2 + depth * 0.4);
            }
            
            // UPDATE
            this.positions[i].lerp(this.target, 0.1);
            this.dummy.position.copy(this.positions[i]);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, this.pColor);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.instanceColor.needsUpdate = true;
        
        this.composer.render();
    }
    
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.mesh);
        this.renderer.dispose();
    }
}