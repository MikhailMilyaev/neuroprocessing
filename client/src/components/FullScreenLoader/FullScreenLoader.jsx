import Spinner from "../Spinner/Spinner";
import classes from "./FullScreenLoader.module.css";

export default function FullScreenLoader() {
  return (
    <div className={classes.backdrop} role="status" aria-live="polite" aria-busy="true">
      <Spinner size={50} />
    </div>
  );
}
