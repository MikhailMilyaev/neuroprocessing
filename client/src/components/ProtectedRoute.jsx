import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { Context } from "../index";
import { observer } from "mobx-react-lite";

const ProtectedRoute = observer(({ children }) => {
  const { user } = useContext(Context);
  const location = useLocation();

  if (!user.isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
});

export default ProtectedRoute;