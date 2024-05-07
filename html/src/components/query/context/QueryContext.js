import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import ResponseView from "../responseview/ResponseView";
import { GremlinContext } from "../../common/connection/Gremlin";
import { StatusContext, GRAPH_MODE_BIGGRAPH } from "../../../StatusContext";

export const QueryContext = createContext();

const LOCAL_STORAGE_KEY = "puppyQueries";

export const QueryProvider = ({ children }) => {
  const { status } = useContext(StatusContext);
  const { submit } = useContext(GremlinContext);
  const [queries, setQueries] = useState(() => {
    const puppyQueries = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (
      puppyQueries &&
      puppyQueries instanceof Array &&
      (puppyQueries.length > 1 ||
        (puppyQueries.length === 1 && !!puppyQueries[0]))
    ) {
      return puppyQueries;
    }
    if (!!status && status?.WebUI?.GraphMode !== GRAPH_MODE_BIGGRAPH) {
      return [{ q: "g.V().limit(10).\n  outE().inV().path()\n", s: " ", r: "" }];
    } else {
      return [{ q: "g.E().limit(10)\n", s: " ", r: "" }];
    }
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onResponse, setOnResponse] = useState(() => () => {});

  const clearQueryResults = useCallback((queries) => {
    const isEmpty = (q) => {
      return !q || q.replace(/\s/g, "").length === 0;
    };
    return queries
      .filter((q) => !isEmpty(q.q))
      .map((q, i) => ({ q: q.q, s: (i + 1).toString(), r: "" }));
  }, []);

  const saveQueries = useCallback(
    (queries) => {
      // Remove result set for local storage
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(clearQueryResults(queries))
      );
      setQueries(queries);
    },
    [clearQueryResults]
  );

  const setQuery = useCallback(
    (index, newQuery) => {
      saveQueries(
        queries.map((query, i) => {
          if (i === index) {
            if (query.q === newQuery) {
              return query;
            } else {
              return { q: newQuery, s: " ", r: "" };
            }
          } else {
            return query;
          }
        })
      );
    },
    [queries, saveQueries]
  );

  const updateQueryState = useCallback(
    (index, state, result) => {
      saveQueries(
        queries.map((query, i) => {
          if (i === index) {
            return { q: query.q, s: state, r: result };
          } else {
            return query;
          }
        })
      );
    },
    [queries, saveQueries]
  );

  const runQuery = useCallback(
    async (index) => {
      try {
        updateQueryState(index, "*");
        const response = await submit(queries[index].q);
        console.log(response);
        onResponse(response);
        updateQueryState(
          index,
          (index + 1).toString(),
          <ResponseView response={response} />
        );
      } catch (ex) {
        console.log(ex);
        updateQueryState(index, "E", <ResponseView response={ex} />);
      }
    },
    [submit, queries, onResponse, updateQueryState]
  );

  const removeQuery = useCallback(
    (i) => {
      queries.splice(i, 1);
      saveQueries([...queries]);
    },
    [queries, saveQueries]
  );

  const clearQueries = useCallback(() => {
    saveQueries(clearQueryResults(queries));
  }, [queries, clearQueryResults, saveQueries]);

  const appendAndRunQuery = useCallback(
    async (query) => {
      if (queries[currentIndex].q === "") {
        queries[currentIndex] = { q: query, s: " ", r: "" };
      } else {
        queries.push({ ...queries[currentIndex] });
        queries[currentIndex] = { q: query, s: " ", r: "" };
        setCurrentIndex(queries.length - 1);
      }
      saveQueries([...queries]);
      runQuery(currentIndex);
    },
    [queries, currentIndex, runQuery, saveQueries]
  );

  useEffect(() => {
    if (!queries || queries.length === 0) {
      saveQueries([{ q: "", s: " ", r: "" }]);
      setCurrentIndex(0);
      return;
    }
    const lastState = queries[queries.length - 1].s;
    setCurrentIndex(queries.length - 1);
    if (lastState !== " " && lastState !== "E" && lastState !== "*") {
      saveQueries([...queries, { q: "\n", s: " ", r: "" }]);
      setCurrentIndex(queries.length);
    }
  }, [queries, saveQueries]);

  return (
    <QueryContext.Provider
      value={{
        queries,
        currentIndex,
        setOnResponse,
        setQuery,
        runQuery,
        removeQuery,
        appendAndRunQuery,
        clearQueries,
      }}
    >
      {children}
    </QueryContext.Provider>
  );
};
