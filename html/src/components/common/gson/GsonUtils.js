export const gsonToNode = (gson) => {
  const id = gsonToIdStr(gson["@value"]["id"]);
  const label = gsonToStr(gson["@value"]["label"]);
  return { id, label };
};

export const gsonToEdge = (gson) => {
  const id = gsonToIdStr(gson["@value"]["id"]);
  const label = gsonToStr(gson["@value"]["label"]);
  const inV = gsonToIdStr(gson["@value"]["inV"]);
  const inVLabel = gsonToStr(gson["@value"]["inVLabel"]);
  const outV = gsonToIdStr(gson["@value"]["outV"]);
  const outVLabel = gsonToStr(gson["@value"]["outVLabel"]);
  return { id, label, inV, inVLabel, outV, outVLabel };
};

export const gsonToObject = (gson) => {
  if (gson instanceof Array) {
    const objs = [];
    for (const element of gson) {
      objs.push(gsonToObject(element));
    }
    return objs;
  }
  if (gson instanceof Object && gson["@type"] === "g:Vertex") {
    return gsonToNode(gson);
  }
  if (gson instanceof Object && gson["@type"] === "g:Edge") {
    return gsonToEdge(gson);
  }
  if (gson instanceof Object && gson["@type"] === "g:Path") {
    const list = gson["@value"]["objects"];
    const len = list["@value"].length;
    const res = [];
    for (let i = 0; i < len; i++) {
      const labels = gsonToObject(gson["@value"]["labels"]["@value"][i]);
      const object = gsonToObject(gson["@value"]["objects"]["@value"][i]);
      res.push({ labels, object });
    }
    return res;
  }
  if (gson instanceof Object && gson["@type"] === "g:List") {
    const len = gson["@value"].length;
    const res = [];
    for (let i = 0; i < len; i++) {
      const object = gsonToObject(gson["@value"][i]);
      res.push(object);
    }
    return res;
  }
  if (gson instanceof Object && gson["@type"] === "g:Map") {
    const len = gson["@value"].length;
    const res = new Map();
    for (let i = 0; i < len; i += 2) {
      const key = gsonToObject(gson["@value"][i]);
      const val = gsonToObject(gson["@value"][i + 1]);
      res.set(key, val);
    }
    return res;
  }
  if (gson instanceof Object && gson.hasOwnProperty("@value")) {
    return gson["@value"];
  }
  return gson;
};

export const gsonToStr = (gson) => {
  if (gson instanceof Object && gson["@type"] === "g:String") {
    return gson["@value"];
  }
  if (gson instanceof String || typeof gson === "string") {
    return gson;
  }
  const object = gsonToObject(gson);
  if (object instanceof String || typeof object === "string") {
    return object;
  }
  if (object instanceof Object && object.hasOwnProperty("@value")) {
    return gsonToStr(object["@value"]);
  }
  if (object instanceof Map) {
    return JSON.stringify(Object.fromEntries(object));
  }
  return JSON.stringify(object);
};

export const gsonToVisData = (gson) => {
  // node { id, label }
  // edge { id, label, outV, outVLabel, inV, inVLabel }
  // propsData { id, label, properties }
  // pathData { type, id, label, labels }
  const visData = {
    nodes: [],
    edges: [],
    propsData: [],
    pathData: [],
    otherData: [],
  };
  doGsonToVisData(gson, visData);
  return visData;
};

const doGsonToVisData = (gson, visData) => {
  if (gson instanceof Array) {
    for (const element of gson) {
      doGsonToVisData(element, visData);
    }
    return;
  }

  if (gson instanceof Object && gson["@type"] === "g:Vertex") {
    const node = gsonToNode(gson);
    visData.nodes.push(node);
    return;
  }
  if (gson instanceof Object && gson["@type"] === "g:Edge") {
    const edge = gsonToEdge(gson);
    visData.edges.push(edge);
    const outV = { id: edge.outV, label: edge.outVLabel };
    const inV = { id: edge.inV, label: edge.inVLabel };
    visData.nodes.push(outV);
    visData.nodes.push(inV);
    const path = [];
    path.push({
      type: "node",
      id: outV.id,
      label: outV.label,
      labels: [],
    });
    path.push({
      type: "edge",
      id: edge.id,
      label: edge.label,
      labels: [],
    });
    path.push({
      type: "node",
      id: inV.id,
      label: inV.label,
      labels: [],
    });
    visData.pathData.push(path);
    return;
  }
  if (gson instanceof Object && gson["@type"] === "g:Path") {
    const list = gson["@value"]["objects"];
    const len = list["@value"].length;
    const path = [];
    for (let i = 0; i < len; i++) {
      const labels = gsonToObject(gson["@value"]["labels"]["@value"][i]);
      const type = gson["@value"]["objects"]["@value"][i]["@type"];
      if (type === "g:Vertex") {
        const node = gsonToNode(gson["@value"]["objects"]["@value"][i]);
        visData.nodes.push(node);
        if (path.length >= 1 && path[path.length - 1].type === "node") {
          const edge = buildPathFakeEdge(path[path.length - 1], node);
          visData.edges.push(edge);
          path.push({
            type: "edge",
            id: edge.id,
            label: edge.label,
            labels: [],
          });
        }
        path.push({
          type: "node",
          id: node.id,
          label: node.label,
          labels: labels,
        });
      } else if (type === "g:Edge") {
        const edge = gsonToEdge(gson["@value"]["objects"]["@value"][i]);
        visData.edges.push(edge);
        const outV = { id: edge.outV, label: edge.outVLabel };
        const inV = { id: edge.inV, label: edge.inVLabel };
        visData.nodes.push(outV);
        visData.nodes.push(inV);
        path.push({
          type: "edge",
          id: edge.id,
          label: edge.label,
          labels: labels,
        });
      } else {
        const val = gsonToObject(gson["@value"]["objects"]["@value"][i]);
        path.push({ type: "val", val: val, labels: labels });
      }
    }
    visData.pathData.push(path);
    return;
  }
  if (gson instanceof Object && gson["@type"] === "g:Map") {
    const len = gson["@value"].length;
    const res = new Map();
    let id, label;
    for (let i = 0; i < len; i += 2) {
      const key = gsonToObject(gson["@value"][i]);
      let val;
      if (key === "id") {
        id = gsonToIdStr(gson["@value"][i + 1]);
        val = id;
      } else if (key === "label") {
        label = gsonToStr(gson["@value"][i + 1]);
        val = label;
      } else {
        val = gsonToObject(gson["@value"][i + 1]);
      }
      res.set(key, val);
    }
    if (id && label) {
      visData.propsData.push({
        id: id,
        label: label,
        properties: res,
      });
    } else {
      visData.otherData.push(res);
    }
    return;
  }
  const val = gsonToObject(gson);
  visData.otherData.push(val);
};

const buildPathFakeEdge = (outVNode, inVNode) => {
  const id = `_path_${outVNode.id}_${inVNode.id}`;
  const label = `_path_${outVNode.label}_${inVNode.label}`;
  const inV = inVNode.id;
  const inVLabel = inVNode.label;
  const outV = outVNode.id;
  const outVLabel = outVNode.label;
  return { id, label, inV, inVLabel, outV, outVLabel };
};

const gsonToIdStr = (gson) => {
  if (gson instanceof Object && gson.hasOwnProperty("@value")) {
    return gsonToIdStr(gson["@value"]);
  }
  if (gson instanceof Object && gson.hasOwnProperty("relationId")) {
    return gsonToIdStr(gson["relationId"]);
  }
  return gsonToStr(gson);
};
