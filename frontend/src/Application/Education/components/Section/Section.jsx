import React from 'react'
import classes from './Section.module.css'

const Section = ({ title, description, isCompleted }) => {
  return (
    <div className={classes.section}>
      <h3 className={classes.title}>{title}</h3>
      <p className={classes.description}>{description}</p>
      <button disabled={isCompleted}>
        {isCompleted ? "Пройдено" : "Пройти обучение"}
      </button>
    </div>
  );
};

export default Section;