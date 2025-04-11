import { IoSearchOutline } from "react-icons/io5";
import { IoCloseOutline } from "react-icons/io5";
import classes from './StoryInput.module.css'
import { useState } from "react";

const StoryInput = ({ value, onChange }) => {
  const [isFocus, setIsFocus] = useState(false)

  return (
    <div className={classes.inputContainer}>
      <IoSearchOutline className={classes.searchIcon} style={{color: isFocus && 'black'}}/>
      <input 
        type='text'
        className={classes.input}
        placeholder='Поиск'
        value={value} 
        onChange={onChange}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        />
        {value && 
          <IoCloseOutline 
          className={classes.clearIcon} 
          style={{color: isFocus && 'black'}} 
          onClick={() => onChange({ target: { value: '' }})}/>}
    </div>
    
  )
}

export default StoryInput