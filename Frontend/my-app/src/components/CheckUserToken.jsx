import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const AuthValidator = ({ children }) => {
  const [isTokenValid, setIsTokenValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const expTime = decoded.exp; // in seconds
      const currentTime = Date.now(); // in ms

      if (expTime * 1000 > currentTime) {
        setIsTokenValid(true);
      } else {
        console.log("Token expired");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (error) {
      console.error("Invalid token", error);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  return isTokenValid ? children : null;
};

export default AuthValidator;
