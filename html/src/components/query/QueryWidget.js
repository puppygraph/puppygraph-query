import { Allotment } from "allotment";
import CodePanel from "./code/CodePanel";
import "allotment/dist/style.css";
import { GremlinProvider } from "../common/connection/Gremlin";
import Vis from "./vis/Vis";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { QueryProvider } from "./context/QueryContext";
import { VisDataProvider } from "./context/VisDataContext";

const QueryWidget = ({config}) => {
  const Widget = () => {
    const [visWidth, setVisWidth] = useState(360);
    const onSplitterChange = useDebouncedCallback((data) => {
      setVisWidth(data[1]);
    }, 50);

    return (
      <Allotment defaultSizes={[120, 240]} onChange={onSplitterChange}>
        <div className="h-full">
          <CodePanel />
        </div>
        <div className="h-full bg-blue-100">
          <Vis splitterWidth={visWidth} config={config} />
        </div>
      </Allotment>
    );
  };

  return (
    <div className="w-full h-full relative rounded-b-xl shadow-xl border overflow-hidden">
      <GremlinProvider>
        <QueryProvider>
          <VisDataProvider>
            <Widget />
          </VisDataProvider>
        </QueryProvider>
      </GremlinProvider>
    </div>
  );
};

export default QueryWidget;
