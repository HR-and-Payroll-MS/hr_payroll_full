import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLocalData } from "../Hooks/useLocalStorage";
export default function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = getLocalData("role");

    if (!role) {
      // No role → not logged in
      navigate("/login", { replace: true });
      return;
    }

    switch (role) {
      case "Manager":
        navigate("/hr_dashboard", { replace: true });
        break;
      case "Line Manager":
        navigate("/department_manager", { replace: true });
        break;

      case "Payroll":
        navigate("/payroll", { replace: true });
        break;
      case "Employee":
        navigate("/employee", { replace: true });
        break;
      case "Dep_Man":
        navigate("/department_manager", { replace: true });
        break;

      default:
        // Role exists but not allowed / unknown
        navigate("/unauthorized", { replace: true });
        break;
    }
  }, [navigate]);

  // Nothing is rendered, this component only redirects
  return null;
}
