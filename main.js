import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import * as CANNON from 'cannon-es';

// Container dimensions in meters (based on ISO standards)
const CONTAINER_SPECS = {
    standard20: {
        name: "20ft Standard",
        exterior: {
            length: 6.058, // 20ft
            width: 2.438,  // 8ft
            height: 2.591  // 8.5ft
        },
        interior: {
            length: 5.867,
            width: 2.330,
            height: 2.350
        },
        capacity: "33.1 cubic meters",
        maxWeight: "30,480 kg"
    },
    standard40: {
        name: "40ft Standard",
        exterior: {
            length: 12.192, // 40ft
            width: 2.438,   // 8ft
            height: 2.591   // 8.5ft
        },
        interior: {
            length: 12.032,
            width: 2.352,
            height: 2.385
        },
        capacity: "67.5 cubic meters",
        maxWeight: "30,480 kg"
    },
    highcube40: {
        name: "40ft High Cube",
        exterior: {
            length: 12.192, // 40ft
            width: 2.438,   // 8ft
            height: 2.896   // 9.5ft
        },
        interior: {
            length: 12.032,
            width: 2.352,
            height: 2.698
        },
        capacity: "76.4 cubic meters",
        maxWeight: "30,480 kg"
    },
    highcube45: {
        name: "45ft High Cube",
        exterior: {
            length: 13.716, // 45ft
            width: 2.438,   // 8ft
            height: 2.896   // 9.5ft
        },
        interior: {
            length: 13.556,
            width: 2.352,
            height: 2.698
        },
        capacity: "86.1 cubic meters",
        maxWeight: "30,480 kg"
    }
};

class ShippingContainerScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight), 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.container = document.getElementById('scene-container');
        this.containers = [];
        this.draggableObjects = [];
        this.selectedContainer = null;
        this.mousePosition = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.rotateContainer = false;
        this.gridSnap = true;
        this.gridSize = 1;
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Physics
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Renderer setup
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Camera setup
        this.camera.position.set(20, 15, 20);
        this.camera.lookAt(0, 0, 0);

        // Controls
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.dragControls = new DragControls(this.draggableObjects, this.camera, this.renderer.domElement);
        
        // Add touch-friendly position indicators
        this.setupPositionIndicators();
        
        // Setup drag controls
        this.dragControls.addEventListener('dragstart', (event) => {
            this.orbitControls.enabled = false;
            this.selectedContainer = event.object;
            
            // Disable physics for the dragged container
            const index = this.containers.findIndex(c => c.mesh === this.selectedContainer);
            if (index !== -1) {
                this.containers[index].body.type = CANNON.Body.KINEMATIC;
            }
        });
        
        this.dragControls.addEventListener('drag', (event) => {
            // If rotate mode is enabled, rotate container instead of moving
            if (this.rotateContainer) {
                event.object.rotation.y += 0.05;
                
                // Update physics body rotation
                const index = this.containers.findIndex(c => c.mesh === event.object);
                if (index !== -1) {
                    const quaternion = new CANNON.Quaternion();
                    quaternion.setFromEuler(0, event.object.rotation.y, 0);
                    this.containers[index].body.quaternion.copy(quaternion);
                }
            } else {
                // Apply grid snapping if enabled
                if (this.gridSnap) {
                    event.object.position.x = Math.round(event.object.position.x / this.gridSize) * this.gridSize;
                    event.object.position.z = Math.round(event.object.position.z / this.gridSize) * this.gridSize;
                }
                
                // Update physics body position
                const index = this.containers.findIndex(c => c.mesh === event.object);
                if (index !== -1) {
                    const pos = event.object.position;
                    this.containers[index].body.position.set(pos.x, pos.y, pos.z);
                }
                
                // Make sure container can't go below ground
                if (event.object.position.y < event.object.geometry.parameters.height / 2) {
                    event.object.position.y = event.object.geometry.parameters.height / 2;
                }
            }
        });
        
        this.dragControls.addEventListener('dragend', () => {
            this.orbitControls.enabled = true;
            
            // Re-enable physics for the dragged container
            if (this.selectedContainer) {
                const index = this.containers.findIndex(c => c.mesh === this.selectedContainer);
                if (index !== -1) {
                    this.containers[index].body.type = CANNON.Body.DYNAMIC;
                }
                this.selectedContainer = null;
            }
        });

        // Add ground
        this.addGround();
        
        // Add lighting
        this.addLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupPositionIndicators() {
        this.positionHelpers = {
            x: {
                plus: document.getElementById('x-plus'),
                minus: document.getElementById('x-minus')
            },
            z: {
                plus: document.getElementById('z-plus'),
                minus: document.getElementById('z-minus')
            },
            y: {
                plus: document.getElementById('y-plus'),
                minus: document.getElementById('y-minus')
            }
        };
    }
    
    setupEventListeners() {
        // Container selection buttons
        document.querySelectorAll('.container-btn').forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                const color = button.dataset.color;
                this.addContainer(type, color);
                this.updateContainerInfo(type);
            });
        });
        
        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetScene();
        });
        
        // Rotate button
        document.getElementById('rotate-btn').addEventListener('click', () => {
            this.rotateContainer = !this.rotateContainer;
            document.getElementById('rotate-btn').textContent = 
                this.rotateContainer ? "Move Mode" : "Rotate Mode";
        });
        
        // Grid snap toggle
        document.getElementById('grid-snap').addEventListener('change', (e) => {
            this.gridSnap = e.target.checked;
        });
        
        // Grid size control
        document.getElementById('grid-size').addEventListener('input', (e) => {
            this.gridSize = parseFloat(e.target.value);
            document.getElementById('grid-size-display').textContent = this.gridSize.toFixed(1) + 'm';
        });
        
        // Movement buttons for mobile
        if (this.isMobile || true) { // Always show for demonstration
            // X axis
            document.getElementById('x-plus').addEventListener('click', () => {
                this.moveSelectedContainer('x', this.gridSize);
            });
            document.getElementById('x-minus').addEventListener('click', () => {
                this.moveSelectedContainer('x', -this.gridSize);
            });
            
            // Z axis
            document.getElementById('z-plus').addEventListener('click', () => {
                this.moveSelectedContainer('z', this.gridSize);
            });
            document.getElementById('z-minus').addEventListener('click', () => {
                this.moveSelectedContainer('z', -this.gridSize);
            });
            
            // Y axis
            document.getElementById('y-plus').addEventListener('click', () => {
                this.moveSelectedContainer('y', this.gridSize);
            });
            document.getElementById('y-minus').addEventListener('click', () => {
                this.moveSelectedContainer('y', -this.gridSize);
            });
            
            // Rotate button for mobile
            document.getElementById('rotate-container').addEventListener('click', () => {
                this.rotateSelectedContainer(Math.PI/2);
            });
        }
        
        // Touch events for container selection
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTap(e.touches[0]);
        });
    }
    
    handleTap(touch) {
        // Convert touch to screen coordinates
        this.mousePosition.x = (touch.clientX / this.container.clientWidth) * 2 - 1;
        this.mousePosition.y = -(touch.clientY / this.container.clientHeight) * 2 + 1;
        
        // Raycast to find selected container
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        const intersects = this.raycaster.intersectObjects(this.draggableObjects);
        
        if (intersects.length > 0) {
            this.selectedContainer = intersects[0].object;
            
            // Update info panel with selected container details
            const containerType = this.selectedContainer.userData.type;
            this.updateContainerInfo(containerType);
        } else {
            this.selectedContainer = null;
        }
    }
    
    moveSelectedContainer(axis, distance) {
        if (!this.selectedContainer) return;
        
        this.selectedContainer.position[axis] += distance;
        
        // Apply physics updates
        const index = this.containers.findIndex(c => c.mesh === this.selectedContainer);
        if (index !== -1) {
            this.containers[index].body.position[axis] += distance;
        }
    }
    
    rotateSelectedContainer(angle) {
        if (!this.selectedContainer) return;
        
        this.selectedContainer.rotation.y += angle;
        
        // Update physics body rotation
        const index = this.containers.findIndex(c => c.mesh === this.selectedContainer);
        if (index !== -1) {
            const quaternion = new CANNON.Quaternion();
            quaternion.setFromEuler(0, this.selectedContainer.rotation.y, 0);
            this.containers[index].body.quaternion.copy(quaternion);
        }
    }
    
    addGround() {
        // Visual ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x999999,
            roughness: 0.8,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add grid
        const grid = new THREE.GridHelper(100, 100, 0x000000, 0x555555);
        grid.position.y = 0.01; // Slightly above ground to avoid z-fighting
        this.scene.add(grid);
        
        // Physics ground
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane(),
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
    }
    
    addLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -25;
        directionalLight.shadow.camera.right = 25;
        directionalLight.shadow.camera.top = 25;
        directionalLight.shadow.camera.bottom = -25;
        this.scene.add(directionalLight);
    }
    
    addContainer(type, color) {
        const specs = CONTAINER_SPECS[type];
        if (!specs) return;
        
        const { length, width, height } = specs.exterior;
        
        // Visual mesh
        const geometry = new THREE.BoxGeometry(length, height, width);
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position the container above ground
        mesh.position.y = height / 2;
        
        // Add container details to mesh
        mesh.userData.type = type;
        
        // Cast and receive shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene and draggable objects
        this.scene.add(mesh);
        this.draggableObjects.push(mesh);
        
        // Create physics body
        const shape = new CANNON.Box(new CANNON.Vec3(length/2, height/2, width/2));
        const body = new CANNON.Body({
            mass: 1000, // Container mass in kg
            shape,
            position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
            material: new CANNON.Material({ friction: 0.3 })
        });
        
        this.world.addBody(body);
        
        // Store container with its physics body
        this.containers.push({ mesh, body, type });
    }
    
    resetScene() {
        // Remove all containers
        for (const container of this.containers) {
            this.scene.remove(container.mesh);
            this.world.removeBody(container.body);
        }
        
        this.containers = [];
        this.draggableObjects = [];
        
        // Reset container info
        document.getElementById('container-info').innerHTML = '<p>Select a container to see its dimensions</p>';
    }
    
    updateContainerInfo(type) {
        const specs = CONTAINER_SPECS[type];
        if (!specs) return;
        
        const infoPanel = document.getElementById('container-info');
        infoPanel.innerHTML = `
            <h3>${specs.name}</h3>
            <p><strong>Exterior:</strong> ${specs.exterior.length.toFixed(3)}m × ${specs.exterior.width.toFixed(3)}m × ${specs.exterior.height.toFixed(3)}m</p>
            <p><strong>Interior:</strong> ${specs.interior.length.toFixed(3)}m × ${specs.interior.width.toFixed(3)}m × ${specs.interior.height.toFixed(3)}m</p>
            <p><strong>Capacity:</strong> ${specs.capacity}</p>
            <p><strong>Max Weight:</strong> ${specs.maxWeight}</p>
        `;
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    updatePhysics() {
        // Update physics world
        this.world.fixedStep();
        
        // Update mesh positions/rotations from physics bodies
        for (const container of this.containers) {
            if (container.body.type !== CANNON.Body.KINEMATIC) {
                container.mesh.position.copy(container.body.position);
                container.mesh.quaternion.copy(container.body.quaternion);
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updatePhysics();
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ShippingContainerScene();
});