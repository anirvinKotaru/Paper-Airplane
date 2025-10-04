import React, { useState, useRef, useEffect } from 'react';
import { 
  FaTimes, 
  FaPaperPlane, 
  FaPaintBrush, 
  FaEraser, 
  FaFillDrip, 
  FaUndo, 
  FaRedo, 
  FaDownload, 
  FaTrash 
} from 'react-icons/fa';

const DrawNote = ({ isOpen, onClose, onSave, savingMessage }) => {
  const [drawingStrokes, setDrawingStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [drawingTool, setDrawingTool] = useState('brush');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  const canvasRef = useRef(null);

  // Real-time drawing canvas update
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw all completed strokes
      drawingStrokes.forEach(stroke => {
        if (stroke.length > 1) {
          ctx.beginPath();
          ctx.moveTo(stroke[0].x, stroke[0].y);
          for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
          }
          ctx.strokeStyle = stroke[0].color;
          ctx.lineWidth = stroke[0].size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });
      
      // Draw current stroke being drawn
      if (currentStroke.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) {
          ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
        ctx.strokeStyle = currentStroke[0].color;
        ctx.lineWidth = currentStroke[0].size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }
  }, [drawingStrokes, currentStroke, isOpen]);

  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getEventPos(e);
    
    if (drawingTool === 'fill') {
      fillArea(pos.x, pos.y);
      return;
    }
    
    const newPoint = { 
      x: pos.x, 
      y: pos.y, 
      color: drawingTool === 'eraser' ? '#FFFFFF' : currentColor, 
      size: drawingTool === 'eraser' ? brushSize * 2 : brushSize,
      tool: drawingTool
    };
    setCurrentStroke([newPoint]);
  };

  const draw = (e) => {
    if (!isDrawing || drawingTool === 'fill') return;
    e.preventDefault();
    const pos = getEventPos(e);
    const newPoint = { 
      x: pos.x, 
      y: pos.y, 
      color: drawingTool === 'eraser' ? '#FFFFFF' : currentColor, 
      size: drawingTool === 'eraser' ? brushSize * 2 : brushSize,
      tool: drawingTool
    };
    setCurrentStroke(prev => [...prev, newPoint]);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (isDrawing && currentStroke.length > 0) {
      setDrawingStrokes(prev => [...prev, currentStroke]);
      setUndoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
      setRedoStack([]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const fillArea = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const targetColor = getPixelColor(data, x, y, canvas.width);
    const fillColor = hexToRgb(currentColor);
    
    if (colorsEqual(targetColor, fillColor)) return;
    
    const stack = [{x: Math.floor(x), y: Math.floor(y)}];
    const visited = new Set();
    
    while (stack.length > 0) {
      const {x: px, y: py} = stack.pop();
      const key = `${px},${py}`;
      
      if (visited.has(key) || px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
        continue;
      }
      
      const pixelColor = getPixelColor(data, px, py, canvas.width);
      if (!colorsEqual(pixelColor, targetColor)) {
        continue;
      }
      
      visited.add(key);
      setPixelColor(data, px, py, fillColor, canvas.width);
      
      stack.push({x: px + 1, y: py}, {x: px - 1, y: py}, {x: px, y: py + 1}, {x: px, y: py - 1});
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add fill operation to history
    const fillStroke = [{x, y, color: currentColor, size: 1, tool: 'fill'}];
    setDrawingStrokes(prev => [...prev, fillStroke]);
    setUndoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
    setRedoStack([]);
  };

  const getPixelColor = (data, x, y, width) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3]
    };
  };

  const setPixelColor = (data, x, y, color, width) => {
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = 255;
  };

  const colorsEqual = (color1, color2) => {
    return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  };

  const clearDrawing = () => {
    if (drawingStrokes.length > 0 || currentStroke.length > 0) {
      setUndoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
      setRedoStack([]);
    }
    setDrawingStrokes([]);
    setCurrentStroke([]);
  };

  const undoDrawing = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
      setDrawingStrokes(lastState.strokes);
      setCurrentStroke(lastState.currentStroke);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const redoDrawing = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, { strokes: drawingStrokes, currentStroke }]);
      setDrawingStrokes(nextState.strokes);
      setCurrentStroke(nextState.currentStroke);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const downloadDrawing = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `paper-airplane-drawing-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handleSave = () => {
    if (drawingStrokes.length === 0) {
      // Use a more user-friendly notification instead of alert
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #DC143C, #B22222);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        font-weight: 700;
        z-index: 2000;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        animation: slideInDown 0.3s ease-out;
      `;
      toast.textContent = 'Please draw something first';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      return;
    }
    onSave(drawingStrokes);
    setDrawingStrokes([]);
    setCurrentStroke([]);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleClose = () => {
    setDrawingStrokes([]);
    setCurrentStroke([]);
    setUndoStack([]);
    setRedoStack([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">🎨 Draw a Picture</h2>
          <button onClick={handleClose} className="close-button">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="drawing-container">
            <div className="drawing-toolbar">
              <div className="toolbar-section">
                <h4>Tools</h4>
                <div className="toolbar-tools">
                  <button
                    className={`tool-button ${drawingTool === 'brush' ? 'active-tool' : ''}`}
                    onClick={() => setDrawingTool('brush')}
                    title="Brush"
                  >
                    <FaPaintBrush size={16} />
                  </button>
                  <button
                    className={`tool-button ${drawingTool === 'eraser' ? 'active-tool' : ''}`}
                    onClick={() => setDrawingTool('eraser')}
                    title="Eraser"
                  >
                    <FaEraser size={16} />
                  </button>
                  <button
                    className={`tool-button ${drawingTool === 'fill' ? 'active-tool' : ''}`}
                    onClick={() => setDrawingTool('fill')}
                    title="Fill"
                  >
                    <FaFillDrip size={16} />
                  </button>
                </div>
              </div>
              
              <div className="toolbar-section">
                <h4>Colors</h4>
                <div className="color-palette">
                  {/* Standard drawing colors */}
                  {[
                    '#000000', // Black
                    '#FFFFFF', // White
                    '#FF0000', // Red
                    '#00FF00', // Green
                    '#0000FF', // Blue
                    '#FFFF00', // Yellow
                    '#FF00FF', // Magenta
                    '#00FFFF', // Cyan
                    '#FFA500', // Orange
                    '#800080', // Purple
                    '#FFC0CB', // Pink
                    '#A52A2A', // Brown
                    '#808080', // Gray
                    '#FFD700', // Gold
                    '#C0C0C0', // Silver
                    '#8B4513'  // Saddle Brown
                  ].map((color) => (
                    <button
                      key={color}
                      className={`color-option ${currentColor === color ? 'selected-color' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div className="toolbar-section">
                <h4>Brush Size</h4>
                <div className="brush-sizes">
                  {[1, 3, 5, 8, 12, 16].map((size) => (
                    <button
                      key={size}
                      className={`brush-size-option ${brushSize === size ? 'selected-brush-size' : ''}`}
                      onClick={() => setBrushSize(size)}
                    >
                      <div 
                        className="brush-preview" 
                        style={{ 
                          width: Math.min(size, 12), 
                          height: Math.min(size, 12), 
                          backgroundColor: currentColor 
                        }} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="toolbar-actions">
                <button 
                  className="toolbar-button undo-button" 
                  onClick={undoDrawing}
                  disabled={undoStack.length === 0}
                  title="Undo"
                >
                  <FaUndo size={16} />
                </button>
                <button 
                  className="toolbar-button redo-button" 
                  onClick={redoDrawing}
                  disabled={redoStack.length === 0}
                  title="Redo"
                >
                  <FaRedo size={16} />
                </button>
                <button 
                  className="toolbar-button download-button" 
                  onClick={downloadDrawing}
                  disabled={drawingStrokes.length === 0}
                  title="Download"
                >
                  <FaDownload size={16} />
                </button>
                <button className="toolbar-button clear-button" onClick={clearDrawing} title="Clear">
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
            
            <canvas
              ref={canvasRef}
              className="drawing-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              width={400}
              height={300}
            />
            <div className="drawing-info">
              {drawingStrokes.length} stroke{drawingStrokes.length !== 1 ? 's' : ''} drawn
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={savingMessage || drawingStrokes.length === 0}
          >
            <FaPaperPlane size={20} />
            {savingMessage ? 'Sending...' : 'Send Drawing'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawNote;
