import { IoSearchOutline, IoCloseOutline } from "react-icons/io5";
import classes from './SearchStory.module.css';
import { useState } from "react";

const SearchStory = ({ value, onChangeText, inputRef, autoFocus }) => {
  const [isFocus, setIsFocus] = useState(false);
  const clear = () => onChangeText('');

  return (
    <div className={classes.inputContainer}>
      <IoSearchOutline className={classes.searchIcon} style={{ color: isFocus ? 'black' : undefined }} />
      <input
        type="search"
        className={classes.input}
        placeholder="Поиск"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        aria-label="Поиск по историям"
        inputMode="search"
        enterKeyHint="search"
        ref={inputRef}
        autoFocus={autoFocus}
      />
      {value && (
        <IoCloseOutline
          className={classes.clearIcon}
          style={{ color: isFocus ? 'black' : undefined }}
          onClick={clear}
          role="button"
          tabIndex={0}
          aria-label="Очистить поиск"
          onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && clear()}
        />
      )}
    </div>
  );
};

export default SearchStory;
