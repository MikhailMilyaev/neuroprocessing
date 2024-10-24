import React, { useState, useEffect } from 'react';
import classes from './NavBar.module.css';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';

const NavBar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={classes.navBar}>
      <div className={classes.container}>
        <Link to="#" smooth={true} className={classes.brandName}>NEUROPROCESSING</Link>
        {isMobile ? null : (
          <div className={classes.navLinks}>
            <Link to="" smooth={true}>Идеи</Link>
            <Link to="" smooth={true}>Методика</Link>
            <Link to="" smooth={true}>Практики</Link>
            <Link to="" smooth={true}>Автор</Link>
          </div>
        )}
        <div className={classes.authButtons}>
        <Link to="/login"><button className={classes.loginButton}>ВОЙТИ</button></Link>
        {isMobile && (
          <button
          className={classes.menuButton}
          onClick={toggleMenu}
          aria-label="Toggle Menu">
          <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} /> 
        </button>
        )} 
        </div>
      </div>
      {isMobile && isMenuOpen && (
        <div className={classes.mobileMenu}>
          <Link to="" smooth={true} onClick={toggleMenu}>Идеи</Link>
          <Link to="" smooth={true} onClick={toggleMenu}>Методика</Link>
          <Link to="" smooth={true} onClick={toggleMenu}>Практики</Link>
          <Link to="" smooth={true} onClick={toggleMenu}>Автор</Link>
        </div>
        )}
    </div>
  );
};

export default NavBar;