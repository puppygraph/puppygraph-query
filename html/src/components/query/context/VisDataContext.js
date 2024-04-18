import { createContext, useCallback, useState } from "react";

export const VisDataContext = createContext();

export const VisDataProvider = ({ children }) => {
  const [onNewVisData, setOnNewVisData] = useState(() => () => {});

  const addNewVisData = useCallback(
    (newVisData) => {
      onNewVisData(newVisData);
    },
    [onNewVisData]
  );

  const [highlightCallback, setHighlightCallback] = useState(() => () => {});
  const highlightData = useCallback(
    (data) => {
      highlightCallback(data);
    },
    [highlightCallback]
  );
  const [focusCallback, setFocusCallback] = useState(() => () => {});
  const focusData = useCallback(
    (id) => {
      focusCallback(id);
    },
    [focusCallback]
  );

  return (
    <VisDataContext.Provider
      value={{
        addNewVisData,
        setOnNewVisData,
        highlightData,
        setHighlightCallback,
        focusData,
        setFocusCallback,
      }}
    >
      {children}
    </VisDataContext.Provider>
  );
};
