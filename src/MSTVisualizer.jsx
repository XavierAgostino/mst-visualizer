import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';

const MSTVisualizer = () => {
  // =========================
  //       STATE
  // =========================
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [algorithm, setAlgorithm] = useState('prims');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [graphParams, setGraphParams] = useState({
    nodeCount: 6,
    density: 0.5, // default
    minWeight: 1,
    maxWeight: 20
  });
  const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
  const [explanation, setExplanation] = useState('');
  const [mstResult, setMstResult] = useState({ edges: [], totalWeight: 0 });
  const [animationSpeed, setAnimationSpeed] = useState(1000);

  // Algorithm-specific data structures
  const [visitedNodes, setVisitedNodes] = useState(new Set());
  const [minHeap, setMinHeap] = useState([]);
  const [sortedEdges, setSortedEdges] = useState([]);
  const [unionFind, setUnionFind] = useState([]);
  const [currentAlgorithmStep, setCurrentAlgorithmStep] = useState('');

  // =========================
  //  MANUAL MODE ENHANCEMENTS
  // =========================
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [isDeletingEdge, setIsDeletingEdge] = useState(false);

  // For partial edge creation
  const [tempNode, setTempNode] = useState(null);

  // Refs
  const svgRef = useRef(null);
  const animationFrameId = useRef(null);

  // =========================
  //   HANDLE SPEED CHANGE
  // =========================
  const handleSpeedChange = (e) => {
    const value = parseInt(e.target.value);
    // Convert slider value (1-5) to milliseconds (2000ms to 200ms)
    const speed = 2200 - value * 400;
    setAnimationSpeed(speed);
  };

  // =========================
  //   GENERATE RANDOM GRAPH
  // =========================
  const generateRandomGraph = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);
    setVisitedNodes(new Set());
    setMinHeap([]);
    setSortedEdges([]);
    setUnionFind([]);
    setCurrentAlgorithmStep('');
    setExplanation('Random graph generated. Select an algorithm and press "Start" to begin.');

    const { nodeCount, density, minWeight, maxWeight } = graphParams;

    // Create nodes
    const newNodes = [];
    const svgWidth = svgRef.current ? svgRef.current.clientWidth : 500;
    const svgHeight = svgRef.current ? svgRef.current.clientHeight : 400;
    let radius = Math.min(svgWidth, svgHeight) / 3 - 30;
    radius = Math.max(radius, 40); // ensure it never goes below 40
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i * 2 * Math.PI) / nodeCount;
      const randomOffset = Math.random() * 20 - 10;
      const nodeRadius = radius + randomOffset;

      newNodes.push({
        id: i,
        x: centerX + nodeRadius * Math.cos(angle),
        y: centerY + nodeRadius * Math.sin(angle),
        label: String.fromCharCode(65 + i)
      });
    }

    // Create edges
    const newEdges = [];
    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
    const targetEdgeCount = Math.ceil(maxPossibleEdges * density);

    const possibleEdges = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const source = newNodes[i];
        const target = newNodes[j];
        const distance = Math.sqrt((target.x - source.x) ** 2 + (target.y - source.y) ** 2);

        possibleEdges.push({ source: i, target: j, distance });
      }
    }
    // Sort edges by distance
    possibleEdges.sort((a, b) => a.distance - b.distance);

    // Ensure connectivity by creating an MST first
    const mstEdges = [];
    const connectedNodes = new Set([0]);
    while (connectedNodes.size < nodeCount && possibleEdges.length > 0) {
      const edgeIndex = possibleEdges.findIndex(
        (edge) =>
          (connectedNodes.has(edge.source) && !connectedNodes.has(edge.target)) ||
          (connectedNodes.has(edge.target) && !connectedNodes.has(edge.source))
      );
      if (edgeIndex === -1) break;

      const edge = possibleEdges.splice(edgeIndex, 1)[0];
      mstEdges.push(edge);
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }
    // Add MST edges
    for (const edge of mstEdges) {
      const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
      newEdges.push({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        weight,
        status: 'unvisited'
      });
    }

    // Select remaining edges (shortest first) based on density
    const remainingEdgeCount = Math.max(0, targetEdgeCount - mstEdges.length);
    const selectedRemainingEdges = possibleEdges.slice(0, remainingEdgeCount);

    for (const edge of selectedRemainingEdges) {
      const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
      newEdges.push({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        weight,
        status: 'unvisited'
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  };

  // =========================
  //   FIND CONNECTED COMPONENTS
  // =========================
  const findConnectedComponents = (nodeArr, edgeArr) => {
    const parent = {};
    nodeArr.forEach((node) => (parent[node.id] = node.id));

    const find = (x) => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };

    const union = (x, y) => {
      parent[find(x)] = find(y);
    };

    edgeArr.forEach((edge) => {
      union(edge.source, edge.target);
    });

    const components = {};
    nodeArr.forEach((node) => {
      const root = find(node.id);
      if (!components[root]) {
        components[root] = [];
      }
      components[root].push(node.id);
    });
    return Object.values(components);
  };

  // =========================
  //   ALGORITHM CHANGE
  // =========================
  const handleAlgorithmChange = (e) => {
    const newAlgorithm = e.target.value;
    setAlgorithm(newAlgorithm);

    // Reset data structures
    if (newAlgorithm === 'prims') {
      setVisitedNodes(new Set());
      setMinHeap([]);
    } else {
      setSortedEdges([]);
      setUnionFind([]);
    }
    resetGraph();
  };

  // =========================
  //   RESET GRAPH
  // =========================
  const resetGraph = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);

    const resetEdges = edges.map((edge) => ({ ...edge, status: 'unvisited' }));
    setEdges(resetEdges);

    // Reset algorithm-specific data
    setVisitedNodes(new Set());
    setMinHeap([]);
    setSortedEdges([]);
    setUnionFind([]);
    setCurrentAlgorithmStep('');

    setExplanation('Graph reset. Select an algorithm and press "Start" to begin.');
  };

  // =========================
  //   PLAY / PAUSE
  // =========================
  const handlePlayPause = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    } else {
      setIsRunning(true);
      setIsPaused(false);
      if (steps.length === 0) {
        const algorithmSteps = algorithm === 'prims' ? generatePrimsSteps() : generateKruskalsSteps();
        setSteps(algorithmSteps);
      }
    }
  };

  // =========================
  //   STEP-BY-STEP
  // =========================
  const handleStep = () => {
    if (steps.length === 0) {
      const algorithmSteps = algorithm === 'prims' ? generatePrimsSteps() : generateKruskalsSteps();
      setSteps(algorithmSteps);
    }
    if (currentStep < steps.length) {
      applyStep(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  // =========================
  //   APPLY STEP
  // =========================
  const applyStep = (stepIndex) => {
    if (stepIndex >= steps.length) return;
    const step = steps[stepIndex];

    setExplanation(step.explanation);
    setCurrentAlgorithmStep(step.algorithmStep || '');

    if (step.visitedNodes) {
      setVisitedNodes(new Set(step.visitedNodes));
    }
    if (step.minHeap) {
      setMinHeap([...step.minHeap]);
    }
    if (step.sortedEdges) {
      setSortedEdges([...step.sortedEdges]);
    }
    if (step.unionFind) {
      setUnionFind({ ...step.unionFind });
    }

    const newEdges = [...edges];
    step.edgeUpdates.forEach((update) => {
      const edgeIndex = newEdges.findIndex((e) => e.id === update.id);
      if (edgeIndex !== -1) {
        newEdges[edgeIndex] = {
          ...newEdges[edgeIndex],
          status: update.status
        };
      }
    });
    setEdges(newEdges);
  };

  // =========================
  //   PRIM'S STEPS
  // =========================
  const generatePrimsSteps = () => {
    const algorithmSteps = [];
    const visited = new Set();
    const mstEdges = [];
    const primsEdges = [...edges];
    let priorityQueue = [];

    const primsSteps = [
      "1. Start with an arbitrary node (we'll use the first node)",
      "2. Add the node to the visited set",
      "3. Find all edges connecting visited nodes to unvisited nodes",
      "4. Add these edges to the priority queue (min heap)",
      "5. Extract the minimum weight edge from the priority queue",
      "6. If the edge connects to an unvisited node, add it to the MST",
      "7. Add the new node to the visited set",
      "8. Repeat until all nodes are visited or no more edges exist"
    ];

    // Start with first node
    visited.add(0);
    algorithmSteps.push({
      edgeUpdates: [],
      visitedNodes: [...visited],
      minHeap: [],
      explanation: `Starting Prim's algorithm from node ${nodes[0]?.label}. Adding it to the visited set.`,
      algorithmStep: primsSteps[1]
    });

    // Initial edges from node 0
    const initialCandidates = primsEdges.filter((edge) => edge.source === 0 || edge.target === 0);
    priorityQueue = initialCandidates
      .map((edge) => ({
        edge,
        weight: edge.weight,
        source: edge.source,
        target: edge.target
      }))
      .sort((a, b) => a.weight - b.weight);

    algorithmSteps.push({
      edgeUpdates: initialCandidates.map((edge) => ({ id: edge.id, status: 'candidate' })),
      visitedNodes: [...visited],
      minHeap: priorityQueue,
      explanation: `Adding all edges connected to starting node ${nodes[0]?.label} to the priority queue.`,
      algorithmStep: primsSteps[3]
    });

    while (visited.size < nodes.length && priorityQueue.length > 0) {
      priorityQueue.sort((a, b) => a.weight - b.weight);
      const minEdgeObj = priorityQueue.shift();
      const minEdge = minEdgeObj.edge;
      const nodeToAdd = visited.has(minEdge.source) ? minEdge.target : minEdge.source;

      if (!visited.has(nodeToAdd)) {
        mstEdges.push(minEdge);
        visited.add(nodeToAdd);

        const nodeLabel = nodes.find((n) => n.id === nodeToAdd)?.label;
        algorithmSteps.push({
          edgeUpdates: [{ id: minEdge.id, status: 'included' }],
          visitedNodes: [...visited],
          minHeap: [...priorityQueue],
          explanation: `Extracting min edge with weight ${minEdge.weight} → node ${nodeLabel}. Adding to MST.`,
          algorithmStep: primsSteps[5]
        });

        const newCandidates = primsEdges.filter((edge) => {
          if (edge.id === minEdge.id) return false;
          if (mstEdges.some((e) => e.id === edge.id)) return false;
          const sourceVisited = visited.has(edge.source);
          const targetVisited = visited.has(edge.target);
          return (sourceVisited && !targetVisited) || (!sourceVisited && targetVisited);
        });
        newCandidates.forEach((edge) => {
          if (!priorityQueue.some((item) => item.edge.id === edge.id)) {
            priorityQueue.push({
              edge,
              weight: edge.weight,
              source: edge.source,
              target: edge.target
            });
          }
        });
        priorityQueue.sort((a, b) => a.weight - b.weight);

        algorithmSteps.push({
          edgeUpdates: newCandidates.map((edge) => ({ id: edge.id, status: 'candidate' })),
          visitedNodes: [...visited],
          minHeap: [...priorityQueue],
          explanation: `Adding ${newCandidates.length} new candidate edges to the queue. Now ${priorityQueue.length} total.`,
          algorithmStep: primsSteps[3]
        });
      } else {
        algorithmSteps.push({
          edgeUpdates: [{ id: minEdge.id, status: 'excluded' }],
          visitedNodes: [...visited],
          minHeap: [...priorityQueue],
          explanation: `Skipping edge with weight ${minEdge.weight} (connects to already visited node).`,
          algorithmStep: primsSteps[5]
        });
      }
    }

    const totalWeight = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
    setMstResult({ edges: mstEdges, totalWeight });
    return algorithmSteps;
  };

  // =========================
  //   KRUSKAL'S STEPS
  // =========================
  const generateKruskalsSteps = () => {
    const algorithmSteps = [];
    const kruskalSteps = [
      "1. Sort all edges in non-decreasing order of weight",
      "2. Initialize Union-Find data structure for all nodes",
      "3. For each edge in sorted order:",
      "   a. Check if adding the edge creates a cycle using Union-Find",
      "   b. If no cycle is created, add the edge to the MST",
      "   c. Union the sets of the two endpoints",
      "4. Continue until we have V-1 edges (a complete MST)"
    ];

    const sortedEdgesList = [...edges].sort((a, b) => a.weight - b.weight);
    const parent = {};
    nodes.forEach((node) => (parent[node.id] = node.id));

    const find = (x) => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };
    const union = (x, y) => {
      parent[find(x)] = find(y);
    };

    const initialUpdate = sortedEdgesList.map((edge) => ({ id: edge.id, status: 'candidate' }));

    const getComponents = (parentObj) => {
      try {
        const comps = {};
        Object.keys(parentObj).forEach((nodeId) => {
          const root = find(nodeId);
          if (!comps[root]) comps[root] = [];
          comps[root].push(parseInt(nodeId, 10));
        });
        return Object.values(comps);
      } catch (error) {
        return nodes.map((node) => [node.id]);
      }
    };

    // Step: show sorted edges
    algorithmSteps.push({
      edgeUpdates: initialUpdate,
      sortedEdges: sortedEdgesList.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        weight: e.weight,
        status: 'candidate'
      })),
      unionFind: getComponents(parent),
      explanation: "Kruskal's: sorted edges by weight in non-decreasing order.",
      algorithmStep: kruskalSteps[0]
    });

    // Step: initialize Union-Find
    algorithmSteps.push({
      edgeUpdates: [],
      sortedEdges: sortedEdgesList.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        weight: e.weight,
        status: 'candidate'
      })),
      unionFind: getComponents(parent),
      explanation: "Initialized Union-Find. Each node in its own set.",
      algorithmStep: kruskalSteps[1]
    });

    const mstEdges = [];

    // Process edges in sorted order
    for (let i = 0; i < sortedEdgesList.length; i++) {
      const edge = sortedEdgesList[i];
      const { source, target, weight } = edge;
      const currentParent = { ...parent };

      const rootSource = find(source);
      const rootTarget = find(target);

      // Checking cycle
      algorithmSteps.push({
        edgeUpdates: [{ id: edge.id, status: 'candidate' }],
        sortedEdges: sortedEdgesList.map((e, idx) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          weight: e.weight,
          status:
            idx < i
              ? mstEdges.some((mstEdge) => mstEdge.id === e.id)
                ? 'included'
                : 'excluded'
              : idx === i
              ? 'candidate'
              : 'unvisited'
        })),
        unionFind: getComponents(currentParent),
        explanation: `Examining edge ${nodes[source]?.label}-${nodes[target]?.label} (weight ${weight}). Checking cycle...`,
        algorithmStep: kruskalSteps[3] + ' a.'
      });

      if (rootSource !== rootTarget) {
        union(source, target);
        mstEdges.push(edge);

        algorithmSteps.push({
          edgeUpdates: [{ id: edge.id, status: 'included' }],
          sortedEdges: sortedEdgesList.map((e, idx) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            weight: e.weight,
            status:
              idx <= i
                ? mstEdges.some((mstEdge) => mstEdge.id === e.id)
                  ? 'included'
                  : 'excluded'
                : 'unvisited'
          })),
          unionFind: getComponents(parent),
          explanation: `No cycle! Adding edge ${nodes[source]?.label}-${nodes[target]?.label} to MST.`,
          algorithmStep: kruskalSteps[3] + ' b. & c.'
        });
      } else {
        algorithmSteps.push({
          edgeUpdates: [{ id: edge.id, status: 'excluded' }],
          sortedEdges: sortedEdgesList.map((e, idx) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            weight: e.weight,
            status:
              idx <= i
                ? mstEdges.some((mstEdge) => mstEdge.id === e.id)
                  ? 'included'
                  : 'excluded'
                : 'unvisited'
          })),
          unionFind: getComponents(parent),
          explanation: `Cycle detected! Skipping edge ${nodes[source]?.label}-${nodes[target]?.label}.`,
          algorithmStep: kruskalSteps[3] + ' a.'
        });
      }
    }

    const totalWeight = mstEdges.reduce((sum, edge) => sum + edge.weight, 0);
    setMstResult({ edges: mstEdges, totalWeight });
    return algorithmSteps;
  };

  // =========================
  //   SHOW FINAL MST
  // =========================
  const handleShowAnswer = () => {
    if (steps.length === 0) {
      const algorithmSteps = algorithm === 'prims' ? generatePrimsSteps() : generateKruskalsSteps();
      setSteps(algorithmSteps);
    }
    // Mark MST edges as included
    const newEdges = edges.map((edge) => {
      const inMST = mstResult.edges.some((mstEdge) => mstEdge.id === edge.id);
      return { ...edge, status: inMST ? 'included' : 'excluded' };
    });
    setEdges(newEdges);
    setShowAnswer(true);
    setIsRunning(false);
    setIsPaused(false);
    setExplanation(
      `MST found via ${algorithm === 'prims' ? "Prim's" : "Kruskal's"}. Total weight: ${mstResult.totalWeight}.`
    );
  };

  // =========================
  //   HANDLE PARAM CHANGES
  // =========================
  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setGraphParams({
      ...graphParams,
      [name]: parseFloat(value)
    });
  };

  // =========================
  //   SWITCH AUTO / MANUAL
  // =========================
  const handleModeChange = (e) => {
    setMode(e.target.value);
    resetGraph();
  };

  // =========================
  //   NODE & EDGE EVENTS
  // =========================
  const handleAddNodeMode = () => {
    setIsAddingNode(!isAddingNode);
    // Turn off other modes
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setTempNode(null);
  };

  const handleAddEdgeMode = () => {
    setIsAddingEdge(!isAddingEdge);
    // Turn off other modes
    setIsAddingNode(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setTempNode(null);
  };

  const handleDeleteNodeMode = () => {
    setIsDeletingNode(!isDeletingNode);
    // Turn off other modes
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingEdge(false);
    setTempNode(null);
  };

  const handleDeleteEdgeMode = () => {
    setIsDeletingEdge(!isDeletingEdge);
    // Turn off other modes
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setTempNode(null);
  };

  // If user clicks the SVG while in "Add Node" mode
  const handleSvgClick = (e) => {
    if (!isAddingNode) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    const newId = nodes.length;
    const newNode = {
      id: newId,
      x,
      y,
      label: String.fromCharCode(65 + newId)
    };
    setNodes([...nodes, newNode]);
    setIsAddingNode(false);
  };

  // When a node is clicked
  const handleNodeClick = (nodeId) => {
    if (mode !== 'manual') return;

    // 1) Deleting Node?
    if (isDeletingNode) {
      // Remove edges connected to this node
      const filteredEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
      // Shift node IDs above it? (That can get complicated if you want labels to remain unique)
      // For simplicity, we can just mark it as "removed" or remove from array:
      const filteredNodes = nodes.filter((n) => n.id !== nodeId);
      setNodes(filteredNodes);
      setEdges(filteredEdges);
      setIsDeletingNode(false);
      return;
    }

    // 2) Adding Edge?
    if (isAddingEdge) {
      if (tempNode === null) {
        setTempNode(nodeId);
      } else {
        // We already have a first node
        if (tempNode !== nodeId) {
          const weight = prompt('Enter edge weight (1-99):', '10');
          if (weight !== null) {
            const weightNum = parseInt(weight, 10);
            if (!isNaN(weightNum) && weightNum > 0 && weightNum < 100) {
              const source = Math.min(tempNode, nodeId);
              const target = Math.max(tempNode, nodeId);
              const edgeId = `${source}-${target}`;
              if (!edges.some((e) => e.id === edgeId)) {
                setEdges([
                  ...edges,
                  {
                    id: edgeId,
                    source,
                    target,
                    weight: weightNum,
                    status: 'unvisited'
                  }
                ]);
              }
            }
          }
        }
        setTempNode(null);
        setIsAddingEdge(false);
      }
    }
  };

  // If you want edge deletion by clicking the edge line or label,
  // you'd need an onClick on each edge. For now, we'll keep it simple.
  const handleEdgeClick = (edgeId) => {
    if (!isDeletingEdge) return;
    // Remove the clicked edge
    const filtered = edges.filter((e) => e.id !== edgeId);
    setEdges(filtered);
    setIsDeletingEdge(false);
  };

  // =========================
  //   ANIMATION LOOP
  // =========================
  useEffect(() => {
    if (isRunning && !isPaused) {
      const animate = () => {
        if (currentStep < steps.length) {
          applyStep(currentStep);
          setCurrentStep((prev) => prev + 1);
          animationFrameId.current = setTimeout(animate, animationSpeed);
        } else {
          setIsRunning(false);
        }
      };
      animationFrameId.current = setTimeout(animate, animationSpeed);
    }
    return () => {
      if (animationFrameId.current) {
        clearTimeout(animationFrameId.current);
      }
    };
  }, [isRunning, isPaused, currentStep, steps, animationSpeed]);

  // =========================
  //   INIT & RESIZE
  // =========================
  useEffect(() => {
    generateRandomGraph();
    if (algorithm === 'kruskals') {
      setUnionFind([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional: re-generate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (mode === 'auto') {
        generateRandomGraph();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // =========================
  //   RENDER EDGES
  // =========================
  const renderEdges = () => {
    return edges.map((edge) => {
      const source = nodes[edge.source];
      const target = nodes[edge.target];
      if (!source || !target) return null;

      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;

      let color = '#a0aec0'; // unvisited
      let strokeWidth = 2;
      if (edge.status === 'candidate') {
        color = '#f6ad55';
        strokeWidth = 3;
      } else if (edge.status === 'included') {
        color = '#48bb78';
        strokeWidth = 4;
      } else if (edge.status === 'excluded') {
        color = '#e53e3e';
        strokeWidth = 1.5;
      }

      // For label offset
      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      const perpAngle = angle + Math.PI / 2;
      const offset = 10;
      const labelX = midX + Math.cos(perpAngle) * offset;
      const labelY = midY + Math.sin(perpAngle) * offset;

      return (
        <g key={edge.id} onClick={() => handleEdgeClick(edge.id)} className="cursor-pointer">
          <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={color} strokeWidth={strokeWidth} />
          <rect
            x={labelX - 10}
            y={labelY - 10}
            width={20}
            height={20}
            fill="white"
            stroke={color}
            strokeWidth="1"
            rx="2"
            filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.1))"
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="bold"
            fontSize="12"
          >
            {edge.weight}
          </text>
        </g>
      );
    });
  };

  // =========================
  //   RENDER NODES
  // =========================
  const renderNodes = () => {
    return nodes.map((node) => (
      <g key={node.id} onClick={() => handleNodeClick(node.id)} className="cursor-pointer">
        <circle
          cx={node.x}
          cy={node.y}
          r={24}
          fill="rgba(66, 153, 225, 0.2)"
          className={visitedNodes.has(node.id) ? 'animate-pulse' : ''}
        />
        <circle
          cx={node.x}
          cy={node.y}
          r={20}
          fill={
            visitedNodes.has(node.id)
              ? '#48bb78'
              : '#4299e1'
          }
          stroke="#2b6cb0"
          strokeWidth="2"
          filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.2))"
        />
        <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold" fontSize="14">
          {node.label}
        </text>
      </g>
    ));
  };

  // =========================
  //   UI / JSX
  // =========================
  return (
    <div className="flex flex-col min-h-screen p-4 bg-gray-50">
      {/* HEADER */}
      <div className="mb-4 bg-white shadow-md rounded-lg p-4">
        <h1 className="text-2xl font-bold mb-2 text-blue-800">MST Algorithm Visualizer</h1>
        <p className="text-gray-700">
          Learn and practice Minimum Spanning Tree algorithms: Prim's and Kruskal's.
        </p>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-6 border-t pt-3 border-gray-200">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 mr-2 rounded" />
            <span className="text-sm">Unvisited Edge</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 mr-2 rounded" />
            <span className="text-sm">Candidate Edge</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 mr-2 rounded" />
            <span className="text-sm">MST Edge</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-2 rounded" />
            <span className="text-sm">Excluded Edge</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-500 mr-2 rounded-full flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <span className="text-sm">Visited Node</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col md:flex-row flex-1 gap-4">
        {/* GRAPH AREA */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white shadow-md rounded-lg p-4 overflow-hidden relative flex-1">
            {/* Graph Header (Algorithm selection) */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-blue-800">Graph Visualization</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="prims"
                    name="algorithm"
                    value="prims"
                    checked={algorithm === 'prims'}
                    onChange={handleAlgorithmChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="prims" className="font-medium">
                    Prim's
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="kruskals"
                    name="algorithm"
                    value="kruskals"
                    checked={algorithm === 'kruskals'}
                    onChange={handleAlgorithmChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="kruskals" className="font-medium">
                    Kruskal's
                  </label>
                </div>
              </div>
            </div>

            {/* Graph & Overlays */}
            <div className="flex flex-col h-full">
              {/* SVG for Graph */}
              <div
                className="
                w-full
                h-[20rem]        /* Smaller default height on mobile */
                md:h-[35rem]     /* Keep the same (or larger) height on medium+ screens */
                mb-4
                relative
              "
              ref={svgRef}
              onClick={handleSvgClick}
            >
              <svg width="100%" height="100%" className="border border-gray-200 rounded bg-gray-50">
                {renderEdges()}
                {renderNodes()}
              </svg>

              {/* Controls under graph */}
              <div 
                  className="
                    w-full            
                    bg-white
                    p-1                 
                    m-1
                    rounded-lg
                    border
                    border-gray-200
                    flex
                    flex-col
                    gap-3
                    overflow-y-auto     
                "
                >
                <div className="flex gap-2 justify-center flex-wrap">
                  {/* Start/Pause */}
                  <button
                    onClick={handlePlayPause}
                    className={`py-2 px-3 rounded flex items-center justify-center min-w-20 ${
                      isRunning && !isPaused ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition-colors`}
                  >
                    {isRunning ? (
                      isPaused ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Resume
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Pause
                        </>
                      )
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Start
                      </>
                    )}
                  </button>

                  {/* Step */}
                  <button
                    onClick={handleStep}
                    disabled={showAnswer}
                    className="py-2 px-3 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center min-w-20 disabled:bg-blue-300"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Step
                  </button>

                  {/* Reset */}
                  <button
                    onClick={resetGraph}
                    className="py-2 px-3 rounded bg-gray-500 hover:bg-gray-600 text-white transition-colors flex items-center justify-center min-w-20"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Reset
                  </button>

                  {/* Show Answer */}
                  <button
                    onClick={handleShowAnswer}
                    className="py-2 px-3 rounded bg-purple-500 hover:bg-purple-600 text-white transition-colors flex items-center justify-center min-w-20"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Show
                  </button>
                </div>

                {/* Speed Control */}
                <div className="flex items-center justify-center gap-2 px-2 flex-wrap">
                  <span className="text-xs text-gray-600">Speed:</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={(2200 - animationSpeed) / 400}
                    onChange={handleSpeedChange}
                    className="w-24 h-2"
                  />
                  <div className="flex text-xs text-gray-600">
                    <span>Slow</span>
                    <span className="mx-1">|</span>
                    <span>Fast</span>
                  </div>
                </div>
              </div>

              {/* Explanation Panel */}
              <div className="mt-3 flex flex-col gap-3">
                <div className="bg-gray-100 p-3 rounded border border-gray-200">
                  <h3 className="font-semibold text-gray-700 mb-1">Current Step:</h3>
                  <div className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                    {currentAlgorithmStep || 'No algorithm running'}
                  </div>
                </div>
                <div
                  style={{ height: '130px', marginBottom: '30px', padding: '25px' }}
                  className="bg-blue-50 rounded-lg p-3 border border-blue-100 overflow-y-auto"
                >
                  <h3 className="font-semibold text-blue-800 mb-1">Explanation:</h3>
                  <div className="text-gray-700">{explanation}</div>
                  {showAnswer && (
                    <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                      <div className="font-semibold text-green-800">
                        MST Total Weight: {mstResult.totalWeight}
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        Edges in MST:{' '}
                        {mstResult.edges
                          .map((edge) => {
                            const sLabel = nodes[edge.source]?.label || '';
                            const tLabel = nodes[edge.target]?.label || '';
                            return `${sLabel}-${tLabel}(${edge.weight})`;
                          })
                          .join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overlays: become static on mobile, float on desktop */}
              <div className="static md:absolute top-4 right-4 w-full md:w-80 mt-4 md:mt-0">
                  {algorithm === 'prims' ? (
                    <>
                      {/* Visited Set */}
                      <div className="bg-white shadow-lg rounded-lg p-3 bg-opacity-95 border border-blue-200 mb-4 md:mb-3">
                        <h3 className="text-sm font-bold mb-1 text-blue-800">Visited (HashSet)</h3>
                        <div className="border border-gray-200 p-2 rounded bg-white min-h-12 flex flex-wrap gap-1">
                          {Array.from(visitedNodes || []).map((nodeId) => (
                            <div
                              key={nodeId}
                              className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm"
                            >
                              {nodes[nodeId]?.label}
                            </div>
                          ))}
                          {visitedNodes.size === 0 && (
                            <div className="w-full text-center text-gray-500 py-1">Empty</div>
                          )}
                        </div>
                      </div>
                      {/* Min Heap */}
                      <div className="bg-white shadow-lg rounded-lg p-3 bg-opacity-95 border border-blue-200">
                        <h3 className="text-sm font-bold mb-1 text-blue-800">MinHeap &lt;w, from, to&gt;</h3>
                        <div className="border border-gray-200 rounded bg-white overflow-hidden">
                          {minHeap && minHeap.length > 0 ? (
                            <table className="w-full border-collapse text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="p-1 text-left border-b">Weight</th>
                                  <th className="p-1 text-left border-b">From</th>
                                  <th className="p-1 text-left border-b">To</th>
                                </tr>
                              </thead>
                              <tbody>
                                {minHeap.map((item, i) => (
                                  <tr key={i} className={i === 0 ? 'bg-yellow-50' : ''}>
                                    <td className="p-1 border-b">{item.weight}</td>
                                    <td className="p-1 border-b">{nodes[item.source]?.label}</td>
                                    <td className="p-1 border-b">{nodes[item.target]?.label}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-gray-500 text-center py-3 px-2">Empty</div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Sorted Edges */}
                      <div className="bg-white shadow-lg rounded-lg p-3 bg-opacity-95 border border-blue-200 mb-4 md:mb-3">
                        <h3 className="text-sm font-bold mb-1 text-blue-800">Sorted Edges</h3>
                        <div className="border border-gray-200 rounded bg-white max-h-48 overflow-y-auto">
                          {sortedEdges && sortedEdges.length > 0 ? (
                            <table className="w-full border-collapse text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b">Edge</th>
                                  <th className="p-1 text-left border-b">Weight</th>
                                  <th className="p-1 text-left border-b">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedEdges.map((edge, i) => (
                                  <tr
                                    key={i}
                                    className={
                                      edge.status === 'included'
                                        ? 'bg-green-50'
                                        : edge.status === 'excluded'
                                        ? 'bg-red-50'
                                        : edge.status === 'candidate'
                                        ? 'bg-yellow-50'
                                        : ''
                                    }
                                  >
                                    <td className="p-1 border-b">
                                      {nodes[edge.source]?.label}-{nodes[edge.target]?.label}
                                    </td>
                                    <td className="p-1 border-b">{edge.weight}</td>
                                    <td className="p-1 border-b text-xs">
                                      {edge.status === 'included'
                                        ? 'Added'
                                        : edge.status === 'excluded'
                                        ? 'Cycle'
                                        : edge.status === 'candidate'
                                        ? 'Examining'
                                        : 'Waiting'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-gray-500 text-center py-3 px-2">No edges yet</div>
                          )}
                        </div>
                      </div>
                      {/* Union-Find */}
                      <div className="bg-white shadow-lg rounded-lg p-3 bg-opacity-95 border border-blue-200">
                        <h3 className="text-sm font-bold mb-1 text-blue-800">Union-Find Components</h3>
                        <div className="border border-gray-200 p-2 rounded bg-white">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(unionFind) && unionFind.length > 0 ? (
                              unionFind.map((component, i) => (
                                <div key={i} className="border border-blue-300 rounded p-1 bg-blue-50">
                                  {Array.isArray(component) &&
                                    component.map((nodeId) => (
                                      <span
                                        key={nodeId}
                                        className="inline-block m-0.5 w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center"
                                      >
                                        {nodes[nodeId]?.label}
                                      </span>
                                    ))}
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-center py-1 w-full">No components</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          {/* GRAPH SETTINGS */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2 text-blue-800">Graph Settings</h2>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">Mode</label>
                <div className="mt-1">
                  <select
                    value={mode}
                    onChange={handleModeChange}
                    className="w-full rounded-md border border-gray-300 p-2 bg-white"
                  >
                    <option value="auto">Auto-Generate</option>
                    <option value="manual">Manual Design</option>
                  </select>
                </div>
              </div>

              {/* If user chooses Manual Mode, show small "Graph Editor" toolbar */}
              {mode === 'manual' && (
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-3 text-sm">
                  <p className="font-medium text-yellow-800 mb-1">Manual Mode Toolbar:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleAddNodeMode}
                      className={`px-2 py-1 rounded ${
                        isAddingNode ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-800'
                      }`}
                    >
                      {isAddingNode ? 'Click on Graph...' : 'Add Node'}
                    </button>
                    <button
                      onClick={handleAddEdgeMode}
                      className={`px-2 py-1 rounded ${
                        isAddingEdge ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-800'
                      }`}
                    >
                      {isAddingEdge ? 'Select 2 Nodes...' : 'Add Edge'}
                    </button>
                    <button
                      onClick={handleDeleteNodeMode}
                      className={`px-2 py-1 rounded ${
                        isDeletingNode ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-800'
                      }`}
                    >
                      {isDeletingNode ? 'Click Node to Delete...' : 'Delete Node'}
                    </button>
                    <button
                      onClick={handleDeleteEdgeMode}
                      className={`px-2 py-1 rounded ${
                        isDeletingEdge ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-800'
                      }`}
                    >
                      {isDeletingEdge ? 'Click Edge to Delete...' : 'Delete Edge'}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'auto' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Number of Nodes</label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        name="nodeCount"
                        min="3"
                        max="10"
                        value={graphParams.nodeCount}
                        onChange={handleParamChange}
                        className="w-full mt-1"
                      />
                      <span className="ml-2 text-gray-700 font-medium w-6 text-center">
                        {graphParams.nodeCount}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Edge Density</label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        name="density"
                        min="0.3"
                        max="1"
                        step="0.1"
                        value={graphParams.density}
                        onChange={handleParamChange}
                        className="w-full mt-1"
                      />
                      <span className="ml-2 text-gray-700 font-medium w-6 text-center">
                        {graphParams.density.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Weight Range</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="minWeight"
                        min="1"
                        max="98"
                        value={graphParams.minWeight}
                        onChange={handleParamChange}
                        className="w-16 border border-gray-300 rounded p-1 text-center"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        name="maxWeight"
                        min="2"
                        max="99"
                        value={graphParams.maxWeight}
                        onChange={handleParamChange}
                        className="w-16 border border-gray-300 rounded p-1 text-center"
                      />
                    </div>
                  </div>
                  <button
                    onClick={generateRandomGraph}
                    className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                  >
                    Generate New Graph
                  </button>
                </>
              )}
            </div>

            {/* ALGORITHM REFERENCE */}
            <div className="mt-4 border-t pt-4 border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Algorithm Reference</h3>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs font-mono overflow-auto max-h-80">
                {algorithm === 'prims' ? (
                  <pre className="whitespace-pre-wrap">
{`Prim's Algorithm:
1. Start with an arbitrary node
2. Add the node to the visited set
3. Find all edges connecting visited nodes to unvisited nodes
4. Add these edges to min heap (priority queue)
5. Extract the minimum weight edge
6. If the edge connects to an unvisited node, add it to the MST
7. Add the new node to the visited set
8. Repeat until all nodes are visited or no more edges exist`}
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap">
{`Kruskal's Algorithm:
1. Sort all edges in non-decreasing order of weight
2. Initialize Union-Find data structure for all nodes
3. For each edge in sorted order:
   a. Check if adding the edge creates a cycle using Union-Find
   b. If no cycle is created, add the edge to the MST
   c. Union the sets of the two endpoints
4. Continue until we have V-1 edges (a complete MST)`}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MSTVisualizer;
