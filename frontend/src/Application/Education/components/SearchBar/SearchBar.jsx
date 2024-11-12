import React, { useState } from 'react';
import classes from './SearchBar.module.css';
import { IoIosSearch } from "react-icons/io";
import { TiDelete } from "react-icons/ti";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleClearInput = () => {
    setSearchTerm('');
  };

  return (
    <div className={classes.searchBarContainer}>
        <div className={classes.searchInputContainer}>
        <IoIosSearch className={classes.searchIcon}/>
            <input
            className={classes.searchInput}
            type="text"
            placeholder="Поиск"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}/>
            {searchTerm && (
                <TiDelete
                className={classes.clearIcon}
                onClick={handleClearInput}/>)}
        </div>
        <button className={classes.searchButton}>Искать</button>
    </div>
);
};
export default SearchBar;