import { useState, useEffect } from "react";
import { gsonToVisData } from "../../common/gson/GsonUtils";

const usePropsPrefetch = (
  enabled,
  queryElementData,
  nodes,
  links,
  propsDataMap,
  setPropsDataMap,
  batchSize = 1000
) => {
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);

  useEffect(() => {
    let intervalId;

    if (enabled && errorCount < 3) {
      intervalId = setInterval(() => {
        if (!isRequestPending) {
          const missingNodeIds = nodes
            .map((node) => node.id)
            .filter((id) => !propsDataMap.has(id));
          const missingLinkIds = links
            .map((link) => link.id)
            .filter((id) => !propsDataMap.has(id));

          const total = nodes.length + links.length;
          const missing = missingNodeIds.length + missingLinkIds.length;
          setTotal(total);
          setDone(total - missing);

          const fetchMissingData = async () => {
            setIsRequestPending(true);

            try {
              let fetchedData = {};
              if (missingNodeIds.length > 0) {
                if (missingNodeIds.length > batchSize) {
                  missingNodeIds.length = batchSize;
                }
                fetchedData = await queryElementData("V", missingNodeIds);
              } else if (missingLinkIds.length > 0) {
                if (missingLinkIds.length > batchSize) {
                  missingLinkIds.length = batchSize;
                }
                fetchedData = await queryElementData("E", missingLinkIds);
              }
              const propsData = gsonToVisData(fetchedData).propsData;
              if (propsData.length > 0) {
                const newPropsDataMap = new Map(propsDataMap);
                for (const props of propsData) {
                  newPropsDataMap.set(props.id, props);
                }
                console.log(newPropsDataMap);
                setPropsDataMap(newPropsDataMap);
              }
              setErrorCount(0);
            } catch (error) {
              console.error("Error fetching element data:", error);
              setErrorCount((prevCount) => prevCount + 1);
            }

            setIsRequestPending(false);
          };

          if (missingNodeIds.length > 0 || missingLinkIds.length > 0) {
            fetchMissingData();
          }
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [
    nodes,
    links,
    propsDataMap,
    isRequestPending,
    enabled,
    queryElementData,
    setPropsDataMap,
    errorCount,
    batchSize,
  ]);

  const running = done < total && errorCount < 3;
  return { running, total, done };
};

export default usePropsPrefetch;
