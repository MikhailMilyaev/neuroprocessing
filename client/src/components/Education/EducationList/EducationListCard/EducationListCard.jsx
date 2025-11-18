import { useNavigate } from "react-router-dom";
import classes from "./EducationListCard.module.css";
import { EDUCATION_ROUTE } from "../../../../utils/consts";

export default function EducationListCard({ article }) {
  const navigate = useNavigate();
  if (!article) return null;

  const { id, title } = article;

  const handleClick = () => {
    if (!id) return;
    navigate(`${EDUCATION_ROUTE}/${encodeURIComponent(id)}`);
  };

  return (
    <button
      type="button"
      className={classes.card}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={classes.title}>{title}</div>
    </button>
  );
}
