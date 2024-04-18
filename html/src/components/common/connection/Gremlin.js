import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../AuthContext";

export const GremlinContext = createContext();

export const GremlinProvider = ({ children }) => {
  const {fetchWithAuth} = useContext(AuthContext);
  const [rpcState, setRpcState] = useState("waiting");
  const [queue, setQueue] = useState([]);

  const execute = useCallback(async (query) => {
    setRpcState("running");
    console.info(`gremlin query: ${query}`);
    try {
      const response = await fetchWithAuth("/submit", {
        method: "POST",
        body: JSON.stringify({
          query,
        }),
      });
      let json = await response.json();
      if (json["@type"] === "g:List") {
        json = json["@value"];
      }
      if (response.status !== 200) {
        throw json;
      }
      return json;
    } catch (error) {
      console.log(JSON.stringify(error));
      throw error;
    } finally {
      setRpcState("waiting");
    }
  }, [fetchWithAuth]);

  const submit = useCallback((query) => {
    return new Promise(async (resolve, reject) => {
      setQueue((queue) => [...queue, { query, resolve, reject }]);
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (rpcState !== "waiting" || queue.length === 0) return;

    const { query, resolve, reject } = queue.shift();
    setQueue(queue);

    try {
      const response = await execute(query);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  }, [rpcState, queue, execute]);

  useEffect(() => {
    if (rpcState === "waiting" && queue.length > 0) {
      processQueue();
    }
  }, [queue, rpcState, processQueue]);

  const queryElementData = useCallback(async (type, ids) => {
    try {
      const response = await fetchWithAuth('/ui-api/props', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, ids }),
      });
      let json = await response.json();
      if (json["@type"] === "g:List") {
        json = json["@value"];
      }
      if (response.status !== 200) {
        throw json;
      }
      return json;
    } catch (error) {
      console.error('Error querying props data:', error);
      throw error;
    }
  }, [fetchWithAuth]);

  return (
    <GremlinContext.Provider value={{ submit, queryElementData }}>
      {children}
    </GremlinContext.Provider>
  );
};
