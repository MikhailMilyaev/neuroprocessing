import classes from './FormErrorMessage.module.css'

const FormErrorMessage = ({ message }) => {
  if (!message) return null

  return (<p className={classes.errorMessage}>{message}</p>)
}

export default FormErrorMessage