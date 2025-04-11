import Spinner from '../../Spinner/Spinner'
import classes from './SubmitButton.module.css'

const SubmitButton = ({ children, onSubmit, isLoading }) => {
  return (
    <button 
      onClick={onSubmit} 
      className={classes.submitButton} 
      type='submit'
      disabled={isLoading}>

      {children}
      {isLoading && <Spinner />}
    </button>
  )
}

export default SubmitButton