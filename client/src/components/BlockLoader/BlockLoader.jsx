import Spinner from "../Spinner/Spinner";
import classes from "./BlockLoader.module.css";

export default function BlockLoader({ show = false }) {
  if (!show) return null;
  return (
    <div className={classes.overlay} role="status" aria-live="polite" aria-busy="true">
      <Spinner size={32} />
    </div>
  );
}
