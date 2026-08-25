/**
 * Spaceship Station Isometric Scene
 * Renders containers as isometric room modules on a tile grid
 */

class BaseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BaseScene' });
        this.gridWidth = 12;
        this.gridHeight = 12;
        this.tileWidth = 128;
        this.tileHeight = 64;
        this.modules = new Map(); // container_name -> module object
        this.workers = []; // animated worker sprites
        this.selectedModule = null;
    }

    create() {
        // Create camera and background
        this.cameras.main.setBackgroundColor('#0f172a');
        
        // Enable input
        this.input.on('pointerdown', this.onCanvasClick, this);
        
        // Draw isometric grid
        this.drawIsometricGrid();
        
        // Start with empty grid - modules will be added via WebSocket
        this.loadMockModules();
    }

    update() {
        // Update worker animations
        this.workers.forEach(worker => {
            this.updateWorkerAnimation(worker);
        });
    }

    /**
     * Draw isometric grid background
     */
    drawIsometricGrid() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x1e293b, 0.3);
        graphics.lineStyle(1, 0x334155, 0.5);
        
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const screenPos = this.cartesianToIsometric(x, y);
                this.drawIsometricTile(graphics, screenPos.x, screenPos.y, this.tileWidth, this.tileHeight);
            }
        }
        
        graphics.generateTexture('gridTexture', this.gridWidth * this.tileWidth, this.gridHeight * this.tileHeight);
        graphics.destroy();
        
        this.add.image(0, 0, 'gridTexture').setOrigin(0, 0).setDepth(0);
    }

    /**
     * Draw a single isometric tile
     */
    drawIsometricTile(graphics, x, y, width, height) {
        const halfW = width / 2;
        const halfH = height / 2;
        
        graphics.beginPath();
        graphics.moveTo(x, y - halfH);
        graphics.lineTo(x + halfW, y);
        graphics.lineTo(x, y + halfH);
        graphics.lineTo(x - halfW, y);
        graphics.closePath();
        graphics.strokePath();
    }

    /**
     * Convert cartesian grid coordinates to isometric screen coordinates
     */
    cartesianToIsometric(x, y) {
        const baseX = 100;
        const baseY = 100;
        const halfTw = this.tileWidth / 2;
        const halfTh = this.tileHeight / 2;
        
        const screenX = baseX + (x - y) * halfTw;
        const screenY = baseY + (x + y) * halfTh;
        
        return { x: screenX, y: screenY };
    }

    /**
     * Load and render mock modules
     */
    loadMockModules() {
        const mockData = [
            { name: 'ollama', module_type: 'command_deck', x: 5, y: 5, color: '#ff6b9d', state: 'running', cpu_percent: 45 },
            { name: 'jellyfin', module_type: 'media_archive', x: 4, y: 7, color: '#00b4d8', state: 'running', cpu_percent: 35 },
            { name: 'qbittorrent', module_type: 'docking_bay', x: 8, y: 2, color: '#ff7675', state: 'running', cpu_percent: 12 },
            { name: 'komga', module_type: 'media_archive', x: 5, y: 7, color: '#0096c7', state: 'running', cpu_percent: 8 },
            { name: 'romm', module_type: 'arcade_deck', x: 3, y: 9, color: '#f72585', state: 'running', cpu_percent: 5 },
            { name: 'authentik-server', module_type: 'security_bay', x: 2, y: 2, color: '#4ecdc4', state: 'running', cpu_percent: 18 },
            { name: 'gluetun', module_type: 'network_gateway', x: 0, y: 5, color: '#00b894', state: 'running', cpu_percent: 2 },
            { name: 'sonarr', module_type: 'automation_hub', x: 6, y: 1, color: '#0984e3', state: 'running', cpu_percent: 6 },
        ];
        
        mockData.forEach(data => {
            this.addModule(data);
        });
    }

    /**
     * Add a module to the scene
     */
    addModule(data) {
        const screenPos = this.cartesianToIsometric(data.x, data.y);
        
        // Create container group for module
        const moduleGroup = this.add.container(screenPos.x, screenPos.y);
        
        // Create isometric box (visual representation)
        const box = this.createIsometricBox(0, 0, this.tileWidth * 0.8, this.tileHeight * 0.8, data.color);
        moduleGroup.add(box);
        
        // Add interactive zone
        const zone = this.add.zone(screenPos.x, screenPos.y, this.tileWidth, this.tileHeight);
        zone.setInteractive();
        zone.on('pointerdown', () => this.selectModule(data));
        
        // Add text label
        const label = this.add.text(0, 5, data.name.replace('-', '\n').toUpperCase(), {
            fontSize: '10px',
            fill: '#ffffff',
            align: 'center',
            fontFamily: 'Courier New',
        }).setOrigin(0.5, 0.5).setDepth(10);
        moduleGroup.add(label);
        
        // Store module reference
        this.modules.set(data.name, {
            data: data,
            group: moduleGroup,
            box: box,
            zone: zone,
            label: label,
            cpuPercent: data.cpu_percent || 0,
        });
        
        // Add worker sprite if CPU is high
        if (data.cpu_percent > 20) {
            this.spawnWorker(screenPos.x, screenPos.y, data.name);
        }
    }

    /**
     * Create an isometric 3D-like box
     */
    createIsometricBox(x, y, width, height, color) {
        const graphics = this.make.graphics({ x: x, y: y, add: false });
        
        const halfW = width / 2;
        const halfH = height / 2;
        const depth = 12;
        
        // Top face
        graphics.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
        graphics.beginPath();
        graphics.moveTo(0, -halfH);
        graphics.lineTo(halfW, 0);
        graphics.lineTo(0, halfH);
        graphics.lineTo(-halfW, 0);
        graphics.closePath();
        graphics.fillPath();
        
        // Right face (darker)
        graphics.fillStyle(Phaser.Display.Color.HexStringToColor(color).darken(30).color, 1);
        graphics.beginPath();
        graphics.moveTo(halfW, 0);
        graphics.lineTo(halfW + depth, -depth);
        graphics.lineTo(halfW + depth, halfH - depth);
        graphics.lineTo(halfW, halfH);
        graphics.closePath();
        graphics.fillPath();
        
        // Left face (darkest)
        graphics.fillStyle(Phaser.Display.Color.HexStringToColor(color).darken(50).color, 1);
        graphics.beginPath();
        graphics.moveTo(-halfW, 0);
        graphics.lineTo(-halfW - depth, -depth);
        graphics.lineTo(-halfW - depth, halfH - depth);
        graphics.lineTo(-halfW, halfH);
        graphics.closePath();
        graphics.fillPath();
        
        // Border
        graphics.lineStyle(2, 0xffffff, 0.3);
        graphics.beginPath();
        graphics.moveTo(0, -halfH);
        graphics.lineTo(halfW, 0);
        graphics.lineTo(0, halfH);
        graphics.lineTo(-halfW, 0);
        graphics.closePath();
        graphics.strokePath();
        
        graphics.generateTexture(`module_${Date.now()}`, width + depth, height + depth);
        const texture = graphics.texture;
        graphics.destroy();
        
        return this.add.image(x, y, texture.key).setOrigin(0.5, 0.5).setDepth(5);
    }

    /**
     * Spawn a worker sprite for high-load modules
     */
    spawnWorker(x, y, containerName) {
        const graphics = this.make.graphics({ add: false });
        graphics.fillStyle(0xffd700, 1); // Gold
        graphics.fillCircle(4, 4, 3);
        graphics.generateTexture('worker_sprite', 8, 8);
        graphics.destroy();
        
        const worker = this.add.sprite(x, y, 'worker_sprite');
        worker.setDepth(15);
        worker.containerName = containerName;
        worker.angle = Math.random() * 360;
        worker.velocity = {
            x: (Math.random() - 0.5) * 20,
            y: (Math.random() - 0.5) * 20,
        };
        
        this.workers.push(worker);
    }

    /**
     * Update worker animation
     */
    updateWorkerAnimation(worker) {
        worker.x += worker.velocity.x * 0.016; // delta time
        worker.y += worker.velocity.y * 0.016;
        
        // Bounce off edges
        const margin = 50;
        if (worker.x < margin || worker.x > this.game.config.width - margin) {
            worker.velocity.x *= -1;
        }
        if (worker.y < margin || worker.y > this.game.config.height - margin) {
            worker.velocity.y *= -1;
        }
    }

    /**
     * Select a module for inspection
     */
    selectModule(data) {
        console.log('Selected module:', data.name);
        
        // Update sidebar
        window.updateInspector(data);
        
        // Visual feedback
        if (this.selectedModule) {
            this.selectedModule.box.setAlpha(1);
        }
        this.selectedModule = this.modules.get(data.name);
        if (this.selectedModule) {
            this.selectedModule.box.setAlpha(0.7).setTint(0xffffff);
        }
        
        // Open inspector drawer
        openInspector();
    }

    /**
     * Update a module's visual state from metrics
     */
    updateModuleMetrics(containerName, metrics) {
        const module = this.modules.get(containerName);
        if (!module) return;
        
        module.cpuPercent = metrics.cpu_percent || 0;
        module.data.state = metrics.state || 'running';
        
        // Change color based on state
        let newColor = metrics.color || module.data.color;
        if (metrics.state === 'stopped') {
            newColor = '#7f8c8d'; // Gray
        } else if (metrics.cpu_percent > 75) {
            newColor = '#e74c3c'; // Red alert
        } else if (metrics.cpu_percent > 50) {
            newColor = '#f39c12'; // Yellow warning
        }
        
        // Recreate box with new color
        module.box.destroy();
        module.box = this.createIsometricBox(0, 0, this.tileWidth * 0.8, this.tileHeight * 0.8, newColor);
        module.group.add(module.box);
        module.group.sendToBack(module.box);
    }

    /**
     * Click handler for canvas
     */
    onCanvasClick(pointer) {
        // Deselect if clicking empty space
        if (!this.input.activePointer.targets?.length) {
            if (this.selectedModule) {
                this.selectedModule.box.setAlpha(1).clearTint();
                this.selectedModule = null;
            }
        }
    }
}

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseScene;
}
