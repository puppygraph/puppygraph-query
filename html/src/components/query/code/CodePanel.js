import { useCallback, useContext, useEffect, useRef } from "react";
import CodeEditor from "./CodeEditor";
import { QueryContext } from "../context/QueryContext";
import { VisDataContext } from "../context/VisDataContext";
import {
  XMarkIcon,
  PlayIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { gsonToVisData } from "../../common/gson/GsonUtils";

const CodePanel = () => {
  const editorsRef = useRef(null);
  const {
    queries,
    currentIndex,
    setOnResponse,
    setQuery,
    runQuery,
    removeQuery,
  } = useContext(QueryContext);
  const { addNewVisData } = useContext(VisDataContext);
  const hasClipBoard = !!navigator.clipboard;

  useEffect(() => {
    setOnResponse(() => (response) => {
      if (editorsRef.current) {
        setTimeout(() => {
          editorsRef.current.scrollTop = 0;
        }, 1);
      }
      addNewVisData(gsonToVisData(response));
    });
  }, [addNewVisData, setOnResponse]);
  const run = useCallback(() => {
    runQuery(currentIndex);
  }, [runQuery, currentIndex]);
  const runAt = useCallback(
    (i) => {
      runQuery(i);
    },
    [runQuery]
  );
  const clip = useCallback(
    async (i) => {
      await navigator.clipboard.writeText(queries[i].q);
    },
    [queries]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 flex-none bg-white flex items-center shadow-[0_5px_5px_0_rgba(0,0,0,0.1)] z-10">
        <button
          onClick={run}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-puppy-purple px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-puppy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:ml-3 sm:mt-0 sm:w-auto"
        >
          Run
        </button>
      </div>
      <div ref={editorsRef} className="flex-auto overflow-auto">
        <div className="grid grid-cols-[3rem_auto] pt-4 pb-[50%] px-4 gap-y-2">
          {queries
            .map((query, i) => (
              <>
                <div
                  key={"q" + i}
                  className={
                    "font-mono text-sm leading-5 mt-1" +
                    (query.s === "E" ? " text-red-600" : "")
                  }
                >
                  [{query.s}]:
                </div>
                <div className="relative group min-w-0" key={"e" + i}>
                  {i === currentIndex ? (
                    <CodeEditor
                      value={query.q}
                      isCurrent={true}
                      onValueChange={(val) => setQuery(i, val)}
                    />
                  ) : (
                    <div
                      className={
                        "text-left border font-mono px-[6px] py-[4px] text-[13px] leading-[18px] break-all" +
                        (query.s === "E" ? " border-red-600" : "")
                      }
                    >
                      <pre className="whitespace-pre-wrap">{query.q}</pre>
                    </div>
                  )}
                  <div className="absolute pl-2 top-[1px] right-[1px] pt-1 h-6 text-gray-500 invisible bg-white group-hover:visible">
                    <button onClick={() => runAt(i)} className="mr-1">
                      <PlayIcon className="h-5 w-5" />
                    </button>
                    {hasClipBoard && (
                      <button onClick={() => clip(i)} className="mr-1">
                        <ClipboardIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button onClick={() => removeQuery(i)} className="mr-1">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {query.r && (
                  <div key={"r" + i} className="col-span-full">
                    {query.r}
                  </div>
                )}
              </>
            ))
            .reverse()}
        </div>
      </div>
    </div>
  );
};

export default CodePanel;
