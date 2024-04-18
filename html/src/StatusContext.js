import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";

export const StatusContext = createContext();

export const StatusProvider = ({ children }) => {
  const { loggedIn, fetchWithAuth, refreshToken } = useContext(AuthContext);
  const [status, setStatus] = useState(null);

  // Function to fetch data
  const fetchStatus = useCallback(() => {
    if (loggedIn) {
      fetchWithAuth("/status")
        .then(response => {
          if (!response) {
            throw new Error("No response")
          }
          if (response.status !== 200) {
            throw new Error(response.status);
          }
          return response;
        })
        .then(response => response.json())
        .then(json => setStatus(json))
        .then(json => {
          setTimeout(() => refreshToken(), 1);
          return json;
        })
        .catch(error => {
          if (error.message !== "No response") {
            console.error("Error fetching status:", error);
          }
        });
    }
  }, [loggedIn, fetchWithAuth, refreshToken]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const contextValue = {
    status: status,
    refreshStatus: fetchStatus
  };

  return (
    <StatusContext.Provider value={contextValue}>
      {children}
    </StatusContext.Provider>
  );
};
