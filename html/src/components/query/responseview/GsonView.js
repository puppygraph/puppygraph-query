import { gsonToStr } from "../../common/gson/GsonUtils";

const GsonView = ({ gson, onMouseHover, onClick }) => {
  return GsonElement({gson, onMouseHover, onClick})
}

const GsonElement = ({ gson, onMouseHover, onClick }) => {
  if (gson instanceof Array) {
    return (
      <div>
        {gson.map((element, i) => <div key={i}>{GsonElement({gson: element, onMouseHover, onClick})}</div>)}
      </div>
    );
  }
  if (gson instanceof Object && gson["@type"] === "g:Vertex") {
    const id = gsonToStr(gson["@value"]["id"]);
    return (
      <div
        onMouseEnter={() => onMouseHover({ id })}
        onMouseLeave={() => onMouseHover()}
        onClick={() => onClick({ id })}
        className="m-[1px] border inline-block rounded px-1 border-indigo-600 bg-indigo-100 cursor-pointer"
      >
        Vertex
        <span className="pl-1">
          {GsonElement({gson: gson["@value"]["label"]})}
        </span>
        <span className="pl-1">
          {GsonElement({gson: gson["@value"]["id"]})}
        </span>
      </div>
    );
  }
  if (gson instanceof Object && gson["@type"] === "g:Edge") {
    return (
      <div className="m-[1px] border inline-block rounded px-1 border-green-600 bg-green-200">
        Edge
        <span className="pl-1">
          {GsonElement({gson: gson["@value"]["label"]})}
        </span>
        <span className="pl-1">
          {GsonElement({gson: gson["@value"]["id"]})}
        </span>
      </div>
    );
  }
  if (gson instanceof Object && gson["@type"] === "g:Path") {
    const list = gson["@value"]["objects"];
    const len = list["@value"].length;
    const path = [];
    for (let i = 0; i < len; i++) {
      const node = (
        <div key={i} className="inline">{GsonElement({gson: gson["@value"]["objects"]["@value"][i], onMouseHover, onClick})}</div>
      );
      path.push(node);
    }
    return (
      <div className="border inline-block rounded px-1 m-[1px] border-lime-600 bg-lime-100">
        <span className="pr-1">Path</span>
        {path}
      </div>
    );
  }
  if (gson instanceof Object && gson["@type"] === "g:VertexProperty") {
    return (
      <div className="m-[1px] border inline-block rounded px-1 border-stone-600 bg-stone-100">
        VertexProperty
        <span className="pl-1">
          {GsonElement({gson: gson["@value"]["label"]})}
        </span>
        =
        <span>
          {GsonElement({gson: gson["@value"]["value"]})}
        </span>
      </div>
    );
  }
  if (gson instanceof Object && gson["@type"] === "g:Property") {
    return (
      <div className="m-[1px] border inline-block rounded px-1 border-stone-600 bg-stone-100">
        Property
        <span className="pl-1">
          {GsonElement({gson: gson["@value"]["key"]})}
        </span>
        =
        <span>
          {GsonElement({gson: gson["@value"]["value"]})}
        </span>
      </div>
    );
  }
  if (gson instanceof Object && gson["@type"] === "g:Map") {
    const len = gson["@value"].length;
    const grid = [];
    for (let i = 0; i < len; i++) {
      const node = (
        <div className="overflow-hidden" key={i}>
          {GsonElement({gson: gson["@value"][i], onMouseHover, onClick})}
        </div>
      );
      grid.push(node);
    }
    return <div className="grid grid-cols-2 g-1">{grid}</div>;
  }

  if (gson instanceof Object && gson["@type"] === "g:String") {
    return gson["@value"];
  }
  if (gson instanceof String || typeof gson === "string") {
    return gson;
  }
  if (gson instanceof Object && gson.hasOwnProperty("@value")) {
    return GsonElement({gson: gson["@value"], onMouseHover, onClick});
  }
  return <div>{JSON.stringify(gson)}</div>;
};

export { GsonView };
