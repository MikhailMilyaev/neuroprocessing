import React from 'react';
import { Link } from 'react-router-dom';
import { FaTelegramPlane } from "react-icons/fa";
import classes from './Footer.module.css';

const Footer = () => {
  return (
    <div className={classes.footer}>
      <div className={classes.container}>
        <Link to="#" smooth={true} className={classes.brandName}>NEUROPROCESSING</Link>
          <a href="https://t.me/pinky589" target="blank" rel="noopener noreferrer" className={classes.contact}>
              <div className={classes.iconTextWrapper}> <FaTelegramPlane className={classes.telegramIcon} />По всем вопросам</div>
          </a>
      </div>
    </div>
  );
};

export default Footer;