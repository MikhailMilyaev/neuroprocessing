import { useState } from "react";
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import classes from './FormInputPassword.module.css'

const FormInputPassword = ({ value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={classes.passwordWrapper}>
        <input 
            className={classes.formInputPassword}
            value={value}
            onChange={onChange}
            type={showPassword ? 'text' : 'password'} 
            placeholder={placeholder} />
        {value && (
            <span 
                className={classes.eyeIcon} 
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </span>)}
    </div>
  )
}

export default FormInputPassword