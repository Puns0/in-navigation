import { getFloorLabel } from '../store/useMapStore'

export function buildGraph(floors) {
  const graph = new Map()

  // 1. Add all nodes
  for (const floor of floors) {
    for (const node of floor.nodes) {
      graph.set(node.id, {
        ...node,
        floorId: floor.id,
        edges: []
      })
    }
  }

  // 2. Add intra-floor edges
  for (const floor of floors) {
    for (const edge of floor.edges) {
      const n1 = graph.get(edge.from)
      const n2 = graph.get(edge.to)
      if (n1 && n2) {
        // Calculate Euclidean distance as weight
        const dist = Math.hypot(n1.row - n2.row, n1.col - n2.col)
        n1.edges.push({ to: n2.id, weight: dist })
        n2.edges.push({ to: n1.id, weight: dist })
      }
    }
  }

  // 3. Add cross-floor staircase edges
  // Find all staircases
  const staircases = Array.from(graph.values()).filter(n => n.type === 'staircase')
  
  for (let i = 0; i < staircases.length; i++) {
    for (let j = i + 1; j < staircases.length; j++) {
      const s1 = staircases[i]
      const s2 = staircases[j]
      
      // Link staircases on different floors if they are reasonably close physically (within 10 grid cells)
      if (s1.floorId !== s2.floorId) {
        const dist2D = Math.hypot(s1.row - s2.row, s1.col - s2.col)
        if (dist2D <= 10) {
          const floorDiff = Math.abs(s1.floorId - s2.floorId)
          const dist = (5.0 * floorDiff) + dist2D // Staircase weight penalty
          s1.edges.push({ to: s2.id, weight: dist })
          s2.edges.push({ to: s1.id, weight: dist })
        }
      }
    }
  }

  return graph
}

export function findShortestPath(graph, startId, endId) {
  if (!graph.has(startId) || !graph.has(endId)) return null

  const distances = new Map()
  const previous = new Map()
  const unvisited = new Set()

  for (const key of graph.keys()) {
    distances.set(key, Infinity)
    unvisited.add(key)
  }
  distances.set(startId, 0)

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let curr = null
    let minDist = Infinity
    for (const nodeId of unvisited) {
      const d = distances.get(nodeId)
      if (d < minDist) {
        minDist = d
        curr = nodeId
      }
    }

    if (curr === null || curr === endId) break

    unvisited.delete(curr)

    const node = graph.get(curr)
    for (const edge of node.edges) {
      if (!unvisited.has(edge.to)) continue
      const alt = distances.get(curr) + edge.weight
      if (alt < distances.get(edge.to)) {
        distances.set(edge.to, alt)
        previous.set(edge.to, curr)
      }
    }
  }

  // Reconstruct path
  if (distances.get(endId) === Infinity) return null

  const path = []
  let curr = endId
  while (curr) {
    path.unshift(graph.get(curr))
    curr = previous.get(curr)
  }

  return path
}

export function generateDirections(path) {
  if (!path || path.length < 2) return []

  const directions = []
  const startName = path[0].label || 'Start'
  directions.push({ type: 'start', text: `Start at ${startName}`, node: path[0] })

  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i]
    const next = path[i + 1]

    if (curr.floorId !== next.floorId) {
      directions.push({
        type: 'stairs',
        text: `Take stairs to ${getFloorLabel(next.floorId)}`,
        node: next
      })
      continue
    }

    if (i > 0 && path[i - 1].floorId === curr.floorId) {
      const prev = path[i - 1]
      
      // Calculate vectors
      const v1 = { x: curr.col - prev.col, y: curr.row - prev.row }
      const v2 = { x: next.col - curr.col, y: next.row - curr.row }

      const angle1 = Math.atan2(v1.y, v1.x)
      const angle2 = Math.atan2(v2.y, v2.x)
      
      let diff = (angle2 - angle1) * (180 / Math.PI)
      
      // Normalize to -180 to 180
      while (diff <= -180) diff += 360
      while (diff > 180) diff -= 360

      if (Math.abs(diff) <= 45) {
        if (i === 1 || directions[directions.length - 1].type !== 'straight') {
          directions.push({ type: 'straight', text: 'Go straight', node: curr })
        }
      } else if (diff > 45 && diff <= 135) {
        directions.push({ type: 'right', text: 'Turn right', node: curr })
      } else if (diff < -45 && diff >= -135) {
        directions.push({ type: 'left', text: 'Turn left', node: curr })
      } else {
        directions.push({ type: 'turn_around', text: 'Turn around', node: curr })
      }
    } else {
      directions.push({ type: 'straight', text: 'Head straight', node: curr })
    }
  }

  const dest = path[path.length - 1]
  const destName = dest.label || 'Destination'
  directions.push({ type: 'arrive', text: `Arrive at ${destName}`, node: dest })

  return directions
}
