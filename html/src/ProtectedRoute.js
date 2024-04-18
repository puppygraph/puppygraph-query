import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { loggedIn } = useContext(AuthContext);

  return loggedIn ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
