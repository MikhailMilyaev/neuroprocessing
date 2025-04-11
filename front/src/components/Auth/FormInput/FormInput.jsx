import classes from './FormInput.module.css'

const FormInput = ({ value, onChange, placeholder, type }) => {
  return (
    <input 
        className={classes.formInput}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type} />
  )
}

export default FormInput