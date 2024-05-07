import { Stage, Graphics, Container } from "@pixi/react";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import "@pixi/events";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import colors from "material-colors";
import { Rectangle, settings } from "pixi.js";
import ContextMenu from "./ContextMenu";
import Legend from "./Legend";
import Watermark from "./Watermark";
import { DetailsList, DetailsPanel } from "./DetailsPanel";
import { useLabels, LABEL_SCALE_LIMIT } from "./Labels";
import SearchBar from "./SearchBar";
import { saveAs } from "file-saver";

const Canvas = ({
  height,
  width,
  nodes,
  links,
  newNodes = [],
  newLinks = [],
  propsDataMap,
  palette,
  setPalette,
  edgePalette,
  setEdgePalette,
  propsPrefetchEnabled,
  setPropsPrefetchEnabled,
  propsPrefetchInProgress,
  fullScreen,
  setFullScreen,
  userConfigs,
  saveUserConfigs,
  updateNode,
  onExpandNode,
  onRemoveNode,
  onPruneNodes,
  onViewDetails,
  onLayout,
  setFocusCallback,
  setHighlightCallback,
  options,
}) => {
  settings.RESOLUTION = window.devicePixelRatio;
  settings.RENDER_OPTIONS.resolution = window.devicePixelRatio;

  const containerRef = useRef(null);

  const [app, setApp] = useState(null);
  const [scale, setScale] = useState(1);
  const [scaleToFit, setScaleToFit] = useState(options.scaleToFit);
  const [pivot, setPivot] = useState({ x: -width / 2, y: -height / 2 });
  const [movement, setMovement] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dragNode, setDragNode] = useState(null);
  const [nodeDragging, setNodeDragging] = useState(false);
  const [isNodeDraggingConfirmed, setIsNodeDraggingConfirmed] = useState(false);
  const [nodeDragStartPos, setNodeDragStartPos] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(options?.showGrid || false);
  const [menuPosition, setMenuPosition] = useState(null);
  const [menuContext, setMenuContext] = useState(null);
  const [showMenu, setShowMenu] = useState("");
  const [showLabels, setShowLabels] = useState(options.showLabels);
  const [labelFormat, setLabelFormat] = useState(new Map());

  const [focusNode, setFocusNode] = useState(null);
  const [clickNode, setClickNode] = useState(null);
  const [focusLink, setFocusLink] = useState(null);
  const [clickLink, setClickLink] = useState(null);
  const [clickLinkPos, setClickLinkPos] = useState({ x: 0, y: 0 });
  const [detailsContent, setDetailsContent] = useState(null);
  const [detailsPosition, setDetailsPosition] = useState({ x: 0, y: 0 });
  const [searchMatchIds, setSearchMatchIds] = useState([]);

  const centerNode = useCallback(
    (node) => {
      setScaleToFit(false);
      setMovement({ x: node.x * scale, y: node.y * scale });
    },
    [scale]
  );

  useEffect(() => {
    const filterNotFound = (n) => {
      if (!n) {
        return null;
      }
      let found = false;
      for (const node of nodes) {
        if (node === n) {
          found = true;
          break;
        }
      }
      if (!found) {
        for (const node of newNodes) {
          if (node === n) {
            found = true;
            break;
          }
        }
      }
      if (found) {
        return n;
      } else {
        return null;
      }
    }
    setClickNode((node) => {
      return filterNotFound(node);
    });
    setFocusNode((focus) => {
      return filterNotFound(focus);
    });
  }, [nodes, newNodes]);

  useEffect(() => {
    const filterNotFound = (l) => {
      if (!l) {
        return null;
      }
      let found = false;
      for (const link of links) {
        if (link === l) {
          found = true;
          break;
        }
      }
      if (!found) {
        for (const link of newLinks) {
          if (link === l) {
            found = true;
            break;
          }
        }
      }
      if (found) {
        return l;
      } else {
        return null;
      }
    }
    setClickLink((link) => {
      return filterNotFound(link);
    });
    setFocusLink((link) => {
      return filterNotFound(link);
    });
  }, [links, newLinks]);

  useEffect(() => {
    if (scaleToFit) {
      if (nodes.length > 0) {
        let minX = nodes[0].x,
          maxX = nodes[0].x,
          minY = nodes[0].y,
          maxY = nodes[0].y;
        for (const node of nodes) {
          if (minX > node.x) {
            minX = node.x;
          }
          if (maxX < node.x) {
            maxX = node.x;
          }
          if (minY > node.y) {
            minY = node.y;
          }
          if (maxY < node.y) {
            maxY = node.y;
          }
        }
        minX -= 20;
        maxX += 80;
        minY -= 50;
        maxY += 20;
        let scale = 2;
        const contentW = maxX - minX;
        if (contentW * scale > width) {
          scale = width / contentW;
        }
        const contentH = maxY - minY;
        if (contentH * scale > height) {
          scale = height / contentH;
        }
        if (scale < 0.1) {
          scale = 0.1;
        }
        setScale(scale);
        setMovement({
          x: ((minX + maxX) * scale) / 2,
          y: ((minY + maxY) * scale) / 2,
        });
      }
    }
  }, [nodes, scale, width, height, scaleToFit]);
  useEffect(() => {
    setPivot({
      x: (-width / 2 + movement.x - drag.x) / scale,
      y: (-height / 2 + movement.y - drag.y) / scale,
    });
  }, [width, height, movement, drag, scale]);

  useEffect(() => {
    setHighlightCallback &&
      setHighlightCallback(() => (data) => {
        for (const node of nodes) {
          if (data.nodes.includes(node.id)) {
            setFocusNode(node);
            setClickNode(null);
            return;
          }
        }
      });
  }, [setHighlightCallback, nodes, centerNode]);
  useEffect(() => {
    setFocusCallback &&
      setFocusCallback(() => (id) => {
        for (const node of nodes) {
          if (node.id === id) {
            centerNode(node);
            return;
          }
        }
      });
  }, [setFocusCallback, nodes, centerNode]);

  const handleWheel = useCallback(
    (e) => {
      setScaleToFit(false);
      const delta = e.deltaY;
      const { clientX, clientY } = e;
      const stageRect = e.target.getBoundingClientRect();
      const mouseX = clientX - stageRect.left - width / 2;
      const mouseY = clientY - stageRect.top - height / 2;

      setScale((prevScale) => {
        let newScale = prevScale;
        if (delta > 0) {
          newScale -= 0.025;
        } else {
          newScale += 0.025;
        }
        newScale = Math.max(0.1, Math.min(3, newScale));

        const scaleFactor = newScale / prevScale;
        const newMovementX =
          movement.x + (mouseX + movement.x) * (scaleFactor - 1);
        const newMovementY =
          movement.y + (mouseY + movement.y) * (scaleFactor - 1);

        setMovement({
          x: newMovementX,
          y: newMovementY,
        });

        return newScale;
      });
    },
    [movement, width, height]
  );

  const onDragStart = useCallback(
    (event) => {
      setScaleToFit(false);
      setShowMenu("");
      setClickNode(null);
      setFocusNode(null);
      setDetailsContent(null);
      setFocusLink(null);
      if (detailsContent && detailsContent.id === focusLink?.id) {
        setClickLink(null);
      } else {
        setClickLink(focusLink);
      }
      setDragging(true);
      setStartPos({ x: event.client.x, y: event.client.y });
      setDrag({ x: 0, y: 0 });
    },
    [focusLink, detailsContent]
  );
  const onDragEnd = useCallback(
    (event) => {
      setDragging(false);
      setMovement({
        x: movement.x - drag.x,
        y: movement.y - drag.y,
      });
      setDrag({ x: 0, y: 0 });
    },
    [drag.x, drag.y, movement.x, movement.y]
  );
  const handleNodeDragging = useCallback(
    (event) => {
      let isDragging = false;
      if (nodeDragging) {
        const dx = nodeDragStartPos.x - event.client.x;
        const dy = nodeDragStartPos.y - event.client.y;
        const dragDistSqr = dx * dx + dy * dy;
        isDragging = dragDistSqr >= 25;
        if (isDragging) {
          setIsNodeDraggingConfirmed(true);
          dragNode.x = (event.global.x - width / 2 + movement.x) / scale;
          dragNode.y = (event.global.y - height / 2 + movement.y) / scale;
          dragNode.fx = dragNode.x;
          dragNode.fy = dragNode.y;
          setFocusNode({ ...dragNode });
          setClickNode(null);
          updateNode(dragNode);
        }
      }
      return isDragging;
    },
    [
      dragNode,
      height,
      width,
      movement,
      nodeDragStartPos,
      nodeDragging,
      scale,
      updateNode,
    ]
  );
  const findFocusLink = useCallback(
    (event) => {
      const node = clickNode || focusNode;
      if (!node) {
        return;
      }
      const pos = {
        x: event.global.x / scale + pivot.x,
        y: event.global.y / scale + pivot.y,
      };
      const u = Math.atan2(pos.y - node.y, pos.x - node.x);
      let ww = Math.PI;
      let focus = null;
      for (const link of links) {
        let otherNode = null;
        if (edgePalette.get(link.label)[0]) {
          continue;
        }
        if (link.target.id === node.id) {
          if (link.curve) {
            otherNode = { x: link.curve.c2x, y: link.curve.c2y };
          } else {
            otherNode = link.source;
          }
        } else if (link.source.id === node.id) {
          if (link.curve) {
            otherNode = { x: link.curve.c1x, y: link.curve.c1y };
          } else {
            otherNode = link.target;
          }
        } else {
          continue;
        }
        const v = Math.atan2(otherNode.y - node.y, otherNode.x - node.x);
        let w = u - v;
        while (w > Math.PI * 2) w -= Math.PI;
        while (w < -Math.PI * 2) w += Math.PI;
        w = Math.abs(w);
        if (w < Math.PI / 45 && w < ww) {
          ww = w;
          focus = link;
        }
      }
      setFocusLink(focus);
      setClickLinkPos(event.global);
    },
    [scale, pivot.x, pivot.y, clickNode, focusNode, links, edgePalette]
  );
  const onDragMove = useCallback(
    (event) => {
      if (dragging) {
        setDrag({
          x: event.client.x - startPos.x,
          y: event.client.y - startPos.y,
        });
        return;
      }
      const nodeDragging = handleNodeDragging(event);
      if (!nodeDragging) {
        findFocusLink(event);
      }
    },
    [dragging, startPos.x, startPos.y, handleNodeDragging, findFocusLink]
  );

  const drawBackground = useCallback(
    (g) => {
      g.beginFill(colors.grey[50]);
      g.drawRect(0, 0, width, height);
      g.endFill();
    },
    [width, height]
  );
  const drawGrid = useCallback(
    (g) => {
      const grid = 100 * scale;
      g.clear();
      for (
        let x = (-movement.x + drag.x + width / 2) % grid;
        x < width;
        x += grid
      ) {
        g.lineStyle(1, colors.blue[100], 1);
        g.moveTo(x, 0);
        g.lineTo(x, height);
      }
      for (
        let y = (-movement.y + drag.y + height / 2) % grid;
        y < height;
        y += grid
      ) {
        g.lineStyle(1, colors.blue[100], 1);
        g.moveTo(0, y);
        g.lineTo(width, y);
      }
    },
    [width, height, scale, movement, drag]
  );
  const isOnScreen = useCallback(
    (node, r) => {
      const pos = {
        x: (node.x - pivot.x) * scale,
        y: (node.y - pivot.y) * scale,
      };
      return (
        pos.x >= -r * scale &&
        pos.x <= width + r * scale &&
        pos.y >= -r * scale &&
        pos.y <= height + r * scale
      );
    },
    [pivot, scale, height, width]
  );
  const isEdgeOnScreen = useCallback(
    (source, target) => {
      const isPointOnScreen = (point) => {
        const { x, y } = point;
        return x >= 0 && x <= width && y >= 0 && y <= height;
      };
      const doLinesIntersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
        const dx1 = x2 - x1;
        const dy1 = y2 - y1;
        const dx2 = x4 - x3;
        const dy2 = y4 - y3;
        const determinant = dx1 * dy2 - dy1 * dx2;

        if (determinant === 0) {
          return false; // Parallel lines
        }

        const t = ((x3 - x1) * dy2 - (y3 - y1) * dx2) / determinant;
        const u = ((x3 - x1) * dy1 - (y3 - y1) * dx1) / determinant;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
      };
      const isOnScreen = (edge) => {
        const { source, target } = edge;
        const { x: x1, y: y1 } = source;
        const { x: x2, y: y2 } = target;
        if (isPointOnScreen(source) || isPointOnScreen(target)) {
          return true;
        }
        const edges = [
          { x1: 0, y1: 0, x2: width, y2: 0 },
          { x1: width, y1: 0, x2: width, y2: height },
          { x1: 0, y1: height, x2: width, y2: height },
          { x1: 0, y1: 0, x2: 0, y2: height },
        ];
        for (const screenEdge of edges) {
          if (
            doLinesIntersect(
              x1,
              y1,
              x2,
              y2,
              screenEdge.x1,
              screenEdge.y1,
              screenEdge.x2,
              screenEdge.y2
            )
          ) {
            return true;
          }
        }
        return false;
      };
      const sPos = {
        x: (source.x - pivot.x) * scale,
        y: (source.y - pivot.y) * scale,
      };
      const tPos = {
        x: (target.x - pivot.x) * scale,
        y: (target.y - pivot.y) * scale,
      };
      if (sPos.x < 0 && tPos.x < 0) return false;
      if (sPos.x > width && tPos.x > width) return false;
      if (sPos.y < 0 && tPos.y < 0) return false;
      if (sPos.y > height && tPos.y > height) return false;
      return isOnScreen({ source: sPos, target: tPos });
    },
    [pivot, scale, height, width]
  );
  const drawNodes = useCallback(
    (g, nodes, highlight) => {
      const pickColor = (label) => {
        if (palette.has(label)) {
          return palette.get(label);
        }
        const choice = [...Object.keys(colors)];
        choice.length = 18;
        let index = (palette.size * 5) % choice.length;
        if (
          userConfigs &&
          userConfigs[`colorIndex.label.${label}`] !== undefined
        ) {
          index = userConfigs[`colorIndex.label.${label}`] % choice.length;
        }
        const c = colors[choice[index]];
        palette.set(label, c);
        setPalette(new Map(palette));
        return c;
      };
      for (const node of nodes) {
        if (!isOnScreen(node, 15)) {
          continue;
        }
        let c = pickColor(node.label);
        if (c[0]) {
          continue;
        }
        if (c[500]) {
          c = c[500];
        }
        if (highlight === "search") {
          g.lineStyle(2 + 3 / scale, colors.blue[800], 1);
          g.beginFill(c);
          g.drawCircle(node.x, node.y, 12 + 4 / scale);
          g.endFill();
        } else if (highlight) {
          g.lineStyle(2 + 3 / scale, colors.white, 1);
          g.beginFill(c);
          g.drawCircle(node.x, node.y, 12 + 4 / scale);
          g.endFill();
        } else {
          g.lineStyle(scale < 0.5 ? 0 : 2, colors.white, 1);
          g.beginFill(c);
          g.drawCircle(node.x, node.y, 10 + 1 / scale);
          g.endFill();
        }
      }
    },
    [palette, setPalette, userConfigs, isOnScreen, scale]
  );
  const drawExistingNodes = useCallback(
    (g) => {
      g.clear();
      drawNodes(g, nodes, false);
    },
    [drawNodes, nodes]
  );
  const drawExistingHighlightNodes = useCallback(
    (g) => {
      g.clear();
      const searchNodes = [];
      const searchIds = new Set();
      for (const id of searchMatchIds) {
        searchIds.add(id);
      }
      for (const node of nodes) {
        if (searchIds.has(node.id)) {
          searchNodes.push(node);
        }
      }
      drawNodes(g, searchNodes, "search");
      const highlightNodes = [];
      focusNode && highlightNodes.push(focusNode);
      clickNode && highlightNodes.push(clickNode);
      highlightNodes && drawNodes(g, highlightNodes, "highlight");
    },
    [drawNodes, focusNode, clickNode, nodes, searchMatchIds]
  );
  const drawNewNodes = useCallback(
    (g) => {
      g.clear();
      drawNodes(g, newNodes, false);
    },
    [drawNodes, newNodes]
  );

  const drawLink = useCallback(
    (g, link, color, highlight) => {
      const drawArrow = (p, angle) => {
        const arrowSize = 6;
        const arrowPoint1X = p.x - Math.cos(angle + Math.PI / 10) * arrowSize;
        const arrowPoint1Y = p.y - Math.sin(angle + Math.PI / 10) * arrowSize;
        const arrowPoint2X = p.x - Math.cos(angle - Math.PI / 10) * arrowSize;
        const arrowPoint2Y = p.y - Math.sin(angle - Math.PI / 10) * arrowSize;
        g.beginFill(color);
        g.drawPolygon([
          p.x,
          p.y,
          arrowPoint1X,
          arrowPoint1Y,
          arrowPoint2X,
          arrowPoint2Y,
        ]);
        g.endFill();
      };
      g.lineStyle(
        highlight ? 1 + 1 / scale : 1,
        color || colors.grey[400],
        highlight ? 1 : 0.5
      );
      if (link.source.x === link.target.x && link.source.y === link.target.y) {
        const loopRadius = 50;
        const node = link.source;
        const startPoint = { x: node.x, y: node.y };
        const controlPoint1 = {
          x: node.x + loopRadius,
          y: node.y - loopRadius,
        };
        const controlPoint2 = {
          x: node.x - loopRadius,
          y: node.y - loopRadius,
        };
        const endPoint = { x: node.x, y: node.y };
        g.moveTo(startPoint.x, startPoint.y);
        g.bezierCurveTo(
          controlPoint1.x,
          controlPoint1.y,
          controlPoint2.x,
          controlPoint2.y,
          endPoint.x,
          endPoint.y
        );
      } else if (link.groupCount === 1) {
        const { source, target } = link;
        g.moveTo(source.x, source.y);
        g.lineTo(target.x, target.y);

        const mx = (source.x + target.x) / 2;
        const my = (source.y + target.y) / 2;
        const arrowAngle = Math.atan2(target.y - source.y, target.x - source.x);
        drawArrow({ x: mx, y: my }, arrowAngle);
      } else {
        const { source, target, curve } = link;
        const { c1x, c1y, c2x, c2y, mx, my } = curve;
        g.moveTo(source.x, source.y);
        g.quadraticCurveTo(c1x, c1y, mx, my);
        g.quadraticCurveTo(c2x, c2y, target.x, target.y);

        const arrowAngle = Math.atan2(target.y - source.y, target.x - source.x);
        drawArrow({ x: mx, y: my }, arrowAngle);
      }
    },
    [scale]
  );
  const preprocessLinks = useCallback((links) => {
    const map = new Map();
    const getKey = (link) => {
      let { x: x1, y: y1 } = link.source;
      let { x: x2, y: y2 } = link.target;
      if (x1 > x2 || (x1 === x2 && y1 > y2)) {
        let t;
        t = x1;
        x1 = x2;
        x2 = t;
        t = y1;
        y1 = y2;
        y2 = t;
      }
      return JSON.stringify({ x1, y1, x2, y2 });
    };
    for (const link of links) {
      const key = getKey(link);
      link.groupIndex = map.get(key) || 0;
      map.set(key, link.groupIndex + 1);
    }
    for (const link of links) {
      const key = getKey(link);
      link.groupCount = map.get(key);
    }
    for (const link of links) {
      const { source, target, groupIndex, groupCount } = link;
      if (source.x === target.x && source.y === target.y) {
        continue;
      }
      const diffD = 20;
      let diffIndex =
        groupIndex % 2 === 0
          ? groupIndex + ((groupCount + 1) % 2)
          : -groupIndex - 1 + ((groupCount + 1) % 2);
      if (
        source.x > target.x ||
        (source.x === target.x && source.y > target.y)
      ) {
        diffIndex = -diffIndex;
      }
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const ddx = dx / distance;
      const ddy = dy / distance;
      const vx = -ddy * diffIndex * diffD;
      const vy = ddx * diffIndex * diffD;
      const mx = (source.x + target.x) / 2 + vx;
      const my = (source.y + target.y) / 2 + vy;
      const c1x = mx - (ddx * distance) / 4;
      const c1y = my - (ddy * distance) / 4;
      const c2x = mx + (ddx * distance) / 4;
      const c2y = my + (ddy * distance) / 4;
      link.curve = { c1x, c1y, c2x, c2y, mx, my };
    }
  }, []);
  const drawEdges = useCallback(
    (g) => {
      const pickColor = (label) => {
        if (edgePalette.has(label)) {
          return edgePalette.get(label);
        }
        const choice = [...Object.keys(colors)];
        choice.length = 18;
        let index = (edgePalette.size * 5 + 4) % choice.length;
        if (
          userConfigs &&
          userConfigs[`colorIndex.label.${label}`] !== undefined
        ) {
          index = userConfigs[`colorIndex.label.${label}`] % choice.length;
        }
        const c = colors[choice[index]];
        edgePalette.set(label, c);
        setEdgePalette(new Map(edgePalette));
        return c;
      };
      g.clear();
      let count = 0;
      const filteredLinks = [];
      for (const link of links) {
        if (!isEdgeOnScreen(link.source, link.target)) {
          continue;
        }
        if (++count > 3000) {
          break;
        }
        filteredLinks.push(link);
      }
      preprocessLinks(filteredLinks);
      for (const link of filteredLinks) {
        let c = pickColor(link.label);
        if (c[0]) {
          continue;
        }
        if (c[300]) {
          c = c[300];
        }
        drawLink(g, link, c, false);
      }
    },
    [
      links,
      isEdgeOnScreen,
      drawLink,
      edgePalette,
      setEdgePalette,
      preprocessLinks,
      userConfigs,
    ]
  );
  const drawHighlightEdges = useCallback(
    (g) => {
      const pickColor = (label) => {
        if (edgePalette.has(label)) {
          return edgePalette.get(label);
        }
        const choice = [...Object.keys(colors)];
        choice.length = 18;
        let index = (edgePalette.size * 5 + 4) % choice.length;
        if (
          userConfigs &&
          userConfigs[`colorIndex.label.${label}`] !== undefined
        ) {
          index = userConfigs[`colorIndex.label.${label}`] % choice.length;
        }
        const c = colors[choice[index]];
        edgePalette.set(label, c);
        setEdgePalette(new Map(edgePalette));
        return c;
      };
      g.clear();
      const searchIds = new Set();
      for (const id of searchMatchIds) {
        searchIds.add(id);
      }
      preprocessLinks(links);
      for (const link of links) {
        let highlight = false;
        if (searchIds.has(link.id)) {
          drawLink(g, link, colors.blue[800], true);
        }
        if (
          focusNode?.id === link.source.id ||
          focusNode?.id === link.target.id ||
          clickNode?.id === link.source.id ||
          clickNode?.id === link.target.id
        ) {
          highlight = true;
        }
        if (highlight) {
          let c = pickColor(link.label);
          if (c[0]) {
            continue;
          }
          if (c[500]) {
            c = c[500];
          }
          drawLink(g, link, c, true);
        }
      }
      if (focusLink) {
        const link = focusLink;
        drawLink(g, link, colors.blue[600], true);
      }
      if (clickLink) {
        const link = clickLink;
        drawLink(g, link, colors.red[800], true);
      }
    },
    [
      links,
      focusNode,
      focusLink,
      clickNode,
      clickLink,
      drawLink,
      edgePalette,
      setEdgePalette,
      searchMatchIds,
      preprocessLinks,
      userConfigs,
    ]
  );

  const dropShadowFilter = useMemo(
    () =>
      new DropShadowFilter({
        offset: { x: 0, y: 0 },
        alpha: 0.2,
        distance: 2,
        blur: 1,
        resolution: window.devicePixelRatio,
      }),
    []
  );

  const locateNearestNode = useCallback(
    (global) => {
      const pos = {
        x: global.x / scale + pivot.x,
        y: global.y / scale + pivot.y,
      };
      let nearest = nodes[0];
      let minD =
        (nearest.x - pos.x) * (nearest.x - pos.x) +
        (nearest.y - pos.y) * (nearest.y - pos.y);
      for (const node of nodes) {
        const d =
          (node.x - pos.x) * (node.x - pos.x) +
          (node.y - pos.y) * (node.y - pos.y);
        if (d < minD) {
          minD = d;
          nearest = node;
        }
      }
      return nearest;
    },
    [nodes, scale, pivot]
  );
  const onNodeMouseMove = useCallback(
    (event) => {
      if (showMenu !== "") {
        return;
      }
      if (
        event.global.x < 0 ||
        event.global.x > width ||
        event.global.y < 0 ||
        event.global.y > height
      ) {
        return;
      }
      let isDragging = handleNodeDragging(event);
      if (!isDragging) {
        const hoverNode = locateNearestNode(event.global);
        if (hoverNode.id !== clickNode?.id) {
          setFocusNode(hoverNode);
        }
        if (hoverNode) {
          setFocusLink(null);
        }
      }
    },
    [locateNearestNode, width, height, showMenu, handleNodeDragging, clickNode]
  );

  const onNodeDragStart = useCallback(
    (event) => {
      setShowMenu("");
      setNodeDragging(true);
      setIsNodeDraggingConfirmed(false);
      setNodeDragStartPos({ x: event.client.x, y: event.client.y });
      const dragNode = locateNearestNode(event.global);
      setDragNode(dragNode);
    },
    [locateNearestNode]
  );
  const onNodeDragEnd = useCallback((event) => {
    setNodeDragging(false);
    setIsNodeDraggingConfirmed(false);
  }, []);

  const onHoverLabel = useCallback(
    (node, link) => {
      if (node) {
        if (node.id !== clickNode?.id) {
          setFocusNode(node);
        }
      }
      if (link) {
        if (link.id !== clickLink?.id) {
          setFocusLink(link);
        }
      }
    },
    [clickNode, clickLink]
  );
  const onClickLabel = useCallback((node, link, pos) => {
    setFocusNode(null);
    setFocusLink(null);
    setDetailsContent(null);
    setClickNode(node || null);
    setClickLink(link || null);
    if (link) {
      setClickLinkPos(pos);
    }
  }, []);

  const onNodeClick = useCallback(
    (event) => {
      if (showMenu !== "") {
        return;
      }
      if (
        event.global.x < 0 ||
        event.global.x > width ||
        event.global.y < 0 ||
        event.global.y > height
      ) {
        return;
      }
      if (isNodeDraggingConfirmed) {
        return;
      }
      setClickNode(focusNode);
      setFocusNode(null);
      setDetailsContent(null);
      setFocusLink(null);
      setClickLink(null);
    },
    [width, height, isNodeDraggingConfirmed, showMenu, focusNode]
  );
  const onNodePointerDown = useCallback(
    (event) => {
      if (event.data.button === 2) {
        if (showMenu !== "") {
          return;
        }
        if (
          event.global.x < 0 ||
          event.global.x > width ||
          event.global.y < 0 ||
          event.global.y > height
        ) {
          return;
        }
        if (isNodeDraggingConfirmed) {
          return;
        }
        const node = focusNode || clickNode;
        if (node) {
          setShowMenu("node");
          setMenuPosition({ x: event.global.x, y: event.global.y });
          setMenuContext({ node: node });
        }
      }
    },
    [focusNode, clickNode, height, width, isNodeDraggingConfirmed, showMenu]
  );
  const onNodeMenuItemClick = useCallback(
    (item) => {
      if (item.name === "focus") {
        centerNode(menuContext.node);
      } else if (item.name === "view") {
        setFocusNode(null);
        setClickNode(menuContext.node);
      } else if (item.name === "expand") {
        if (onExpandNode) {
          if (userConfigs) {
            userConfigs[`expandPreset.label.${menuContext.node?.label}`] =
              item.value;
            saveUserConfigs && saveUserConfigs({ ...userConfigs });
          }
          onExpandNode(menuContext.node, item.value);
        }
      } else if (item.name === "expandall") {
        onExpandNode && onExpandNode(menuContext.node, { direction: "both" });
      } else if (item.name === "remove") {
        if (onRemoveNode) {
          onRemoveNode(menuContext.node);
          setFocusNode(null);
          setClickNode(null);
          setFocusLink(null);
          setClickLink(null);
          setMenuContext(null);
        }
      }
    },
    [
      menuContext,
      centerNode,
      onExpandNode,
      onRemoveNode,
      userConfigs,
      saveUserConfigs,
    ]
  );
  const closeMenu = useCallback(() => {
    setShowMenu("");
    setMenuPosition(null);
    setMenuContext(null);
  }, []);

  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("contextmenu", handleContextMenu);
    }
    return () => {
      if (container) {
        container.removeEventListener("contextmenu", handleContextMenu);
      }
    };
  }, [containerRef]);
  const onCanvasPointerDown = useCallback(
    (event) => {
      if (event.data.button === 2) {
        if (showMenu !== "") {
          return;
        }
        if (
          event.global.x < 0 ||
          event.global.x > width ||
          event.global.y < 0 ||
          event.global.y > height
        ) {
          return;
        }
        setMenuPosition({ x: event.global.x, y: event.global.y });
        setShowMenu("canvas");
      }
    },
    [height, width, showMenu]
  );
  const onCanvasMenuItemClick = useCallback(
    async (item) => {
      if (item.name === "view") {
        if (options.scaleToFit || scaleToFit) {
          setScaleToFit(true);
        } else {
          setMovement({ x: 0, y: 0 });
          setScale(1);
        }
      } else if (item.name === "scaletofit") {
        setScaleToFit(true);
      } else if (item.name === "fullscreen") {
        setFullScreen((fullScreen) => !fullScreen);
      } else if (item.name === "prefetch") {
        setPropsPrefetchEnabled(
          (propsPrefetchEnabled) => !propsPrefetchEnabled
        );
      } else if (item.name === "grid") {
        setShowGrid((grid) => !grid);
      } else if (item.name === "labels") {
        setShowLabels((showLabels) => {
          const labelShown = showLabels && scale >= LABEL_SCALE_LIMIT;
          const newToggle = !labelShown;
          if (newToggle && scale < LABEL_SCALE_LIMIT) {
            setScale(LABEL_SCALE_LIMIT);
            setScaleToFit(false);
          }
          return newToggle;
        });
      } else if (item.name === "layout") {
        setFocusNode(null);
        setClickNode(null);
        setFocusLink(null);
        setClickLink(null);
        onLayout && onLayout();
      } else if (item.name === "prunenodes") {
        onPruneNodes && onPruneNodes();
      } else if (item.name === "exportpng") {
        if (app) {
          const a = await app.renderer.plugins.extract.canvas(
            app.stage,
            new Rectangle(0, 0, width, height)
          );
          a.toBlob((blob) => {
            saveAs(blob, "canvas.png");
          });
        }
      }
    },
    [
      onLayout,
      options.scaleToFit,
      scaleToFit,
      scale,
      setPropsPrefetchEnabled,
      setFullScreen,
      app,
      width,
      height,
      onPruneNodes,
    ]
  );

  const onSearch = useCallback(
    (matchIds) => {
      setSearchMatchIds(matchIds);
      if (matchIds.length === 1) {
        for (const node of nodes) {
          if (node.id === matchIds[0]) {
            setFocusNode(node);
            setClickNode(null);
            centerNode(node);
            break;
          }
        }
      }
    },
    [nodes, centerNode]
  );

  useEffect(() => {
    if (clickLink) {
      const link = clickLink;
      if (link.id.startsWith("_path_")) {
        return;
      }
      const pos = clickLinkPos;
      if (pos.x < 0 || pos.y < 0 || pos.x > width || pos.y > height) {
        setDetailsContent(null);
        return;
      }
      if (
        detailsContent &&
        detailsContent.content &&
        detailsContent.id === link.id
      ) {
        return;
      }
      setDetailsPosition({ x: pos.x + 10, y: pos.y + 10 });
      if (propsDataMap?.has(link.id)) {
        setDetailsContent({
          id: link.id,
          content: propsDataMap.get(link.id).properties,
        });
        return;
      }
      if (detailsContent && detailsContent.id === link.id) {
        return;
      }
      setDetailsContent(null);
      const fetch = async () => {
        setDetailsContent({ id: link.id, content: null });
        const details = await onViewDetails("E", link.id);
        setDetailsContent({ id: link.id, content: details });
      };
      onViewDetails && fetch();
    } else if (clickNode) {
      const node = clickNode;
      const pos = {
        x: (node.x - pivot.x) * scale,
        y: (node.y - pivot.y) * scale,
      };
      if (pos.x < 0 || pos.y < 0 || pos.x > width || pos.y > height) {
        setDetailsContent(null);
        return;
      }
      if (
        detailsContent &&
        detailsContent.content &&
        detailsContent.id === node.id
      ) {
        return;
      }
      setDetailsPosition({ x: pos.x + 10, y: pos.y + 10 });
      if (propsDataMap?.has(node.id)) {
        setDetailsContent({
          id: node.id,
          content: propsDataMap.get(node.id).properties,
        });
        return;
      }
      if (detailsContent && detailsContent.id === node.id) {
        return;
      }
      setDetailsContent(null);
      const fetch = async () => {
        setDetailsContent({ id: node.id, content: null });
        const details = await onViewDetails("V", node.id);
        setDetailsContent({ id: node.id, content: details });
      };
      onViewDetails && fetch();
    }
  }, [
    width,
    height,
    detailsContent,
    pivot,
    scale,
    clickNode,
    clickLink,
    clickLinkPos,
    onViewDetails,
    propsDataMap,
  ]);

  const { normalLabels, highlightLabels } = useLabels({
    pivot,
    scale,
    width,
    height,
    nodes,
    links,
    clickNode,
    focusNode,
    clickLink,
    focusLink,
    onHoverLabel,
    onClickLabel,
    showLabels,
    labelFormat,
    propsDataMap,
    palette,
    edgePalette,
    userConfigs,
  });

  const info = (
    <span>
      nodes:{nodes.length + newNodes?.length}
      <br />
      edges:{links.length + newLinks?.length}
    </span>
  );

  return (
    <div className="relative fixed top-0" ref={containerRef}>
      <Stage
        width={width}
        height={height}
        options={{ backgroundAlpha: 0, autoDensity: true }}
        onWheel={handleWheel}
        onMount={setApp}
      >
        <Graphics
          draw={drawBackground}
          interactive={true}
          cursor={focusLink ? "pointer" : "auto"}
          mousedown={onDragStart}
          mouseup={onDragEnd}
          mouseupoutside={onDragEnd}
          mousemove={onDragMove}
          pointerdown={onCanvasPointerDown}
        />
        {showGrid && <Graphics draw={drawGrid} />}
        <Container pivot={pivot} scale={{ x: scale, y: scale }}>
          <Graphics draw={drawEdges} />
          <Graphics draw={drawHighlightEdges} />
          <Graphics
            interactive={true}
            cursor={"pointer"}
            onclick={onNodeClick}
            pointerdown={onNodePointerDown}
            mousedown={onNodeDragStart}
            mouseup={onNodeDragEnd}
            mouseupoutside={onNodeDragEnd}
            mousemove={onNodeMouseMove}
            draw={drawExistingNodes}
            filters={[dropShadowFilter]}
          />
        </Container>
        {normalLabels}
        {highlightLabels}
        <Container pivot={pivot} scale={{ x: scale, y: scale }}>
          <Graphics draw={drawNewNodes} />
          <Graphics
            draw={drawExistingHighlightNodes}
            filters={[dropShadowFilter]}
          />
        </Container>
        <Watermark text={options.watermarkText} width={width} height={height} />
      </Stage>
      {propsPrefetchEnabled && propsDataMap?.size > 0 && (
        <SearchBar
          loading={propsPrefetchInProgress}
          itemMap={propsDataMap}
          onSearch={onSearch}
        />
      )}
      <Legend
        palette={palette}
        edgePalette={edgePalette}
        setPalette={setPalette}
        setEdgePalette={setEdgePalette}
        labelFormat={labelFormat}
        setLabelFormat={propsPrefetchEnabled ? setLabelFormat : null}
        info={info}
        userConfigs={userConfigs}
        saveUserConfigs={saveUserConfigs}
      />
      {detailsContent?.content && (
        <DetailsPanel position={detailsPosition} containerRef={containerRef}>
          <DetailsList content={detailsContent.content} />
        </DetailsPanel>
      )}
      {showMenu === "node" && (
        <ContextMenu
          containerRef={containerRef}
          position={menuPosition}
          items={[
            { label: "Center", name: "focus" },
            { label: "Query & View Properties", name: "view" },
            {
              label: "Expand with Edge Label ↓",
              name: onExpandNode ? "expand" : "",
              hasSubMenu: true,
              subMenuConfigs: {
                edgeLabels: Array.from(edgePalette).map(([key]) =>
                  key.startsWith("_path_") ? key.substring(6) : key
                ),
                preset:
                  userConfigs &&
                  userConfigs[`expandPreset.label.${menuContext.node?.label}`],
              },
            },
            {
              label: "Expand with All Edge Labels",
              name: onExpandNode ? "expandall" : "",
            },
            {
              label: "Remove Node",
              name: onRemoveNode ? "remove" : "",
            },
          ]}
          onItemClick={onNodeMenuItemClick}
          onClose={closeMenu}
        />
      )}
      {showMenu === "canvas" && (
        <ContextMenu
          containerRef={containerRef}
          position={menuPosition}
          items={[
            { label: "Reset View", name: "view" },
            { label: "Refresh Layout", name: "layout" },
            {
              label: (fullScreen ? "✔ " : "") + "Full Screen",
              name: setFullScreen ? "fullscreen" : "",
            },
            {
              label:
                (propsPrefetchEnabled ? "✔ " : "") +
                "Prefetch Props and Enable Search",
              name: setPropsPrefetchEnabled ? "prefetch" : "",
            },
            {
              label: (scaleToFit ? "✔ " : "") + "Scale to Fit",
              name: "scaletofit",
            },
            {
              label:
                (showLabels && scale >= LABEL_SCALE_LIMIT ? "✔ " : "") +
                "Toggle Labels",
              name: "labels",
            },
            { label: (showGrid ? "✔ " : "") + "Toggle Grid", name: "grid" },
            {
              label: "Prune Unconnected Nodes",
              name: onPruneNodes ? "prunenodes" : "",
            },
            { label: "Export as Image", name: "exportpng" },
          ]}
          onItemClick={onCanvasMenuItemClick}
          onClose={closeMenu}
        />
      )}
    </div>
  );
};

export default Canvas;
