import { Text } from "@pixi/react";
import colors from "material-colors";
import { TextStyle } from "pixi.js";
import { useEffect, useState } from "react";

export const LABEL_SCALE_LIMIT = 1;

export const useLabels = ({
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
}) => {
  const [labels, setLabels] = useState([]);
  useEffect(() => {
    const labels = [];

    const isPointInsideStripe = (px, py, r) => {
      const { x: sx, y: sy, width, height, rotation } = r;

      const dx = px - sx;
      const dy = py - sy;
      const rotatedX = dx * Math.cos(-rotation) - dy * Math.sin(-rotation);
      const rotatedY = dx * Math.sin(-rotation) + dy * Math.cos(-rotation);

      const halfWidth = width / 2;
      const halfHeight = height / 2;
      return (
        Math.abs(rotatedX) <= halfWidth && Math.abs(rotatedY) <= halfHeight
      );
    };
    const isOverlapping = (r1, r2) => {
      // Calculate the endpoints of the first stripe and extend height
      const r1HalfWidth = (r1.width + r2.height) / 2;
      const r1x1 = r1.x + r1HalfWidth * Math.cos(r1.rotation);
      const r1y1 = r1.y + r1HalfWidth * Math.sin(r1.rotation);
      const r1x2 = r1.x - r1HalfWidth * Math.cos(r1.rotation);
      const r1y2 = r1.y - r1HalfWidth * Math.sin(r1.rotation);

      // Same for the second stripe
      const r2HalfWidth = (r2.width + r1.height) / 2;
      const r2x1 = r2.x + r2HalfWidth * Math.cos(r2.rotation);
      const r2y1 = r2.y + r2HalfWidth * Math.sin(r2.rotation);
      const r2x2 = r2.x - r2HalfWidth * Math.cos(r2.rotation);
      const r2y2 = r2.y - r2HalfWidth * Math.sin(r2.rotation);

      if (
        isPointInsideStripe(r1x1, r1y1, r2) ||
        isPointInsideStripe(r1x2, r1y2, r2) ||
        isPointInsideStripe(r2x1, r2y1, r1) ||
        isPointInsideStripe(r2x2, r2y2, r1)
      ) {
        return true;
      }

      const dx1 = r1x2 - r1x1;
      const dy1 = r1y2 - r1y1;
      const dx2 = r2x2 - r2x1;
      const dy2 = r2y2 - r2y1;

      const determinant = dx1 * dy2 - dy1 * dx2;

      if (determinant === 0) {
        // Stripes are parallel, check if they are collinear
        const collinear = (r1x1 - r2x1) * dy2 === (r1y1 - r2y1) * dx2;
        if (collinear) {
          // Stripes are collinear, check if they overlap
          const t1 =
            ((r2x1 - r1x1) * dx1 + (r2y1 - r1y1) * dy1) /
            (dx1 * dx1 + dy1 * dy1);
          const t2 =
            ((r2x2 - r1x1) * dx1 + (r2y2 - r1y1) * dy1) /
            (dx1 * dx1 + dy1 * dy1);
          return (
            (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1)
          );
        }
        return false; // Stripes are parallel but not collinear
      }

      // Cross products
      const t = ((r2x1 - r1x1) * dy2 - (r2y1 - r1y1) * dx2) / determinant;
      const u = ((r2x1 - r1x1) * dy1 - (r2y1 - r1y1) * dx1) / determinant;

      return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    };

    const getLabelRect = (label) => ({
      x: label.x,
      y: label.y,
      width: label.text.length * 8,
      height: 15,
      rotation: label.rotation || 0,
    });
    const addLabelsNoOverlap = (label) => {
      if (label.highlight) {
        if (labels.length < 100) {
          labels.push(label);
        }
        return;
      }
      if (labels.length >= 50) {
        return;
      }
      const labelRect = getLabelRect(label);
      const isOverlappingExisting = labels.some((existingLabel) => {
        const existingLabelRect = getLabelRect(existingLabel);
        return isOverlapping(labelRect, existingLabelRect);
      });
      if (!isOverlappingExisting) {
        labels.push(label);
      }
    };

    const formatLabel = (element) => {
      const label = element.label;
      const fmtStr =
        labelFormat.get(label) ||
        (userConfigs && userConfigs[`format.label.${label}`]) ||
        element.id;
      const props = propsDataMap ? propsDataMap.get(element.id) : null;
      if (!props) {
        return element.id;
      }
      const formattedLabel = fmtStr.replace(/{(\w+)}/g, (match, key) => {
        if (props?.properties?.has(key)) {
          return props.properties.get(key);
        }
        if (props && props[key]) {
          return props[key];
        }
        return match;
      });
      return formattedLabel;
    };

    const addToLabels = (node, color, highlight) => {
      if (palette.has(node.label) && palette.get(node.label)[0]) {
        return;
      }
      const pos = {
        x: (node.x - pivot.x) * scale,
        y: (node.y - pivot.y) * scale,
      };
      if (pos.x >= 0 && pos.y >= 0 && pos.x <= width && pos.y <= height) {
        const label = {
          x: pos.x,
          y: pos.y - 12 * scale,
          text: formatLabel(node),
          key: node.id,
          color: color,
          node: node,
          highlight: highlight,
        };
        addLabelsNoOverlap(label);
      }
    };
    const addLinkToLabels = (link, color, highlight) => {
      if (edgePalette.has(link.label) && edgePalette.get(link.label)[0]) {
        return;
      }
      let midPoint;
      if (link.curve) {
        midPoint = {
          x: link.curve.mx,
          y: link.curve.my,
        };
      } else {
        midPoint = {
          x: (link.source.x + link.target.x) / 2,
          y: (link.source.y + link.target.y) / 2,
        };
      }
      const pos = {
        x: (midPoint.x - pivot.x) * scale,
        y: (midPoint.y - pivot.y) * scale,
      };
      if (link.source.x === link.target.x && link.source.y === link.target.y) {
        pos.y -= 35 * scale;
      }
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2) angle -= Math.PI;
      if (angle < -Math.PI / 2) angle += Math.PI;
      if (pos.x >= 0 && pos.y >= 0 && pos.x <= width && pos.y <= height) {
        const label = {
          x: pos.x,
          y: pos.y,
          text: formatLabel(link),
          key: link.id,
          color: color,
          rotation: angle,
          link: link,
          highlight: highlight,
        };
        addLabelsNoOverlap(label);
      }
    };
    if (showLabels && scale >= LABEL_SCALE_LIMIT) {
      for (const node of nodes) {
        const highlight =
          node.id === clickNode?.id || node.id === focusNode?.id;
        addToLabels(
          node,
          node.id === clickNode?.id
            ? colors.red[800]
            : node.id === focusNode?.id
              ? colors.blue[600]
              : colors.blueGrey[300],
          highlight
        );
      }
      for (const link of links) {
        if (link.id.startsWith("_path_")) {
          continue;
        }
        let highlight = link.id === clickLink?.id || link.id === focusLink?.id;
        addLinkToLabels(
          link,
          link.id === clickLink?.id
            ? colors.red[800]
            : highlight
              ? colors.blue[600]
              : colors.blueGrey[300],
          highlight
        );
      }
    } else {
      for (const link of links) {
        if (link.id.startsWith("_path_")) {
          continue;
        }
        let highlight = link.id === clickLink?.id || link.id === focusLink?.id;
        if (highlight) {
          addLinkToLabels(
            link,
            link.id === clickLink?.id
              ? colors.red[800]
              : highlight
                ? colors.blue[600]
                : colors.blueGrey[300],
            highlight
          );
        }
      }
      if (focusNode) {
        const node = focusNode;
        addToLabels(node, colors.blue[600], true);
      }
      if (clickNode) {
        const node = clickNode;
        addToLabels(node, colors.red[800], true);
      }
    }
    setLabels(labels);
  }, [
    nodes,
    links,
    width,
    height,
    pivot,
    scale,
    focusNode,
    focusLink,
    clickNode,
    clickLink,
    showLabels,
    labelFormat,
    propsDataMap,
    palette,
    edgePalette,
    userConfigs,
  ]);

  const NodeLabel = ({ label, scale }) => {
    return (
      <Text
        interactive={true}
        cursor={"pointer"}
        mousemove={() => onHoverLabel(label.node, label.link)}
        click={(event) => onClickLabel(label.node, label.link, event.global)}
        text={label.text}
        x={label.x}
        y={label.y}
        anchor={{ x: 0.5, y: 1 }}
        rotation={label.rotation || 0}
        style={
          new TextStyle({
            align: "center",
            fontFamily: '"Source Sans Pro", Helvetica, sans-serif',
            fontSize: scale > 1 ? 16 : 12,
            fontWeight: "400",
            fill: label.color || colors.blue[600],
            stroke: "#ffffff",
            strokeThickness: 4,
          })
        }
      />
    );
  };

  const normalLabels = labels
    .filter((label) => !label.highlight)
    .map((label) => <NodeLabel key={label.key} label={label} />);
  const highlightLabels = labels
    .filter((label) => label.highlight)
    .map((label) => <NodeLabel key={label.key} label={label} />);

  return { normalLabels, highlightLabels };
};
