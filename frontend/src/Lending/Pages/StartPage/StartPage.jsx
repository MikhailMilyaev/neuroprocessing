import React from 'react'
import classes from './StartPage.module.css'
import { Link } from 'react-router-dom';

const StartPage = () => {
    return (
      <div className={classes.container}>
        <div className={classes.content}> 
          <Link to='/login' className={classes.brand}>NEUROPROCESSING</Link>
          <div className={classes.description}>Используя точную технологию работы с разумом человек может самостоятельно избавиться от психологических проблем</div>
        </div>
      </div>
    );
  };

export default StartPage