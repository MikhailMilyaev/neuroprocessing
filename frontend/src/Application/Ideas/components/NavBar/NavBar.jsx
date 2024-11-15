import React, { useState } from 'react'
import classes from './NavBar.module.css'
import { IoIosSearch } from "react-icons/io";
import { TiDelete } from "react-icons/ti";
import { NavLink, Link } from 'react-router-dom';
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { FcIdea } from "react-icons/fc";
import { AiTwotoneAppstore } from "react-icons/ai";

const NavBar = () => {
  const [searchInput, setSearchInput] = useState('')

  const handleClearInput = () => {
    setSearchInput('')
  }

  return (
    <div className={classes.container}>
        <div className={classes.content}>
            <div className={classes.ideasType}>
            <NavLink to='all' className={({ isActive }) => isActive ? classes.activeLink : classes.link}>Все идеи</NavLink>
            <NavLink to='themes' className={({ isActive }) => isActive ? classes.activeLink : classes.link}>По темам</NavLink>
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
                <NavLink to='saved' className={classes.link}>Отложенные</NavLink>
                <Link to='/ideas/inprogress' className={classes.link}>В работе</Link>
            </div>

            <div className={classes.icons}>
            <IoIosArrowBack />
            <IoIosArrowForward />
            <FcIdea />
            <AiTwotoneAppstore />
            </div>
        </div>
    </div>
  )
}

export default NavBar