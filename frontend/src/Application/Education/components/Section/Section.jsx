import React from 'react';
import classes from './Section.module.css';
import { Link } from 'react-router-dom';

const Section = ({ category, article }) => {

const articlePath = `/education/${category}/${encodeURIComponent(article.title)}`;

return (
<div className={classes.section} >
    <h3 className={classes.title}>{article.title}</h3>
    <p className={classes.description}>{article.description}</p>
    <Link to={articlePath} className={classes.btn}>Пройти обучение</Link>
</div>
);
};

export default Section;