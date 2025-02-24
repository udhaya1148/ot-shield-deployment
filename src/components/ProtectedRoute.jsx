import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ element }) => {
  const navigate = useNavigate();
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? element : null;
};

export default ProtectedRoute;
