// ... existing code ...
    
    setupEventListeners() {
        // Physics toggle
        document.getElementById('physics-toggle').addEventListener('change', (e) => {
            this.physicsEnabled = e.target.checked;
            
            // Update all containers' physics bodies
            for (const container of this.containers) {
                container.body.type = this.physicsEnabled ? 
                    CANNON.Body.DYNAMIC : 
                    CANNON.Body.KINEMATIC;
            }
        });
        
        // Stack mode toggle
        document.getElementById('stack-mode').addEventListener('change', (e) => {
            this.stackMode = e.target.checked;
        });
        
        // Container selection buttons
        document.querySelectorAll('.container-btn').forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                const color = button.dataset.color;
                
                if (type === 'custom') {
                    // Add custom-sized container
                    this.addCustomContainer(color);
                } else {
                    this.addContainer(type, color);
                }
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
        
        // Size control sliders
        document.getElementById('size-length').addEventListener('input', (e) => {
            this.customContainerSize.length = parseFloat(e.target.value);
            document.getElementById('length-value').textContent = e.target.value + 'm';
        });
        
        document.getElementById('size-width').addEventListener('input', (e) => {
            this.customContainerSize.width = parseFloat(e.target.value);
            document.getElementById('width-value').textContent = e.target.value + 'm';
        });
        
        document.getElementById('size-height').addEventListener('input', (e) => {
            this.customContainerSize.height = parseFloat(e.target.value);
            document.getElementById('height-value').textContent = e.target.value + 'm';
        });
        
        // Apply size to selected container
        document.getElementById('apply-size-btn').addEventListener('click', () => {
            if (this.selectedContainer) {
                this.resizeSelectedContainer();
            } else {
                alert('Please select a container first');
            }
        });
        
        // Texture selector
        document.getElementById('texture-selector').addEventListener('change', (e) => {
            if (e.target.value !== 'none') {
                this.applyTextureToSelectedContainer(e.target.value);
            }
        });
        
        // AI texture generation
        document.getElementById('generate-texture-btn').addEventListener('click', () => {
            const prompt = document.getElementById('texture-prompt').value;
            if (prompt) {
                this.generateTextureFromPrompt(prompt);
            } else {
                alert('Please enter a texture description');
            }
        });
        
        // Texture prompt suggestions
        document.getElementById('texture-suggestions').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                document.getElementById('texture-prompt').value = e.target.dataset.prompt;
            }
        });
        
        // Refine texture with AI
        document.getElementById('refine-texture-btn').addEventListener('click', async () => {
            if (!this.selectedContainer) {
                alert('Please select a container first');
                return;
            }
            
            const baseDescription = document.getElementById('texture-prompt').value || 'shipping container texture';
            const refinePrompt = `${baseDescription}, high resolution, detailed, realistic texture, seamless tileable pattern for 3D container material, flat lighting, no shadows`;
            
            await this.generateTextureFromPrompt(refinePrompt);
        });
        
        // Touch events for container selection
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTap(e.touches[0]);
        });
        
        // Make mobile controls more accessible
        document.getElementById('mobile-controls-toggle').addEventListener('click', () => {
            const controls = document.getElementById('mobile-controls');
            controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
        });
        
        // Improved mobile controls
        document.getElementById('mobile-controls-toggle').addtogroupEventListener('click', () => {
            const controls = document.getElementById('mobile-controls');
            if (controls.style.display === 'block') {
                controls.style.display = 'none';
            } else {
                controls.style.display = 'block';
                // Update the mobile selected info
                this.updateMobileSelection();
            }
        });
        
        // Texture floating action button
        document.getElementById('texture-fab').addEventListener('click', () => {
            const texturePanel = document.getElementById('texture-panel');
            if (texturePanel.classList.contains('active')) {
                texturePanel.classList.remove('active');
                texturePanel.style.display = 'none';
            } else {
                texturePanel.classList.add('active');
                texturePanel.style.display = 'block';
            }
        });
        
        // Additional event listener for collapsen panel with gesture
        const uiPanel = document.getElementById('ui-panel');
        let touchStartY = 0;
        
        uiPanel.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        
        uiPanel.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const diff = touchY - touchStartY;
            
            if (Math.abs(diff) > 30) {
                if (diff > 0) {
                    uiPanel.classList.add('collapsed');
                } else {
                    uiPanel.classList.remove('collapsed');
                }
                touchStartY = touchY;
            }
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
            
            // Update texture UI to show the currently selected container
            document.getElementById('texture-panel').style.display = 'block';
            document.getElementById('selected-container-info').textContent = 
                `Selected: ${CONTAINER_SPECS[containerType].name}`;
        } else {
            this.selectedContainer = null;
            document.getElementById('selected-container-info').textContent = 'No container selected';
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
        mesh.userData.dimensions = { length, width, height };
        mesh.userData.lastValidPosition = mesh.position.clone();
        
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
            material: new CANNON.Material({ friction: 0.3 }),
            type: this.physicsEnabled ? CANNON.Body.DYNAMIC : CANNON.Body.KINEMATIC
        });
        
        // Ensure collision even when not in physics mode
        body.collisionResponse = 1;
        
        this.world.addBody(body);
        
        // Store container with its physics body
        this.containers.push({ mesh, body, type });
    }
    
    // Check for collision between containers
    checkCollision(container) {
        // Skip collision detection if it's the only container
        if (this.containers.length <= 1) return false;
        
        const containerBox = new THREE.Box3().setFromObject(container);
        
        for (const otherContainer of this.containers) {
            // Skip self
            if (otherContainer.mesh === container) continue;
            
            const otherBox = new THREE.Box3().setFromObject(otherContainer.mesh);
            
            if (containerBox.intersectsBox(otherBox)) {
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }
    
    // Try to stack container on top of another
    tryStackingContainer(container) {
        // Create a ray from the bottom center of the container going down
        const containerPos = container.position.clone();
        const dimensions = container.userData.dimensions;
        
        // Start ray from bottom of container
        const rayOrigin = new THREE.Vector3(
            containerPos.x,
            containerPos.y - dimensions.height / 2 + 0.1, // Slightly above bottom
            containerPos.z
        );
        
        const rayDirection = new THREE.Vector3(0, -1, 0); // Downward
        this.raycaster.set(rayOrigin, rayDirection);
        
        // Check for intersection with other containers
        const intersections = this.raycaster.intersectObjects(
            this.containers.map(c => c.mesh).filter(mesh => mesh !== container)
        );
        
        if (intersections.length > 0 && intersections[0].distance < 0.5) {
            // Found container below, place on top
            const targetContainer = intersections[0].object;
            const targetDimensions = targetContainer.userData.dimensions;
            
            // Set Y position to top of target container
            container.position.y = targetContainer.position.y + (targetDimensions.height / 2) + (dimensions.height / 2);
            
            // Update physics body
            const index = this.containers.findIndex(c => c.mesh === container);
            if (index !== -1) {
                this.containers[index].body.position.y = container.position.y;
            }
            
            // Update last valid position
            container.userData.lastValidPosition = container.position.clone();
        }
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
        if (type === 'custom') {
            this.updateCustomContainerInfo();
            return;
        }
        
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
        if (this.physicsEnabled) {
            for (const container of this.containers) {
                if (container.body.type !== CANNON.Body.KINEMATIC) {
                    container.mesh.position.copy(container.body.position);
                    container.mesh.quaternion.copy(container.body.quaternion);
                }
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updatePhysics();
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    loadTextureLibrary() {
        const textureLoader = new THREE.TextureLoader();
        
        // Predefined texture library
        const textures = [
            { id: 'shipping-line-blue', name: 'Shipping Line Blue', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/crate.gif' },
            { id: 'metal-container', name: 'Metal Container', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_diffuse.jpg' },
            { id: 'rusty-container', name: 'Rusty Container', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/water.jpg' },
            { id: 'white-container', name: 'White Refrigerated', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_diffuse.jpg' }
        ];
        
        // Load each texture and store in library
        textures.forEach(tex => {
            textureLoader.load(tex.url, (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(3, 2);
                this.textureLibrary[tex.id] = {
                    texture: texture,
                    name: tex.name
                };
                
                // Add to texture selector once loaded
                this.updateTextureSelector();
            });
        });
    }
    
    updateTextureSelector() {
        const selector = document.getElementById('texture-selector');
        if (!selector) return;
        
        // Clear current options
        selector.innerHTML = '<option value="none">Choose Texture</option>';
        
        // Add predefined textures
        Object.keys(this.textureLibrary).forEach(id => {
            const texture = this.textureLibrary[id];
            const option = document.createElement('option');
            option.value = id;
            option.textContent = texture.name;
            selector.appendChild(option);
        });
        
        // Add generated textures
        Object.keys(this.generatedTextures).forEach(id => {
            const texture = this.generatedTextures[id];
            const option = document.createElement('option');
            option.value = 'generated-' + id;
            option.textContent = 'Generated: ' + texture.name;
            selector.appendChild(option);
        });
    }
    
    applyTextureToSelectedContainer(textureId) {
        if (!this.selectedContainer) {
            alert('Please select a container first');
            return;
        }
        
        let texture;
        
        if (textureId.startsWith('generated-')) {
            // Get generated texture
            const id = textureId.replace('generated-', '');
            texture = this.generatedTextures[id]?.texture;
        } else {
            // Get predefined texture
            texture = this.textureLibrary[textureId]?.texture;
        }
        
        if (texture) {
            // Create new material with the selected texture
            const newMaterial = new THREE.MeshStandardMaterial({ 
                map: texture,
                roughness: 0.7,
                metalness: 0.2
            });
            
            // Apply to selected container
            this.selectedContainer.material = newMaterial;
            
            // Maintain highlight if container is selected
            this.selectedContainer.material.emissive = new THREE.Color(0x333333);
            this.selectedContainer.material.emissiveIntensity = 0.5;
            this.selectedContainer.material.needsUpdate = true;
            
            console.log(`Applied texture ${textureId} to selected container`);
        }
    }
    
    async generateTextureFromPrompt(prompt) {
        if (!prompt) return;
        
        try {
            document.getElementById('ai-status').textContent = 'Generating texture...';
            
            // Generate image using AI with modified prompt to ensure we get textures
            const texturePrompt = `${prompt}, seamless texture pattern for 3D container material, tileable, high detail, suitable for wrapping a shipping container`;
            
            const result = await websim.imageGen({
                prompt: texturePrompt,
                width: 512,
                height: 512,
            });
            
            if (result && result.url) {
                // Load the generated texture
                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(result.url, (texture) => {
                    // Configure texture settings
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(2, 2);
                    
                    // Create a unique ID for this texture
                    const id = 'tex-' + Date.now();
                    
                    // Store the generated texture
                    this.generatedTextures[id] = {
                        texture: texture,
                        name: prompt.substring(0, 15) + '...'
                    };
                    
                    // Apply to selected container
                    if (this.selectedContainer) {
                        const material = new THREE.MeshStandardMaterial({ 
                            map: texture,
                            roughness: 0.7,
                            metalness: 0.2
                        });
                        this.selectedContainer.material = material;
                    }
                    
                    // Update texture selector
                    this.updateTextureSelector();
                    document.getElementById('ai-status').textContent = 'Texture generated!';
                });
            } else {
                document.getElementById('ai-status').textContent = 'Failed to generate texture';
            }
        } catch (error) {
            console.error('Error generating texture:', error);
            document.getElementById('ai-status').textContent = 'Error: ' + error.message;
        }
    }
    
    handleClick(event) {
        // Convert mouse/touch to screen coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mousePosition.x = ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
        this.mousePosition.y = -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;
        
        // Raycast to find selected container
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        const intersects = this.raycaster.intersectObjects(this.draggableObjects);
        
        if (intersects.length > 0) {
            this.selectedContainer = intersects[0].object;
            
            // Highlight the selected container
            this.highlightSelectedContainer();
            
            // Update container info with selected container details
            const containerType = this.selectedContainer.userData.type;
            this.updateContainerInfo(containerType);
            
            // Update mobile info
            this.updateMobileSelection();
            
            // Provide tactile feedback if available
            if (window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        } else {
            // Remove highlights from all containers
            this.containers.forEach(container => {
                container.mesh.material.emissive = new THREE.Color(0x000000);
            });
            
            this.selectedContainer = null;
            document.getElementById('selected-container-info').textContent = 'No container selected';
        }
    }
    
    highlightSelectedContainer() {
        // First, remove highlight from all containers
        this.containers.forEach(container => {
            container.mesh.material.emissive = new THREE.Color(0x000000);
        });
        
        if (this.selectedContainer) {
            // Add emissive highlight to selected container
            this.selectedContainer.material.emissive = new THREE.Color(0x333333);
            this.selectedContainer.material.emissiveIntensity = 0.5;
            this.selectedContainer.material.needsUpdate = true;
            
            // Update selection info
            document.getElementById('selected-container-info').textContent = 
                `Selected: ${CONTAINER_SPECS[this.selectedContainer.userData.type].name}`;
            
            // Update mobile selection info as well
            this.updateMobileSelection();
        }
    }

    updateMobileSelection() {
       !function(){const mobileInfo=document.getElementById('mobile-selected-info');if(this.selectedContainer){const containerType=this.selectedContainer.userData.type;mobileInfo.textContent=`Selected:${CONTAINER_SPECS[containerType].name}`}else{mobileInfo.textContent='No container selected'}}.call(this)
    }
    
    addCustomContainer(color) {
        const { length, width, height } = this.customContainerSize;
        
        // Visual mesh
        const geometry = new THREE.BoxGeometry(length, height, width);
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position the container above ground
        mesh.position.y = height / 2;
        
        // Add container details to mesh
        mesh.userData.type = 'custom';
        mesh.userData.dimensions = { length, width, height };
        mesh.userData.lastValidPosition = mesh.position.clone();
        
        // Cast and receive shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene and draggable objects
        this.scene.add(mesh);
        this.draggableObjects.push(mesh);
        
        // Create physics body
        const shape = new CANNON.Box(new CANNON.Vec3(length/2, height/2, width/2));
        const body = new CANNON.Body({
            mass: 1000,
            shape,
            position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
            material: new CANNON.Material({ friction: 0.3 }),
            type: this.physicsEnabled ? CANNON.Body.DYNAMIC : CANNON.Body.KINEMATIC
        });
        
        body.collisionResponse = 1;
        this.world.addBody(body);
        
        // Store container with its physics body
        this.containers.push({ mesh, body, type: 'custom' });
        
        return mesh;
    }
    
    resizeSelectedContainer() {
        if (!this.selectedContainer) return;
        
        const { length, width, height } = this.customContainerSize;
        const oldPosition = this.selectedContainer.position.clone();
        
        // Remove old container from the scene
        const index = this.containers.findIndex(c => c.mesh === this.selectedContainer);
        if (index !== -1) {
            this.scene.remove(this.selectedContainer);
            this.world.removeBody(this.containers[index].body);
            
            // Remove from draggable objects
            const dragIndex = this.draggableObjects.indexOf(this.selectedContainer);
            if (dragIndex !== -1) {
                this.draggableObjects.splice(dragIndex, 1);
            }
            
            // Create new geometry
            const geometry = new THREE.BoxGeometry(length, height, width);
            const material = this.selectedContainer.material.clone();
            const mesh = new THREE.Mesh(geometry, material);
            
            // Copy position and rotation
            mesh.position.copy(oldPosition);
            mesh.rotation.copy(this.selectedContainer.rotation);
            
            // Adjust Y position based on new height
            mesh.position.y = Math.max(height / 2, oldPosition.y);
            
            // Copy userData
            mesh.userData = {...this.selectedContainer.userData};
            mesh.userData.dimensions = { length, width, height };
            mesh.userData.lastValidPosition = mesh.position.clone();
            
            // Cast and receive shadows
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Add to scene and draggable objects
            this.scene.add(mesh);
            this.draggableObjects.push(mesh);
            
            // Create new physics body
            const shape = new CANNON.Box(new CANNON.Vec3(length/2, height/2, width/2));
            const body = new CANNON.Body({
                mass: 1000,
                shape,
                position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
                material: new CANNON.Material({ friction: 0.3 }),
                type: this.physicsEnabled ? CANNON.Body.DYNAMIC : CANNON.Body.KINEMATIC
            });
            
            // Copy rotation if any
            body.quaternion.copy(mesh.quaternion);
            body.collisionResponse = 1;
            this.world.addBody(body);
            
            // Replace in containers array
            this.containers[index] = { mesh, body, type: 'custom' };
            
            // Update selected container reference
            this.selectedContainer = mesh;
            this.highlightSelectedContainer();
            
            // Update container info
            this.updateCustomContainerInfo();
        }
    }
    
    updateCustomContainerInfo() {
        if (!this.selectedContainer) return;
        
        const dimensions = this.selectedContainer.userData.dimensions;
        const infoPanel = document.getElementById('container-info');
        
        infoPanel.innerHTML = `
            <h3>Custom Container</h3>
            <p><strong>Dimensions:</strong> ${dimensions.length.toFixed(2)}m × ${dimensions.width.toFixed(2)}m × ${dimensions.height.toFixed(2)}m</p>
            <p><strong>Volume:</strong> ${(dimensions.length * dimensions.width * dimensions.height).toFixed(2)} cubic meters</p>
        `;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ShippingContainerScene();
});