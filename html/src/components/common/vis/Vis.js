import { useCallback, useEffect, useRef, useState } from "react";
import Canvas from "./canvas/Canvas";
import { forceSimulate } from "./ForceGraph";

const Vis = ({ visData, fetchDetails, options }) => {
  const canvasContainer = useRef(null);
  const simulateRef = useRef(null);

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [palette, setPalette] = useState(new Map());
  const [edgePalette, setEdgePalette] = useState(new Map());

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (canvasContainer.current != null) {
      const resizeApp = () => {
        if (!canvasContainer.current) return;
        const parent = canvasContainer.current.parentNode;
        const { width, height } = parent.getBoundingClientRect();
        setWidth(width);
        setHeight(height);
      };
      resizeApp();
      window.addEventListener("resize", resizeApp);
      return () => {
        window.removeEventListener("resize", resizeApp);
      };
    }
  }, [setWidth, setHeight]);

  const onTick = useCallback((nodes, links) => {
    setNodes([...nodes]);
    setLinks([...links]);
  }, []);

  const simulate = useCallback(
    async (nodes, links, options, signal) => {
      setRunning(true);
      const start = new Date();
      console.log(`start simulation`);

      try {
        await new Promise((resolve, reject) => {
          const abortHandler = () => {
            reject(new Error("AbortError"));
          };
          signal.addEventListener("abort", abortHandler);
          forceSimulate(nodes, links, options, () => onTick(nodes, links))
            .then(() => {
              console.log(`end simulation. latency: ${new Date() - start}`);
              setNodes([...nodes]);
              setLinks([...links]);
              resolve();
            })
            .catch((error) => {
              reject(error);
            })
            .finally(() => {
              signal.removeEventListener("abort", abortHandler);
              setRunning(false);
            });
        });
      } catch (error) {
        if (error.message === "AbortError") {
          console.log("Simulation aborted");
        } else {
          console.error("Simulation error:", error);
        }
        setRunning(false);
      }
    },
    [onTick]
  );

  useEffect(() => {
    const nodeIndexMap = new Map();
    const nodePathIndexMap = new Map();
    const edgeIndexMap = new Map();
    const nodes = [];
    const links = [];
    for (const path of visData.pathData) {
      if (path.length > 0) {
        for (let i = 0, start = -1; i < path.length; i++) {
          const item = path[i];
          if (item.type === "node") {
            if (start === -1) {
              start = nodePathIndexMap.get(item.id) || 0;
              nodePathIndexMap.set(item.id, start);
            } else {
              start = start + 1;
              if (
                !nodePathIndexMap.has(item.id) ||
                nodePathIndexMap.get(item.id) > start
              ) {
                nodePathIndexMap.set(item.id, start);
              }
            }
          }
        }
      }
    }
    for (const node of visData.nodes) {
      if (!nodeIndexMap.has(node.id)) {
        nodeIndexMap.set(node.id, nodeIndexMap.size);
        nodes.push({
          ...node,
          index: nodeIndexMap.get(node.id),
          pathIndex: nodePathIndexMap.get(node.id),
        });
      }
    }
    for (const edge of visData.edges) {
      if (!edgeIndexMap.has(edge.id)) {
        edgeIndexMap.set(edge.id, edgeIndexMap.size);
        const source = nodeIndexMap.get(edge.outV);
        const target = nodeIndexMap.get(edge.inV);
        links.push({ ...edge, source, target });
      }
    }
    setNodes([...nodes]);
    setLinks([...links]);

    const abortController = new AbortController();
    const signal = abortController.signal;

    const runSimulation = async () => {
      if (simulateRef.current) {
        simulateRef.current.abort();
      }
      simulateRef.current = abortController;
      try {
        await simulate(
          nodes,
          links,
          { layout: options.layout, gap: options.gap },
          signal
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Simulation error:", error);
        }
      }
    };
    runSimulation();
    return () => {
      abortController.abort();
    };
  }, [visData, options.layout, options.gap, simulate]);

  const updateNode = useCallback((updatedNode) => {
    setNodes((nodes) => {
      const newNodes = [];
      for (const node of nodes) {
        if (node.id === updatedNode.id) {
          newNodes.push(updatedNode);
        } else {
          newNodes.push(node);
        }
      }
      return newNodes;
    });
    setLinks((links) => [...links]);
  }, []);

  const fetchDetailsWrapper = useCallback(async (type, id) => {
    if (type === "V" && visData.nodeData) {
      for (const data of visData.nodeData) {
        if (data.id === id) {
          return data.properties;
        }
      }
    }
    if (type === "E" && visData.edgeData) {
      for (const data of visData.edgeData) {
        if (data.id === id) {
          return data.properties;
        }
      }
    }
    if (fetchDetails) {
      return fetchDetails(type, id);
    }
    return null;
  }, [fetchDetails, visData]);

  return (
    <div
      ref={canvasContainer}
      className={"flex-auto h-full w-full" + (running ? " cursor-wait" : "")}
    >
      {canvasContainer.current && (
        <Canvas
          width={width}
          height={height}
          nodes={nodes}
          links={links}
          palette={palette}
          setPalette={setPalette}
          edgePalette={edgePalette}
          setEdgePalette={setEdgePalette}
          updateNode={updateNode}
          onViewDetails={fetchDetailsWrapper}
          options={options}
        />
      )}
    </div>
  );
};

export default Vis;
