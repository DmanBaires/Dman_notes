import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Note } from '../types/note';
import { buildGraphData } from '../utils/wikiParser';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, FileText, ArrowRight } from 'lucide-react';

interface GraphViewProps {
  notes: Note[];
  currentNoteId: string;
  onSelectNote: (noteId: string) => void;
}

interface SimNode {
  id: string;
  title: string;
  folder: string;
  linkCount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const GraphView: React.FC<GraphViewProps> = ({
  notes,
  currentNoteId,
  onSelectNote,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const graphData = useMemo(() => buildGraphData(notes), [notes]);

  // Color generator for folders
  const getFolderColor = (folder: string) => {
    switch (folder) {
      case 'Artists':
        return '#f43f5e'; // rose
      case 'Art & Culture':
        return '#fb923c'; // orange
      case 'Movements':
        return '#fbbf24'; // amber
      case 'Themes':
        return '#38bdf8'; // sky
      case 'Debian System':
        return '#ec4899'; // pink
      default:
        return '#a855f7'; // purple
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize node physics
    const simNodes: SimNode[] = graphData.nodes.map((n, i) => {
      const angle = (i / Math.max(1, graphData.nodes.length)) * Math.PI * 2;
      const dist = 140 + Math.random() * 80;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: Math.max(8, Math.min(22, 10 + n.linkCount * 2.5)),
      };
    });

    const nodeMap = new Map<string, SimNode>();
    simNodes.forEach((node) => nodeMap.set(node.id, node));

    let animationId: number;

    // Simulation loop
    const step = () => {
      // Repulsion between nodes
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const a = simNodes[i];
          const b = simNodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          if (dist < 260) {
            const force = 180 / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // Spring attraction along links
      graphData.links.forEach((link) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 90;
        const force = (dist - targetDist) * 0.015;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      });

      // Gravity towards center
      const centerX = width / 2;
      const centerY = height / 2;
      simNodes.forEach((node) => {
        node.vx += (centerX - node.x) * 0.002;
        node.vy += (centerY - node.y) * 0.002;

        // Damping
        node.vx *= 0.88;
        node.vy *= 0.88;

        node.x += node.vx;
        node.y += node.vy;
      });

      // Render
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // Draw links
      graphData.links.forEach((link) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return;

        const isCurrent = source.id === currentNoteId || target.id === currentNoteId;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = isCurrent
          ? 'rgba(244, 63, 94, 0.7)'
          : link.isAuto
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isCurrent ? 2 : link.isAuto ? 1 : 1.5;
        if (link.isAuto) {
          ctx.setLineDash([3, 3]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
      });

      // Draw nodes
      simNodes.forEach((node) => {
        const isSelected = node.id === currentNoteId;
        const isHovered = hoveredNode?.id === node.id;
        const color = getFolderColor(node.folder);

        // Halo / glow
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.15)';
          ctx.fill();
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)';
        ctx.stroke();

        // Node title label
        ctx.font = `${isSelected ? '600 12px' : '400 11px'} 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(node.title, node.x, node.y + node.radius + 14);
      });

      ctx.restore();

      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [graphData, currentNoteId, zoom, pan]);

  // Click & hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan((prev) => ({
        x: prev.x + (e.clientX - dragStart.x),
        y: prev.y + (e.clientY - dragStart.y),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Invert transform
    const width = canvas.width;
    const height = canvas.height;
    const simX = (mouseX - pan.x - width / 2) / zoom + width / 2;
    const simY = (mouseY - pan.y - height / 2) / zoom + height / 2;

    // Find closest node
    const found = graphData.nodes.find((n) => {
      // Find rendered coordinates approximation
      return false; // Handled directly in click
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const simX = (mouseX - pan.x - width / 2) / zoom + width / 2;
    const simY = (mouseY - pan.y - height / 2) / zoom + height / 2;

    // Check hit against all notes in graph
    for (const n of graphData.nodes) {
      // Match node by title in graph
      const note = notes.find((item) => item.id === n.id);
      if (note) {
        // Simple approximate hit detection or quick selection
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col overflow-hidden select-none">
      {/* Controls HUD */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 bg-neutral-900/90 rounded-lg border border-neutral-800 shadow-xl backdrop-blur-md text-xs">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend & Note Quick List Overlay */}
      <div className="absolute bottom-4 left-4 z-20 p-3 bg-neutral-900/90 rounded-lg border border-neutral-800 shadow-xl backdrop-blur-md text-xs max-w-sm">
        <div className="font-semibold text-neutral-200 mb-2 flex items-center justify-between">
          <span>Knowledge Graph ({graphData.nodes.length} notes, {graphData.links.length} connections)</span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400 mb-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Artists</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Movements</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Themes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span>Debian</span>
          </div>
        </div>
        <p className="text-[10px] text-neutral-400">
          Solid lines = explicit wiki links <code className="text-neutral-400">[[...]]</code> · Dashed lines = auto-detected note title mentions!
        </p>
      </div>

      {/* Quick Jump List on the right */}
      <div className="absolute top-16 right-4 z-20 w-64 max-h-[60vh] bg-neutral-900/90 rounded-lg border border-neutral-800 shadow-xl backdrop-blur-md overflow-hidden flex flex-col text-xs">
        <div className="px-3 py-2 border-b border-neutral-800 font-medium text-neutral-300 flex items-center justify-between">
          <span>Nodes in Graph</span>
          <span className="text-[10px] text-neutral-400">Click to jump</span>
        </div>
        <div className="overflow-y-auto p-1.5 space-y-1">
          {graphData.nodes
            .sort((a, b) => b.linkCount - a.linkCount)
            .map((node) => (
              <button
                key={node.id}
                onClick={() => onSelectNote(node.id)}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-xs transition-colors ${
                  node.id === currentNoteId
                    ? 'bg-rose-950/70 text-rose-200 border border-rose-800/60'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getFolderColor(node.folder) }}
                  />
                  <span className="truncate">{node.title}</span>
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                  {node.linkCount} links
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          setDragStart({ x: e.clientX, y: e.clientY });
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
