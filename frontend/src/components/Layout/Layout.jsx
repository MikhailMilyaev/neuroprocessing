import React from 'react';
import classes from './Layout.module.css';
import { Link, NavLink, Outlet } from 'react-router-dom'; 
import { RxAvatar } from "react-icons/rx";

const Layout = () => {
  return (
    <>
      <div className={classes.layout}>
        <Link to='/' className={classes.brand}>NEUROPROCESSING</Link>
        <div className={classes.container}>
          <div className={classes.layoutLinks}>
            <NavLink to="history" end className={({ isActive }) => isActive ? classes.active : undefined}>Истории</NavLink>
            <NavLink to="ideas" end className={({ isActive }) => isActive ? classes.active : undefined}>Идеи</NavLink>
            <NavLink to="education" className={({ isActive }) => 
           isActive || window.location.pathname.startsWith('/education') ? classes.active : undefined}>Обучение</NavLink>
            <NavLink to="community" end className={({ isActive }) => isActive ? classes.active : undefined}>Сообщества</NavLink>
          </div>
        </div>
        <div className={classes.user}>
            <div className={classes.userInner}>
              <RxAvatar className={classes.avatar} />
              <span className={classes.userName}>Михаил</span>
              <span className={classes.subscription}>Proffesional</span>
            </div>
          </div>
      </div>

      <Outlet />
    </>
  );
};

export default Layout;