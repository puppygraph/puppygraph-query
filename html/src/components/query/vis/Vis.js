import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { forceSimulate } from "../../common/vis/ForceGraph";
import { QueryContext } from "../context/QueryContext";
import { VisDataContext } from "../context/VisDataContext";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Canvas from "../../common/vis/canvas/Canvas";
import usePropsPrefetch from "../props/usePropsPrefetch";
import { GremlinContext } from "../../common/connection/Gremlin";
import ProgressBar from "./ProgressBar";
import HelpButton from "./Help";

const LOCAL_STORAGE_KEY = "puppyConfigs";

const Vis = ({ splitterWidth, config }) => {
  const { queryElementData } = useContext(GremlinContext);
  const { appendAndRunQuery, clearQueries } = useContext(QueryContext);
  const { setOnNewVisData, setHighlightCallback, setFocusCallback } =
    useContext(VisDataContext);

  const canvasContainer = useRef(null);
  const simulateRef = useRef(null);

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [fullScreen, setFullScreen] = useState(false);
  const [palette, setPalette] = useState(new Map());
  const [edgePalette, setEdgePalette] = useState(new Map());
  const [propsPrefetchEnabled, setPropsPrefetchEnabled] = useState(false);
  const [userConfigs, setUserConfigs] = useState(() => {
    const userConfigs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (userConfigs && userConfigs instanceof Object) {
      return userConfigs;
    }
    return {};
  });
  const saveUserConfigs = useCallback((userConfigs) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userConfigs));
    setUserConfigs(userConfigs);
  }, []);

  useEffect(() => {
    if (canvasContainer.current != null) {
      const rect = canvasContainer.current.getBoundingClientRect();
      setWidth(rect.width);
      setHeight(rect.height);
    }
  }, [splitterWidth, fullScreen]);

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [newNodes, setNewNodes] = useState([]);
  const [newLinks, setNewLinks] = useState([]);
  const [propsDataMap, setPropsDataMap] = useState(new Map());
  const [running, setRunning] = useState(false);
  const [layout, setLayout] = useState("radial");

  const onTick = useCallback((newNodes, newLinks) => {
    setNewNodes([...newNodes]);
    setNewLinks([...newLinks]);
  }, []);

  const simulate = useCallback(
    async (nodes, links, newNodes, newLinks, options, signal) => {
      if (running) {
        return;
      }
      setRunning(true);
      const start = new Date();
      console.log(`start simulation`);
      const allNodes = [...nodes, ...newNodes];
      const allLinks = [...links, ...newLinks];

      try {
        await new Promise((resolve, reject) => {
          const abortHandler = () => {
            reject(new Error("AbortError"));
          };
          signal.addEventListener("abort", abortHandler);
          forceSimulate(allNodes, allLinks, options, () =>
            onTick(newNodes, newLinks)
          )
            .then(() => {
              console.log(`end simulation. latency: ${new Date() - start}`);
              for (const node of allNodes) {
                node.fx = node.x;
                node.fy = node.y;
              }
              setNodes(allNodes);
              setLinks(allLinks);
              setNewNodes([]);
              setNewLinks([]);
              setRunning(false);
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
    [running, onTick]
  );

  const onNewVisData = useCallback(
    (visData) => {
      if (visData.propsData.length > 0) {
        const newPropsDataMap = new Map(propsDataMap);
        for (const props of visData.propsData) {
          newPropsDataMap.set(props.id, props);
        }
        setPropsDataMap(newPropsDataMap);
      }
      if (
        visData.nodes.length > 0 ||
        visData.edges.length > 0 ||
        visData.pathData.length > 0
      ) {
        const nodeIndexMap = new Map();
        const nodePathIndexMap = new Map();
        const edgeIndexMap = new Map();
        for (const node of nodes) {
          if (!nodeIndexMap.has(node.id)) {
            nodeIndexMap.set(node.id, nodeIndexMap.size);
          }
          if (node.hasOwnProperty("pathIndex")) {
            nodePathIndexMap.set(node.id, node.pathIndex);
          }
        }
        for (const node of newNodes) {
          if (!nodeIndexMap.has(node.id)) {
            nodeIndexMap.set(node.id, nodeIndexMap.size);
          }
        }
        for (const link of links) {
          if (!edgeIndexMap.has(link.id)) {
            edgeIndexMap.set(link.id, edgeIndexMap.size);
          }
        }
        for (const link of newLinks) {
          if (!edgeIndexMap.has(link.id)) {
            edgeIndexMap.set(link.id, edgeIndexMap.size);
          }
        }
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
            newNodes.push({
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
            newLinks.push({ ...edge, source, target });
          }
        }
        setNewNodes([...newNodes]);
        setNewLinks([...newLinks]);

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
              newNodes,
              newLinks,
              { layout },
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
      }
    },
    [nodes, links, newNodes, newLinks, layout, simulate, propsDataMap]
  );

  useEffect(() => {
    setOnNewVisData(() => (visData) => {
      onNewVisData(visData);
    });
  }, [setOnNewVisData, onNewVisData]);

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

  const onExpandNode = useCallback(
    (node, value) => {
      console.log(value);
      const direction = value.direction || "out";
      const edgeStep =
        direction === "both" ? "bothE" : direction === "out" ? "outE" : "inE";
      const vertexStep =
        direction === "both" ? "otherV" : direction === "out" ? "inV" : "outV";
      let query = `g.V("${node.id}")`;
      if (value.edgeLabel) {
        query += `.${edgeStep}("${value.edgeLabel}")`;
      } else {
        query += `.${edgeStep}()`;
      }
      for (const filter of (value.filters || [])) {
        query += `.has("${filter.prop}", ${filter.op}(${filter.value}))`;
      }
      query += `.${vertexStep}()`;
      query += `.path()`;
      if (value.limit) {
        query += `.limit(${value.limit})`;
      }
      appendAndRunQuery(query);
    },
    [appendAndRunQuery]
  );

  const onRemoveNode = useCallback((removeNode) => {
    setNodes(nodes => {
      const filtered = []
      for (const node of nodes) {
        if (node.id !== removeNode.id) {
          filtered.push(node);
        }
      }
      return [...filtered];
    });
    setLinks(links => {
      const filtered = []
      for (const link of links) {
        if (link.source.id !== removeNode.id && link.target.id !== removeNode.id) {
          filtered.push(link);
        }
      }
      return [...filtered];
    });
    setNewNodes(nodes => {
      const filtered = []
      for (const node of nodes) {
        if (node.id !== removeNode.id) {
          filtered.push(node);
        }
      }
      return [...filtered];
    });
    setNewLinks(links => {
      const filtered = []
      for (const link of links) {
        if (link.source.id !== removeNode.id && link.target.id !== removeNode.id) {
          filtered.push(link);
        }
      }
      return [...filtered];
    });
  }, []);

  const onPruneNodes = useCallback(() => {
    const connectedNodeIds = new Set();
    for (const link of links) {
      connectedNodeIds.add(link.source.id);
      connectedNodeIds.add(link.target.id);
    }
    for (const link of newLinks) {
      connectedNodeIds.add(link.source.id);
      connectedNodeIds.add(link.target.id);
    }
    setNodes(nodes => {
      const filtered = []
      for (const node of nodes) {
        if (connectedNodeIds.has(node.id)) {
          filtered.push(node);
        }
      }
      return [...filtered];
    });
    setNewNodes(nodes => {
      const filtered = []
      for (const node of nodes) {
        if (connectedNodeIds.has(node.id)) {
          filtered.push(node);
        }
      }
      return [...filtered];
    });
  }, [links, newLinks]);

  const onViewDetails = useCallback(
    (type, id) => {
      if (type === "V") {
        appendAndRunQuery(`g.V("${id}").elementMap()`);
      } else if (type === "E") {
        appendAndRunQuery(`g.E("${id}").elementMap()`);
      }
    },
    [appendAndRunQuery]
  );

  const doLayout = useCallback(
    (layout) => {
      setLayout(layout);
      const allNodes = [...nodes, ...newNodes];
      const allLinks = [...links, ...newLinks];
      for (const node of allNodes) {
        node.fx = undefined;
        node.fy = undefined;
      }
      setNodes([]);
      setLinks([]);
      setNewNodes(allNodes);
      setNewLinks(allLinks);
      const abortController = new AbortController();
      const signal = abortController.signal;
      const runSimulation = async () => {
        if (simulateRef.current) {
          simulateRef.current.abort();
        }
        simulateRef.current = abortController;
        try {
          await simulate([], [], allNodes, allLinks, { layout }, signal);
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
    },
    [nodes, links, newNodes, newLinks, simulate]
  );

  const onLayout = useCallback(() => {
    doLayout(layout);
  }, [doLayout, layout]);

  const clear = useCallback(() => {
    setNodes([]);
    setLinks([]);
    setPropsDataMap(new Map());
    setPalette(new Map());
    setEdgePalette(new Map());
    clearQueries();
  }, [clearQueries]);

  const {
    running: propsPrefetchInProgress,
    total,
    done,
  } = usePropsPrefetch(
    propsPrefetchEnabled,
    queryElementData,
    nodes,
    links,
    propsDataMap,
    setPropsDataMap,
    config?.prefetchPageSize || 1000
  );

  const layoutDropdown = (
    <div className="capitalize cursor-pointer group relative mt-3 inline-flex w-full items-center justify-center rounded-md bg-puppy-purple px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-puppy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:ml-3 sm:mt-0 sm:w-auto">
      {layout} Layout
      <ChevronDownIcon className="ml-2 w-5 h-5" />
      <div className="absolute top-[100%] left-0 hidden flex-col bg-white font-normal border rounded-md shadow-lg divide-y group-hover:flex">
        <button
          onClick={() => doLayout("radial")}
          className="inline-flex w-auto px-3 py-2 text-sm text-puppy-purple hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          Radial Layout
        </button>
        <button
          onClick={() => doLayout("vertical")}
          className="inline-flex w-auto px-3 py-2 text-sm text-puppy-purple hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          Vertical Layout
        </button>
        <button
          onClick={() => doLayout("force")}
          className="inline-flex w-auto px-3 py-2 text-sm text-puppy-purple hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          Force Layout
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-12 px-2 flex-none flex items-center bg-white shadow-[0_5px_5px_0_rgba(0,0,0,0.1)] z-10">
        <div className="flex-auto"></div>
        <HelpButton />
        {layoutDropdown}
        <button
          onClick={clear}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-puppy-purple px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-puppy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:ml-3 sm:mt-0 sm:w-auto"
        >
          Clear
        </button>
      </div>
      <div
        ref={canvasContainer}
        className={
          "flex-auto overflow-hidden" +
          (running ? " cursor-wait" : "") +
          (fullScreen ? " fixed top-0 bottom-0 left-0 right-0 z-50" : "")
        }
      >
        {canvasContainer.current && (
          <Canvas
            width={width}
            height={height}
            nodes={nodes}
            links={links}
            newNodes={newNodes}
            newLinks={newLinks}
            palette={palette}
            setPalette={setPalette}
            edgePalette={edgePalette}
            setEdgePalette={setEdgePalette}
            propsDataMap={propsDataMap}
            propsPrefetchEnabled={propsPrefetchEnabled}
            setPropsPrefetchEnabled={setPropsPrefetchEnabled}
            propsPrefetchInProgress={propsPrefetchInProgress}
            fullScreen={fullScreen}
            setFullScreen={setFullScreen}
            userConfigs={userConfigs}
            saveUserConfigs={saveUserConfigs}
            updateNode={updateNode}
            onExpandNode={onExpandNode}
            onRemoveNode={onRemoveNode}
            onPruneNodes={onPruneNodes}
            onViewDetails={onViewDetails}
            onLayout={onLayout}
            setFocusCallback={setFocusCallback}
            setHighlightCallback={setHighlightCallback}
            options={{
              watermarkText: config?.watermarkText,
            }}
          />
        )}
      </div>
      <ProgressBar enabled={propsPrefetchEnabled} total={total} done={done} />
    </div>
  );
};

export default Vis;
