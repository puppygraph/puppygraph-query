import React, { useContext } from "react";
import QueryWidget from "../components/query/QueryWidget";
import { StatusContext } from "../StatusContext";

function QueryWidgetScreen() {
  const {status} = useContext(StatusContext);

  return (
    <div className="flex-1 pt-10 h-[80vh]">
      <main className="h-full">
        <div className="px-4 sm:px-6 lg:px-8 h-full">
          <QueryWidget config={{prefetchPageSize: status?.PrefetchPageSize, watermarkText: status?.WatermarkText}} />
        </div>
      </main>
    </div>
  );
}

export default QueryWidgetScreen;
