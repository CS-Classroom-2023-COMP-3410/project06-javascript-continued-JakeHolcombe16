const canvasContainer = document.getElementById("canvasContainer");
const brushSize = document.getElementById("brushSize");
const brushColor = document.getElementById("brushColor");
const bgColor = document.getElementById("bgColor");
const applyBgColorButton = document.getElementById("applyBgColor");
const eraserButton = document.getElementById("eraser");
const textToolButton = document.getElementById("textTool");
const undoButton = document.getElementById("undo");
const clearButton = document.getElementById("clear");
const saveButton = document.getElementById("save");
const drawCircleButton = document.getElementById("drawCircle");
const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");

const addLayerButton = document.getElementById("addLayer");
const deleteLayerButton = document.getElementById("deleteLayer");
const moveUpButton = document.getElementById("moveUp");
const moveDownButton = document.getElementById("moveDown");
const layerSelect = document.getElementById("layerSelect");

let layers = [];
let activeLayerIndex = 0;
let zoomLevel = 1.0;

const fillToolButton = document.getElementById("fillTool");
let fillMode = false;

// Initialize first layer
addLayer();

// Add a new layer
addLayerButton.addEventListener("click", addLayer);

function addLayer() {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 500;
    canvas.style.zIndex = layers.length;
    canvasContainer.appendChild(canvas);

    layers.push({ canvas, ctx });

    updateLayerSelect();
    setActiveLayer(layers.length - 1);
}

// Update the layer selection dropdown
function updateLayerSelect() {
    layerSelect.innerHTML = "";
    layers.forEach((layer, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.textContent = `Layer ${index + 1}`;
        layerSelect.appendChild(option);
    });
    layerSelect.value = activeLayerIndex;
}

// Set active layer
layerSelect.addEventListener("change", (e) => {
    setActiveLayer(parseInt(e.target.value));
});

function setActiveLayer(index) {
    activeLayerIndex = index;
    layerSelect.value = index;
}

// Delete the active layer
deleteLayerButton.addEventListener("click", () => {
    if (layers.length > 1) {
        let layerToRemove = layers.splice(activeLayerIndex, 1)[0];
        canvasContainer.removeChild(layerToRemove.canvas);
        updateLayerSelect();
        setActiveLayer(Math.max(0, activeLayerIndex - 1));
    }
});

// Move active layer up
moveUpButton.addEventListener("click", () => {
    if (activeLayerIndex < layers.length - 1) {
        swapLayers(activeLayerIndex, activeLayerIndex + 1);
        setActiveLayer(activeLayerIndex + 1);
    }
});

// Move active layer down
moveDownButton.addEventListener("click", () => {
    if (activeLayerIndex > 0) {
        swapLayers(activeLayerIndex, activeLayerIndex - 1);
        setActiveLayer(activeLayerIndex - 1);
    }
});

function swapLayers(i, j) {
    [layers[i], layers[j]] = [layers[j], layers[i]];
    layers[i].canvas.style.zIndex = i;
    layers[j].canvas.style.zIndex = j;
    updateLayerSelect();
}

// Zoom functionality
zoomInButton.addEventListener("click", () => {
    zoomLevel += 0.2;
    updateZoom();
});

zoomOutButton.addEventListener("click", () => {
    if (zoomLevel > 0.4) {
        zoomLevel -= 0.2;
        updateZoom();
    }
});

function updateZoom() {
    layers.forEach(layer => {
        layer.canvas.style.transform = `scale(${zoomLevel})`;
    });
}

// Drawing and Erasing Logic
let drawing = false;
canvasContainer.addEventListener("mousedown", (e) => {
    drawing = true;
});

canvasContainer.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    let ctx = layers[activeLayerIndex].ctx;
    let canvas = layers[activeLayerIndex].canvas;
    let x = e.offsetX;
    let y = e.offsetY;

    ctx.lineWidth = brushSize.value;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (eraserButton.textContent === "Eraser On") {
        ctx.clearRect(x - brushSize.value / 2, y - brushSize.value / 2, brushSize.value, brushSize.value);
    } else {
        ctx.strokeStyle = brushColor.value;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1, y + 1);
        ctx.stroke();
    }
});

canvasContainer.addEventListener("mouseup", () => {
    drawing = false;
});

// Clear Canvas
clearButton.addEventListener("click", () => {
    layers.forEach(layer => {
        layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    });
});

// Save Drawing
saveButton.addEventListener("click", () => {
    let finalCanvas = document.createElement("canvas");
    finalCanvas.width = 800;
    finalCanvas.height = 500;
    let finalCtx = finalCanvas.getContext("2d");

    layers.forEach(layer => {
        finalCtx.drawImage(layer.canvas, 0, 0);
    });

    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = finalCanvas.toDataURL();
    link.click();
});

// Flood Fill Algorithm (Bucket Fill)
function floodFill(x, y, fillColor) {
    let ctx = layers[activeLayerIndex].ctx;
    let canvas = layers[activeLayerIndex].canvas;

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    let targetColor = getPixelColor(x, y, data, canvas.width);
    let newColor = hexToRGBA(fillColor);

    if (colorsMatch(targetColor, newColor)) return;

    let stack = [[x, y]];

    while (stack.length) {
        let [px, py] = stack.pop();
        let index = (py * canvas.width + px) * 4;

        if (!colorsMatch(getPixelColor(px, py, data, canvas.width), targetColor)) continue;

        data[index] = newColor[0];
        data[index + 1] = newColor[1];
        data[index + 2] = newColor[2];
        data[index + 3] = newColor[3];

        if (px > 0) stack.push([px - 1, py]);
        if (px < canvas.width - 1) stack.push([px + 1, py]);
        if (py > 0) stack.push([px, py - 1]);
        if (py < canvas.height - 1) stack.push([px, py + 1]);
    }

    ctx.putImageData(imageData, 0, 0);
}

// Get the color of a pixel
function getPixelColor(x, y, data, width) {
    let index = (y * width + x) * 4;
    return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

// Convert HEX to RGBA
function hexToRGBA(hex) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
}

// Check if two colors match
function colorsMatch(c1, c2) {
    return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
}

// Handle Fill Tool Click
canvasContainer.addEventListener("click", (e) => {
    if (fillMode) {
        let x = e.offsetX;
        let y = e.offsetY;
        floodFill(x, y, brushColor.value);
    }
});