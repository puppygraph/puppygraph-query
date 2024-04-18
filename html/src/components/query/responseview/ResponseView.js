import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { GsonView } from "./GsonView";
import { VisDataContext } from "../context/VisDataContext";

const ResponseView = ({ response }) => {
  const { highlightData, focusData } = useContext(VisDataContext);
  const ref = useRef(null);
  const [hasExpand, setHasExpand] = useState(false);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (ref.current) {
      setHasExpand(ref.current.scrollHeight > ref.current.clientHeight);
    }
  }, [response]);

  const expand = useCallback(() => {
    setHasExpand(false);
    setLimit((limit) => limit + 20);
  }, []);

  const onMouseHover = useCallback(
    (data) => {
      highlightData({
        nodes: data ? [data.id] : [],
      });
    },
    [highlightData]
  );

  const onClick = useCallback(
    (data) => {
      focusData(data.id);
    },
    [focusData]
  );

  return (
    <div className="relative mb-2 bg-gray-50 rounded border overflow-hidden ">
      {response instanceof Array && <div className="text-left text-sm px-2 pt-2">Rows: {response.length}</div>}
      <div
        ref={ref}
        className={
          "text-left text-xs p-2 overflow-y-auto break-all " +
          (limit > 20 ? " max-h-auto" : " max-h-20")
        }
      >
        <GsonView
          gson={response instanceof Array ? response.slice(0, limit) : response}
          onMouseHover={onMouseHover}
          onClick={onClick}
        />
      </div>
      {(hasExpand || (response instanceof Array && limit < response.length)) && (
        <button
          onClick={expand}
          className="block text-xs text-blue-500 w-full bottom-0 bg-white shadow-[0_3px_3px_3px_rgba(0,0,0,0.3)]"
        >
          expand
        </button>
      )}
    </div>
  );
};

export default ResponseView;
