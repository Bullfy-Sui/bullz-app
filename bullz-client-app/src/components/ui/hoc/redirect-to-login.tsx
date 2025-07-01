import { useEffect } from "react";
import { useNavigate } from "react-router";

const RedirectToLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately redirect to login page
    navigate("/login", { replace: true });
  }, [navigate]);

  // Show a brief loading message while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-white">Redirecting to login...</p>
    </div>
  );
};

export default RedirectToLogin; 