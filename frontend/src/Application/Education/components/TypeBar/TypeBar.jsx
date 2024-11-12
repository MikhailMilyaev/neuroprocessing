import React from 'react'
import classes from './TypeBar.module.css'
import { NavLink } from 'react-router-dom'

const TypeBar = () => {
return (
    <div className={classes.container}>
        <div className={classes.links}>
        <NavLink to="practices" end className={({ isActive }) => isActive ? classes.active : undefined}>Практики</NavLink>
        <NavLink to="articles" end className={({ isActive }) => isActive ? classes.active : undefined}>Статьи</NavLink>
        <NavLink to="videos" end className={({ isActive }) => isActive ? classes.active : undefined}>Вебинары</NavLink>
        <NavLink to="dictionary" end className={({ isActive }) => isActive ? classes.active : undefined}>Словарь</NavLink>
        </div>
    </div>
    
)
}

export default TypeBar