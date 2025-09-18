import Spinner from '../../Spinner/Spinner'
import classes from './SubmitButton.module.css'

const SubmitButton = ({ children, onSubmit, isLoading }) => {
  return (
    <button
      onClick={onSubmit}
      className={classes.submitButton}
      type="submit"
      disabled={isLoading}
      aria-busy={isLoading}
    >
      <span className={classes.btnText}>{children}</span>
      {isLoading && (
        <Spinner size={18} color="#fff" className={classes.btnSpinner} /> 
      )}
    </button>
  )
}

export default SubmitButton
