import React from 'react';
import SearchBar from './components/SearchBar/SearchBar';
import TypeBar from './components/TypeBar/TypeBar'
import classes from './Education.module.css';
import { Outlet }from 'react-router-dom';

const Education = () => {

    return (
        <div className={classes.education}>
            <div className={classes.container}>
                <SearchBar />
                <TypeBar />
                <Outlet />
            </div>
        </div>
    );
};

export default Education;