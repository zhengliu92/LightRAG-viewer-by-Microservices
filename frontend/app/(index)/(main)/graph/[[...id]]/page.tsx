"use client"

import { useKBGraph } from '@/contexts/kb-graph-context'
import { useCallback, useMemo, useState, useRef } from 'react'
import { GraphVisualization } from '@/components/graph/graph-visualization'
import { GraphDetailsSheet } from '@/components/graph/graph-details-sheet'
import SearchNodeInput from '@/components/graph/search-node-input'
import { GraphNode } from '@/interfaces/kb'
import { useGraphSidebar } from '@/components/graph/graph-sidebar-provider'
import { cn } from '@/lib/utils'

// Color palette for different entity types - optimized for white background
const colorPalette = [
  '#2E86AB', // Steel Blue
  '#725AC1', // Royal Purple
  '#DB504A', // Coral Red
  '#1B998B', // Teal
  '#FF8C42', // Dark Orange
  '#4B4E6D', // Slate Blue
  '#E15554', // Salmon Red
  '#3D5A80', // Navy Blue
  '#8B5FBF', // Medium Purple
  '#2A9D8F', // Sea Green
  '#E76F51', // Burnt Sienna
  '#457B9D'  // Steel Blue Dark
]
export type LinkWithSourceAndTarget = {
  index: number;
  description: string;
  weight: number;
  source: {
    id: string;
    name: string;
    entity_type: string;
  }
  target: {
    id: string;
    name: string;
    entity_type: string;
  }
}
const GraphPage = () => {
  const { activeKbGraph } = useKBGraph()
  const [zoom, setZoom] = useState(1)
  const graphRef = useRef<any>();
  const [centerNode, setCenterNode] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState('')
  const { isOpen } = useGraphSidebar()  
  const [searchResults, setSearchResults] = useState<GraphNode[]>([])
  const [linksWithSourceAndTarget, setLinksWithSourceAndTarget] = useState<LinkWithSourceAndTarget[]>([]);

  const { graphData, entityTypeColors } = useMemo(() => {
    if (!activeKbGraph?.nodes || !activeKbGraph?.edges) {
      return { graphData: { nodes: [], links: [] }, entityTypeColors: {} }
    }
    // Get unique entity types
    const entityTypes = [...new Set(activeKbGraph.nodes.map(node => node.entity_type.replace(/"/g, '')))]
    
    // Create color mapping
    const entityTypeColors = Object.fromEntries(
      entityTypes.map((type, index) => [
        type, 
        colorPalette[index % colorPalette.length]
      ])
    )
    
    const graphData = {
      nodes: activeKbGraph.nodes.map(node => ({
        id: node.id.replace(/"/g, '') as string,
        name: node.description.replace(/"|<SEP>/g, '') as string, 
        val: 1,
        entity_type: node.entity_type.replace(/"/g, '') as string
      })),
      links: activeKbGraph.edges.map(edge => ({
        source: edge.source.replace(/"/g, '') as string,
        target: edge.target.replace(/"/g, '') as string,
        description: edge.description.replace(/"|<SEP>/g, '') as string,
        weight: edge.weight
      }))
    }

    return { graphData, entityTypeColors }
  }, [activeKbGraph])

  const handleNodeClick = useCallback((node: any) => {
    // Aim at node from outside it
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2.5, 1000);
    }
    const connectedLinks:any = graphData.links.filter((link:any) => link.source.id === node.id || link.target.id === node.id );
    
    const connectedLinksWithSourceAndTarget = connectedLinks.map((link:any) => ({
      ...link,
    }));
    
    setLinksWithSourceAndTarget(connectedLinksWithSourceAndTarget );
    setCenterNode(node);
    setShowDetails(true);
  }, [graphData]);



  if (!activeKbGraph?.nodes || !activeKbGraph?.edges) {
    return <div className='h-full w-full flex items-center justify-center text-muted-foreground'>没有可用图谱</div>
  }

  return (
    <div className="h-full">
      <GraphVisualization
        graphRef={graphRef}
        graphData={graphData}
        highlightedNodes={searchResults}
        zoom={zoom}
        setZoom={setZoom}
        onNodeClick={handleNodeClick}
        entityTypeColors={entityTypeColors}
      />
      <GraphDetailsSheet
        showDetails={showDetails}
        setShowDetails={setShowDetails}
        centerNode={centerNode}
        linksWithSourceAndTarget={linksWithSourceAndTarget}
      />
      <div className={cn("fixed bottom-10 w-[400px] max-sm:w-[250px] left-1/2 transition-all duration-300 ease-in-out", isOpen ? "translate-x-[calc(50%-19rem)] max-sm:translate-x-[calc(50%-10rem)]" : "translate-x-[calc(-50%+1rem)]")}>
        <SearchNodeInput 
          nodes={graphData.nodes as GraphNode[]}
          search={search}
          setSearch={setSearch}
          setSearchResults={setSearchResults}
        />
      </div>
    </div>
  )
}

export default GraphPage