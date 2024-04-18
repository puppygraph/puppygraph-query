import React, { createContext, useCallback, useState } from "react";
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useState(true);

  const login = useCallback((data) => {
    return fetch(window.location.origin + window.location.pathname + 'login', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(response => {
      if (response.status !== 200) {
        console.log("login error: %s", response.status);
      }
      return response;
    })
    .then(response => response.json())
    .then(json => {
      if (json.code === 200) {
        setLoggedIn(true);
        navigate("/");
      }
      return json;
    })
  }, [setLoggedIn, navigate]);

  const logout = useCallback(() => {
    fetch(window.location.origin + window.location.pathname + 'logout', {
      method: "POST",
    }).then(response => response.json())
    .then(json => {
      if (json.code === 200) {
        setLoggedIn(false);
        navigate("/login");
      }
      return json;
    })
  }, [navigate, setLoggedIn]);

  const fetchWithAuth = useCallback((path, options) => {
    const optionsWithAuth = {
      ...options,
      headers: {
        ...options?.headers,
        "Puppy-Authentication": "JWT",
      }
    }
    let baseUri = window.location.origin + window.location.pathname;
    if (path.startsWith("/")) {
      baseUri = baseUri.replace(/\/+$/, "");
    }
    return fetch(baseUri + path, optionsWithAuth).then(response => {
      if (response.status === 401 || response.status === 403) {
        console.log("auth error: %s", response.status);
        setLoggedIn(false);
        navigate("/login");
        throw new Error("login required");
      }
      return response;
    }).catch((err) => {
      if (err.message !== "login required") {
        console.error(err);
      }
    });
  }, [navigate]);

  const refreshToken = useCallback(() => {
    fetch(window.location.origin + window.location.pathname + 'refresh_token').catch(console.error);
  }, [])

  return (
    <AuthContext.Provider value={{ loggedIn, login, logout, fetchWithAuth, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
