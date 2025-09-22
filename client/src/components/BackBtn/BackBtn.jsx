// BackBtn.jsx
import { FaArrowLeftLong } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import classes from "./BackBtn.module.css";
import {
  STORIES_ROUTE,
  EDUCATION_ROUTE,
  PRACTICE_BASE,
  IDEAS_ROUTE,
} from "../../utils/consts";

const BackBtn = ({
  className = "",
  variant = "fixed",
  onClick,
  to,               
  preferFallback = false,  
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const smartFallback = (() => {
    if (pathname.startsWith(`${PRACTICE_BASE}/`)) return EDUCATION_ROUTE;  
    if (pathname.startsWith("/story/"))          return STORIES_ROUTE;    
    if (pathname.startsWith(EDUCATION_ROUTE))    return STORIES_ROUTE;     
    if (pathname.startsWith(IDEAS_ROUTE))        return STORIES_ROUTE;     
  })();

  const fallback = to || smartFallback;

  const canGoBack = typeof window !== "undefined"
    ? Number.isInteger(window.history?.state?.idx) && window.history.state.idx > 0
    : false;

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (preferFallback) {
      navigate(fallback, { replace: true });
      return;
    }

    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  const cn =
    `${classes.btn} ` +
    (variant === "inline" ? classes.inline : classes.fixed) +
    (className ? ` ${className}` : "");

  return (
    <button
      type="button"
      aria-label="Назад"
      className={cn}
      onClick={handleClick}
    >
      <FaArrowLeftLong aria-hidden />
    </button>
  );
};

export default BackBtn;
