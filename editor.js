// --- Application State ---
const MAP_SIZE = 32;
let currentLayer = 0; // Current Y elevation (0 to 31)
let selectedBlockId = 1; // Default selected block: Grass
let isDrawing = false;

// 3D Matrix initialized with 0 (Air blocks)
// Structure: grid[y][z][x]
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

    // 2. Render Sidebar Blocks from blocks.js Catalog
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

    // 4. Generate Interactive Cells for 2D Canvas View
    for (let z = 0; z < MAP_SIZE; z++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const cell = document.createElement("div");
            cell.className = "grid-cell cell-air";
            cell.dataset.x = x;
            cell.dataset.z = z;

            // Mouse interaction handlers
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

    // Global listener to stop painting when mouse is released
    window.addEventListener("mouseup", () => { isDrawing = false; });

    updateGridDisplay();
}

// --- Draw Logic ---
function drawAtCell(cell) {
    const x = parseInt(cell.dataset.x);
    const z = parseInt(cell.dataset.z);
    
    // Save block type into the 3D matrix
    grid3D[currentLayer][z][x] = selectedBlockId;
    
    // Update visual color instantly
    const activeBlock = BLOXD_BLOCKS.find(b => b.id === selectedBlockId);
    cell.style.backgroundColor = activeBlock ? activeBlock.color : "#ffffff";
}

// --- Refresh Grid View when shifting layers ---
function updateGridDisplay() {
    const cells = gridContainer.children;
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

// Layer change trigger
layerSelect.addEventListener("change", (e) => {
    currentLayer = parseInt(e.target.value);
    updateGridDisplay();
});

// --- Export Functionality (.bloxdschem hybrid file generator) ---
exportBtn.addEventListener("click", () => {
    // Generate text structure matching the format extracted from allblocks.bloxdschem
    const schematicTemplate = {
        schematicName: "allblocks",
        version: "4",
        format: "V",
        data: {
            persisted: {
                books: []
            },
            gridPayload: grid3D // Embed our designed blocks layout
        }
    };

    // Serialize object to JSON string format
    const jsonString = JSON.stringify(schematicTemplate);
    
    // Format payload matching game header standard
    const fileHeader = "allblocks <><4, &V";
    const completePayload = fileHeader + jsonString + '" &4{"persisted":{"books":[]}} ';

    // Download pipeline trigger
    const blob = new Blob([completePayload], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "custom_map.bloxdschem";
    link.click();
});

// Run application setup
initEditor();
