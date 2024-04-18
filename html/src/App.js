import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./screens/Login";
import SidebarLayout from "./components/navigation/SidebarLayout";
import { AuthContext } from "./AuthContext";
import { useContext } from "react";
import ProtectedRoute from "./ProtectedRoute";
import QueryWidgetScreen from "./screens/QueryWidgetScreen";

function App() {
  const { loggedIn } = useContext(AuthContext);
  return (
    <div id="App" className="App">
      <SidebarLayout />
      <Routes>
        <Route
          index
          element={!loggedIn ? <Login /> : <Navigate to="/query" />}
        />
        <Route
          path="/login"
          element={!loggedIn ? <Login /> : <Navigate to="/query" />}
        />
        <Route
          path="/query"
          element={
            <ProtectedRoute>
              <QueryWidgetScreen />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
