// --- Block Catalog Configuration ---
const BLOXD_BLOCKS = [
    { id: 0, name: "Air (Eraser)", color: 0xffffff, hexStr: "#ffffff" },
    { id: 1, name: "Grass Block", color: 0x55b655, hexStr: "#55b655" },
    { id: 2, name: "Stone Block", color: 0x888888, hexStr: "#888888" },
    { id: 3, name: "Dirt Block", color: 0x8b5a2b, hexStr: "#8b5a2b" },
    { id: 4, name: "Wood Log", color: 0xa0522d, hexStr: "#a0522d" },
    { id: 5, name: "Leaves Block", color: 0x2e8b57, hexStr: "#2e8b57" },
    { id: 6, name: "Red Brick", color: 0xb22222, hexStr: "#b22222" },
    { id: 7, name: "Sand Block", color: 0xf4a460, hexStr: "#f4a460" }
];

const MAP_SIZE = 32;
let currentLayerY = 0;
let selectedBlockId = 1;
let isDrawing = false;

// Initialize clean 3D Matrix payload structure for the game format
let grid3D = Array(MAP_SIZE).fill(null).map(() => 
    Array(MAP_SIZE).fill(null).map(() => 
        Array(MAP_SIZE).fill(0)
    )
);

// --- DOM Elements ---
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const cellSize = canvas.width / MAP_SIZE;
const selectorEl = document.getElementById('block-selector');
const layerSlider = document.getElementById('current-layer');
const layerValDisplay = document.getElementById('current-layer-val');
const statsDisplay = document.getElementById('stats');
const exportBtn = document.getElementById('export-btn');

// --- Setup Sidebar Block UI Elements ---
BLOXD_BLOCKS.forEach(block => {
    const item = document.createElement('div');
    item.className = `block-item ${block.id === selectedBlockId ? 'active' : ''}`;
    item.innerText = block.name;
    item.style.borderTop = `4px solid ${block.hexStr}`;
    item.onclick = () => {
        document.querySelectorAll('.block-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        selectedBlockId = block.id;
    };
    selectorEl.appendChild(item);
});

// --- Setup Three.js Scene Engine (Live Preview Engine) ---
const threeContainer = document.getElementById('three-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0c);

const camera = new THREE.PerspectiveCamera(45, threeContainer.clientWidth / (threeContainer.clientHeight - 30), 1, 1000);
camera.position.set(MAP_SIZE * 1.2, MAP_SIZE * 0.8, MAP_SIZE * 1.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight - 30);
threeContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(MAP_SIZE / 2, MAP_SIZE / 4, MAP_SIZE / 2);
controls.update();

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
dirLight.position.set(MAP_SIZE, MAP_SIZE * 2, MAP_SIZE);
scene.add(dirLight);

const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95); // Slight gap to avoid visual glitching
let voxelMeshes = {};

// --- Voxel Synchronization Manager ---
function setBlockState(x, y, z, blockId) {
    if(x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE || z < 0 || z >= MAP_SIZE) return;
    
    const key = `${x},${y},${z}`;
    grid3D[y][z][x] = blockId; // Update core data layout

    // Clear old mesh tracking
    if (voxelMeshes[key]) {
        scene.remove(voxelMeshes[key]);
        delete voxelMeshes[key];
    }

    // Generate new mesh if not air block
    if (blockId !== 0) {
        const targetBlock = BLOXD_BLOCKS.find(b => b.id === blockId);
        const material = new THREE.MeshLambertMaterial({ color: targetBlock ? targetBlock.color : 0xaaaaaa });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        voxelMeshes[key] = mesh;
    }
}

// --- 2D Raster Graphics Render Pipeline ---
function render2DGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let x = 0; x < MAP_SIZE; x++) {
        for (let z = 0; z < MAP_SIZE; z++) {
            const blockId = grid3D[currentLayerY][z][x];
            if (blockId !== 0) {
                const targetBlock = BLOXD_BLOCKS.find(b => b.id === blockId);
                ctx.fillStyle = targetBlock ? targetBlock.hexStr : "#ffffff";
                ctx.fillRect(x * cellSize, z * cellSize, cellSize, cellSize);
            }
        }
    }

    // Render low-overhead structural gridlines
    ctx.strokeStyle = "#222225";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= MAP_SIZE; i++) {
        ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(canvas.width, i * cellSize); ctx.stroke();
    }
}

// --- Interaction Handlers ---
function handlePaint(e) {
    const rect = canvas.getBoundingClientRect();
    const cellX = Math.floor((e.clientX - rect.left) / cellSize);
    const cellZ = Math.floor((e.clientY - rect.top) / cellSize);
    
    if (cellX >= 0 && cellX < MAP_SIZE && cellZ >= 0 && cellZ < MAP_SIZE) {
        statsDisplay.innerText = `Coordinates: X: ${cellX}, Z: ${cellZ} | Layer Y: ${currentLayerY}`;
        if (isDrawing) {
            setBlockState(cellX, currentLayerY, cellZ, selectedBlockId);
            render2DGrid();
        }
    }
}

canvas.addEventListener('mousedown', (e) => { isDrawing = true; handlePaint(e); });
canvas.addEventListener('mousemove', (e) => { handlePaint(e); });
window.addEventListener('mouseup', () => { isDrawing = false; });

layerSlider.addEventListener('input', (e) => {
    currentLayerY = parseInt(e.target.value);
    layerValDisplay.innerText = currentLayerY;
    render2DGrid();
});

// --- Safe Game-Compliant Export System ---
exportBtn.addEventListener("click", () => {
    const schematicTemplate = {
        schematicName: "allblocks",
        version: "4",
        format: "V",
        data: {
            persisted: { books: [] },
            gridPayload: grid3D 
        }
    };

    const jsonString = JSON.stringify(schematicTemplate);
    const fileHeader = "allblocks <><4, &V";
    const completePayload = fileHeader + jsonString + " &4{\"persisted\":{\"books\":[]}}";

    const blob = new Blob([completePayload], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hybrid_map.bloxdschem";
    link.click();
});

// --- Render Loop Trigger ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Global setup run
render2DGrid();
animate();

window.addEventListener('resize', () => {
    camera.aspect = threeContainer.clientWidth / (threeContainer.clientHeight - 30);
    camera.updateProjectionMatrix();
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight - 30);
});
