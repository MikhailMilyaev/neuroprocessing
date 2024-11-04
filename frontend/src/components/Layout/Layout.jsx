import React from 'react';
import classes from './Layout.module.css';
import { Link, NavLink, Outlet } from 'react-router-dom'; 

const Layout = () => {
  return (
    <>
      <div className={classes.layout}>
        <Link to='/' className={classes.brand}>Neuroprocessing</Link>
        <div className={classes.container}>
          <div className={classes.layoutLinks}>
            <NavLink to="history" end className={({ isActive }) => isActive ? classes.active : undefined}>Истории</NavLink>
            <NavLink to="ideas" end className={({ isActive }) => isActive ? classes.active : undefined}>Идеи</NavLink>
            <NavLink to="education" end className={({ isActive }) => isActive ? classes.active : undefined}>Обучение</NavLink>
            <NavLink to="community" end className={({ isActive }) => isActive ? classes.active : undefined}>Сообщества</NavLink>
          </div>
        </div>
          <div className={classes.settings}>
            <span>Настройки</span>
          </div>
      </div>

      <Outlet />
    </>
  );
};

export default Layout;