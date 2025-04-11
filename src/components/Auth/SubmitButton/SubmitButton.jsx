import classes from './SubmitButton.module.css'

const SubmitButton = ({ children, onSubmit }) => {
  return (
    <button onClick={onSubmit} className={classes.submitButton} type='submit'>{children}</button>
  )
}

export default SubmitButton