// --- Block Catalog (Moved here for better performance on older devices) ---
const BLOXD_BLOCKS = [
    { id: 0, name: "Air (Eraser)", color: "#ffffff", class: "cell-air" },
    { id: 1, name: "Grass Block", color: "#55b655", class: "cell-grass" },
    { id: 2, name: "Stone Block", color: "#888888", class: "cell-stone" },
    { id: 3, name: "Dirt Block", color: "#8b5a2b", class: "cell-dirt" },
    { id: 4, name: "Wood Log", color: "#a0522d", class: "cell-wood" },
    { id: 5, name: "Leaves Block", color: "#2e8b57", class: "cell-leaves" },
    { id: 6, name: "Red Brick", color: "#b22222", class: "cell-brick" },
    { id: 7, name: "Sand Block", color: "#f4a460", class: "cell-sand" }
];

// --- Application State ---
const MAP_SIZE = 32;
let currentLayer = 0; 
let selectedBlockId = 1; 
let isDrawing = false;

let grid3D = Array(MAP_SIZE).fill(null).map(() => 
    Array(MAP_SIZE).fill(null).map(() => 
        Array(MAP_SIZE).fill(0)
    )
);

// --- DOM Elements ---
const gridContainer = document.getElementById("grid-container");
const blockListContainer = document.getElementById("block-list");
const layerSelect = document.getElementById("layer-select");
const coordDisplay = document.getElementById("coord-display");
const exportBtn = document.getElementById("export-btn");

// --- Initialize UI Component ---
function initEditor() {
    // 1. Setup Layer Dropdown Options
    for (let y = MAP_SIZE - 1; y >= 0; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = `Layer Y: ${y}`;
        layerSelect.appendChild(option);
    }
    layerSelect.value = currentLayer;

    // 2. Render Sidebar Blocks
    blockListContainer.innerHTML = ""; // Clear old view
    BLOXD_BLOCKS.forEach(block => {
        const btn = document.createElement("div");
        btn.className = `block-item ${block.id === selectedBlockId ? 'selected' : ''}`;
        btn.textContent = block.name;
        btn.style.borderRight = `5px solid ${block.color}`;
        btn.addEventListener("click", () => {
            document.querySelectorAll(".block-item").forEach(el => el.classList.remove("selected"));
            btn.classList.add("selected");
            selectedBlockId = block.id;
        });
        blockListContainer.appendChild(btn);
    });

    // 3. Configure Grid Columns
    gridContainer.style.gridTemplateColumns = `repeat(${MAP_SIZE}, 1fr)`;
    gridContainer.innerHTML = ""; // Clear old cells

    // 4. Generate Interactive Cells for 2D Canvas View
    for (let z = 0; z < MAP_SIZE; z++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const cell = document.createElement("div");
            cell.className = "grid-cell cell-air";
            cell.dataset.x = x;
            cell.dataset.z = z;

            cell.addEventListener("mousedown", (e) => {
                isDrawing = true;
                drawAtCell(cell);
            });
            cell.addEventListener("mouseenter", () => {
                coordDisplay.textContent = `Coordinates: X: ${cell.dataset.x}, Z: ${cell.dataset.z}`;
                if (isDrawing) drawAtCell(cell);
            });

            gridContainer.appendChild(cell);
        }
    }

    window.addEventListener("mouseup", () => { isDrawing = false; });
    updateGridDisplay();
}

// --- Draw Logic ---
function drawAtCell(cell) {
    const x = parseInt(cell.dataset.x);
    const z = parseInt(cell.dataset.z);
    
    grid3D[currentLayer][z][x] = selectedBlockId;
    
    const activeBlock = BLOXD_BLOCKS.find(b => b.id === selectedBlockId);
    cell.style.backgroundColor = activeBlock ? activeBlock.color : "#ffffff";
}

// --- Refresh Grid View ---
function updateGridDisplay() {
    const cells = gridContainer.children;
    if (cells.length === 0) return;
    
    let index = 0;
    for (let z = 0; z < MAP_SIZE; z++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const blockId = grid3D[currentLayer][z][x];
            const activeBlock = BLOXD_BLOCKS.find(b => b.id === blockId);
            cells[index].style.backgroundColor = activeBlock ? activeBlock.color : "#ffffff";
            index++;
        }
    }
}

layerSelect.addEventListener("change", (e) => {
    currentLayer = parseInt(e.target.value);
    updateGridDisplay();
});

// --- Export Functionality ---
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
    link.download = "custom_map.bloxdschem";
    link.click();
});

// Run application setup
initEditor();
