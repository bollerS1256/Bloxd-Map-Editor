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
let activeMode = "2D"; 

// 3D Matrix payload structure
let grid3D = Array(MAP_SIZE).fill(null).map(() => 
    Array(MAP_SIZE).fill(null).map(() => 
        Array(MAP_SIZE).fill(0)
    )
);

// --- DOM Elements ---
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvas-container');
const selectorEl = document.getElementById('block-selector');
const layerSlider = document.getElementById('current-layer');
const layerValDisplay = document.getElementById('current-layer-val');
const statsDisplay = document.getElementById('stats');
const exportBtn = document.getElementById('export-btn');
const toggleViewBtn = document.getElementById('toggle-view-btn');

const panel2D = document.getElementById('panel-2d');
const panel3D = document.getElementById('panel-3d');
const threeContainer = document.getElementById('three-container');

// --- 2D Navigation Engine ---
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;
let isDrawing2D = false;

// Set default auto-fit view matrix configurations
function reset2DView() {
    const cw = canvasContainer.clientWidth || 600;
    const ch = canvasContainer.clientHeight || 600;
    scale = Math.min((cw - 40) / canvas.width, (ch - 40) / canvas.height);
    offsetX = (cw - canvas.width * scale) / 2;
    offsetX = (ch - canvas.height * scale) / 2;
    draw2DGrid();
}

// --- Render Sidebar Catalog Items ---
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

// --- Setup Three.js 3D Viewport Engine ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0c);

const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
camera.position.set(MAP_SIZE * 1.2, MAP_SIZE * 1.2, MAP_SIZE * 1.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
threeContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(MAP_SIZE / 2, MAP_SIZE / 4, MAP_SIZE / 2);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
dirLight.position.set(MAP_SIZE, MAP_SIZE * 2, MAP_SIZE);
scene.add(dirLight);

const baseGridGeo = new THREE.GridHelper(MAP_SIZE, MAP_SIZE, 0x00adb5, 0x333333);
baseGridGeo.position.set(MAP_SIZE/2 - 0.5, -0.5, MAP_SIZE/2 - 0.5);
scene.add(baseGridGeo);

const planeGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
planeGeo.rotation.x = -Math.PI / 2;
planeGeo.position.set(MAP_SIZE/2 - 0.5, -0.5, MAP_SIZE/2 - 0.5);
const invisiblePlane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ visible: false }));
scene.add(invisiblePlane);

const geometry = new THREE.BoxGeometry(0.98, 0.98, 0.98);
let voxelMeshes = {};
let interactiveTargetsList = [invisiblePlane];

function setBlockState(x, y, z, blockId, refresh2D = true) {
    if(x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE || z < 0 || z >= MAP_SIZE) return;
    
    const key = `${x},${y},${z}`;
    grid3D[y][z][x] = blockId;

    if (voxelMeshes[key]) {
        scene.remove(voxelMeshes[key]);
        interactiveTargetsList = interactiveTargetsList.filter(item => item !== voxelMeshes[key]);
        delete voxelMeshes[key];
    }

    if (blockId !== 0) {
        const targetBlock = BLOXD_BLOCKS.find(b => b.id === blockId);
        const material = new THREE.MeshLambertMaterial({ color: targetBlock ? targetBlock.color : 0xaaaaaa });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.gridCoords = { x, y, z };
        scene.add(mesh);
        voxelMeshes[key] = mesh;
        interactiveTargetsList.push(mesh);
    }
    
    if (refresh2D && activeMode === "2D") draw2DGrid();
}

// --- Dynamic Canvas Render Loop (Pan/Zoom Compliant) ---
const cellSize = canvas.width / MAP_SIZE;
function draw2DGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

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

    // Grid wireframes
    ctx.strokeStyle = "#222225";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= MAP_SIZE; i++) {
        ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(canvas.width, i * cellSize); ctx.stroke();
    }
    
    ctx.restore();
}

// --- View State Changer ---
function switchEditorMode() {
    if (activeMode === "2D") {
        activeMode = "3D";
        panel2D.classList.remove('active');
        panel3D.classList.add('active');
        toggleViewBtn.innerText = "Switch to 2D View";
        trigger3DResize();
    } else {
        activeMode = "2D";
        panel3D.classList.remove('active');
        panel2D.classList.add('active');
        toggleViewBtn.innerText = "Switch to 3D View";
        setTimeout(reset2DView, 30);
    }
}

function trigger3DResize() {
    const w = threeContainer.clientWidth || 600;
    const h = threeContainer.clientHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

// --- 2D Interactive Mouse Calculations ---
canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const mouseX = e.clientX - canvasContainer.getBoundingClientRect().left;
    const mouseY = e.clientY - canvasContainer.getBoundingClientRect().top;
    
    // Zoom relative to current pointer location
    const wheelData = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
    
    offsetX = mouseX - (mouseX - offsetX) * wheelData;
    offsetY = mouseY - (mouseY - offsetY) * wheelData;
    scale *= wheelData;
    scale = Math.max(0.1, Math.min(scale, 20));
    
    draw2DGrid();
}, { passive: false });

canvasContainer.addEventListener('mousedown', (e) => {
    if (e.button === 2) { 
        isPanning = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
    } else if (e.button === 0) { 
        isDrawing2D = true;
        process2DDrawCoords(e);
    }
});

canvasContainer.addEventListener('mousemove', (e) => {
    if (isPanning) {
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        draw2DGrid();
    } else if (isDrawing2D) {
        process2DDrawCoords(e);
    }
});

window.addEventListener('mouseup', () => { isPanning = false; isDrawing2D = false; });
canvasContainer.addEventListener('contextmenu', e => e.preventDefault());

function process2DDrawCoords(e) {
    const rect = canvasContainer.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const canvasX = (mx - offsetX) / scale;
    const canvasZ = (my - offsetY) / scale;
    
    const cellX = Math.floor(canvasX / cellSize);
    const cellZ = Math.floor(canvasZ / cellSize);
    
    if (cellX >= 0 && cellX < MAP_SIZE && cellZ >= 0 && cellZ < MAP_SIZE) {
        statsDisplay.innerHTML = `Coordinates: X: ${cellX}, Z: ${cellZ}<br>Active Layer Y: ${currentLayerY}`;
        setBlockState(cellX, currentLayerY, cellZ, selectedBlockId, true);
    }
}

// --- 3D Interactive Raycasting Physics ---
const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2();
let spacebarPressed = false;

window.addEventListener('keydown', (e) => { if (e.code === 'Space') spacebarPressed = true; });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') spacebarPressed = false; });

threeContainer.addEventListener('mousedown', (e) => {
    if (activeMode !== "3D" || spacebarPressed || e.button !== 0) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseVector, camera);
    const intersects = raycaster.intersectObjects(interactiveTargetsList);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        
        if (selectedBlockId === 0) { 
            if (intersect.object !== invisiblePlane) {
                const coords = intersect.object.gridCoords;
                setBlockState(coords.x, coords.y, coords.z, 0, false);
            }
        } else { 
            const normal = intersect.face.normal;
            let targetX = Math.floor(intersect.point.x + normal.x * 0.5 + 0.5);
            let targetY = Math.floor(intersect.point.y + normal.y * 0.5 + 0.5);
            let targetZ = Math.floor(intersect.point.z + normal.z * 0.5 + 0.5);
            
            if (intersect.object === invisiblePlane) {
                targetX = Math.floor(intersect.point.x + 0.5);
                targetZ = Math.floor(intersect.point.z + 0.5);
                targetY = 0;
            }

            setBlockState(targetX, targetY, targetZ, selectedBlockId, false);
        }
    }
});

// --- UI Configurations ---
layerSlider.addEventListener('input', (e) => {
    currentLayerY = parseInt(e.target.value);
    layerValDisplay.innerText = currentLayerY;
    if (activeMode === "2D") draw2DGrid();
});

exportBtn.addEventListener("click", () => {
    const schematicTemplate = {
        schematicName: "allblocks",
        version: "4",
        format: "V",
        data: { persisted: { books: [] }, gridPayload: grid3D }
    };
    const completePayload = "allblocks <><4, &V" + JSON.stringify(schematicTemplate) + " &4{\"persisted\":{\"books\":[]}}";
    const blob = new Blob([completePayload], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hybrid_map.bloxdschem";
    link.click();
});

function animate() {
    requestAnimationFrame(animate);
    if (activeMode === "3D") {
        controls.enabled = spacebarPressed; 
        controls.update();
        renderer.render(scene, camera);
    }
}

// Global initialization triggers
animate();
setTimeout(reset2DView, 150);
window.addEventListener('resize', () => { 
    if (activeMode === "3D") trigger3DResize(); 
    else reset2DView();
});
