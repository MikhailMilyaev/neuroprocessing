import React, { useState } from 'react'
import classes from './NavBar.module.css'
import { IoIosSearch } from "react-icons/io";
import { TiDelete } from "react-icons/ti";
import { Link } from 'react-router-dom';

const NavBar = () => {
  const [searchInput, setSearchInput] = useState('')

  const handleClearInput = () => {
    setSearchInput('')
  }

  return (
    <div className={classes.container}>
        <div className={classes.content}>
            <div className={classes.ideasType}>
                <Link className={classes.link}>Все идеи</Link>
                <Link className={classes.link}>По темам</Link>
            </div>
            <div className={classes.searchInputContainer}>
                <IoIosSearch className={classes.searchIcon}/>
                    <input
                    className={classes.searchInput}
                    type="text"
                    placeholder="Поиск"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}/>
                    {searchInput && (
                        <TiDelete
                        className={classes.clearIcon}
                        onClick={handleClearInput}/>)}
            </div>
            <div className={classes.additional}>
                <Link className={classes.link}>Отложенные</Link>
                <Link className={classes.link}>В работе</Link>
            </div>
        </div>
    </div>
  )
}

export default NavBar