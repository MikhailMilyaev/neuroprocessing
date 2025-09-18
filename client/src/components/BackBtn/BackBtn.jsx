import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import classes from "./BackBtn.module.css";

/**
 * variant:
 *  - "fixed"  — как раньше: фиксированная кнопка в углу
 *  - "inline" — внутри контейнера/строки (используем на экране Reset)
 */
const BackBtn = ({ className = "", variant = "fixed", onClick }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (onClick) onClick();
    else navigate(-1);
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
