import * as d3 from "d3";
import { manyBodyFast } from "./ManyBodyFast";

export const forceSimulate = (
  nodes,
  links,
  options = {},
  onTick = () => {}
) => {
  const gap = options.gap
    ? options.gap
    : options.layout === "radial"
      ? getRadialGap(nodes)
      : options.layout === "vertical"
        ? getVerticalGap(nodes)
        : 100;
  let maxPathIndex = 0;
  for (const node of nodes) {
    if (node.pathIndex > maxPathIndex) {
      maxPathIndex = node.pathIndex;
    }
  }

  const simulation = d3
    .forceSimulation(nodes)
    .alphaMin(0.05)
    .alphaDecay(0.03)
    .force(
      "charge",
      options.layout === "force"
        ? manyBodyFast().strength(-150)
        : options.layout === "radial"
          ? manyBodyFast().strength(-250)
          : null
    )
    .force(
      "collide",
      options.layout === "vertical" ? d3.forceCollide(() => 15) : null
    )
    .force(
      "link",
      options.layout === "vertical"
        ? d3
            .forceLink()
            .links(links)
            .distance(() => gap)
            .strength(() => 0.01)
        : d3
            .forceLink()
            .links(links)
            .distance(() => gap)
    )
    .force(
      "center",
      options.layout === "force" ? d3.forceCenter(0, 0).strength(0.01) : null
    )
    .force(
      "radial",
      options.layout === "radial"
        ? d3
            .forceRadial()
            .radius((d) => (d.pathIndex || 0) * gap)
            .strength((d) => 0.8)
        : null
    )
    .force(
      "vertical",
      options.layout === "vertical"
        ? d3
            .forceX()
            .x(
              (d) =>
                (d.pathIndex === null || d.pathIndex === undefined
                  ? 0
                  : d.pathIndex - maxPathIndex / 2) * gap
            )
            .strength((d) => 0.8)
        : null
    );
  if (onTick) {
    simulation.on("tick", () => onTick());
  }
  return new Promise((resolve, _) => {
    simulation.on("end", () => {
      resolve();
    });
  });
};

const getRadialGap = (nodes) => {
  let radialGap = 0;
  const indexCnt = Array(100).fill(0);
  for (let node of nodes) {
    const i = node.pathIndex || 0;
    if (i >= 0 && i < 99) {
      indexCnt[i]++;
    }
  }
  for (let i = 0; i < 100; i++) {
    if (indexCnt[i] / (i + 1) > radialGap) {
      radialGap = indexCnt[i] / (i + 1);
    }
  }
  if (radialGap < 150) {
    radialGap = 150;
  }
  return radialGap;
};

const getVerticalGap = (nodes) => {
  let verticalGap = 0;
  const indexCnt = Array(100).fill(0);
  for (let node of nodes) {
    const i = node.pathIndex || 0;
    if (i >= 0 && i < 99) {
      indexCnt[i]++;
    }
  }
  for (let i = 0; i < 100; i++) {
    if (indexCnt[i] / 2 > verticalGap) {
      verticalGap = indexCnt[i] / 2;
    }
  }
  if (verticalGap < 200) {
    verticalGap = 200;
  }
  return verticalGap;
};
