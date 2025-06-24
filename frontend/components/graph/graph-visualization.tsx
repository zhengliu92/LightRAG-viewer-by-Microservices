"use client"

import { GraphNode } from '@/interfaces/kb'
import dynamic from 'next/dynamic'
import { MutableRefObject, useEffect, useRef, useState } from 'react'

// Import ForceGraph dynamically to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface GraphVisualizationProps {
  graphRef: MutableRefObject<any>
  graphData: any
  highlightedNodes: GraphNode[]
  zoom: number
  setZoom: (zoom: number) => void
  onNodeClick: (node: any) => void
  entityTypeColors: Record<string, string>
}

export function GraphVisualization({
  graphRef,
  graphData,
  zoom,
  setZoom,
  onNodeClick,
  highlightedNodes,
  entityTypeColors
}: GraphVisualizationProps) {
  const [nodeValue, setNodeValue] = useState(1); // Initialize state for dynamic node value

  useEffect(() => {
    const interval = setInterval(() => {
      setNodeValue(prev => (prev === 2.5 ? 1.5 : 2.5)); // Toggle between 2.5 and 1
    }, 1000); // Change value every 1000ms (1 second)

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);


  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      nodeLabel={
        (node: any) => 
          `${node.entity_type} - ${node.id}`
      }
      linkLabel={
        (link: any) => 
          `Description: ${link.description}
           Weight: ${link.weight}
           `
      }
      nodeColor={node => 
        highlightedNodes.some(highlightedNode => highlightedNode.id === node.id) 
          ? '#ffff00' 
          : entityTypeColors[node.entity_type] || '#6c757d'
      }
      nodeRelSize={8}
      nodeVal={node => 
        highlightedNodes.some(highlightedNode => highlightedNode.id === node.id) 
          ? nodeValue
          : 1   
      }
      linkWidth={link => Math.max(zoom*1.25, 1.25)}
      onNodeClick={onNodeClick}
      linkDirectionalParticles={1}
      linkDirectionalParticleWidth={link => Math.max(Math.min(zoom*5, 7), 5)}
      d3VelocityDecay={0.3}
      onZoom={zoom => setZoom(zoom.k)}
      nodeCanvasObjectMode={() => "after"}
      nodeCanvasObject={(node: any, ctx, globalScale) => {
        let threshold = 1.1
        let baseFontSize = 14
        let fontStyle = 'rgba(255,255,255,0.8)'
        let fontWeight = 'normal'
        if (highlightedNodes.some(highlightedNode => highlightedNode.id === node.id)) {
          threshold = 0.8
          fontStyle = 'rgba(0,0,0,0.8)'
          fontWeight = 'bold'
        }
        
        if (globalScale < threshold) {
          return
        }
        const label = node.name[0];          
        const fontSize = baseFontSize/globalScale;
        ctx.font = `${fontWeight} ${fontSize}px Sans-Serif`;
        ctx.fillStyle = fontStyle;
        ctx.textAlign = 'center';        
        ctx.textBaseline = 'middle';
        ctx.fillText(label, node.x, node.y);
      }}
      d3AlphaDecay={0.01}
      d3AlphaMin={0.001}
      cooldownTicks={100}
    />
  )
} 