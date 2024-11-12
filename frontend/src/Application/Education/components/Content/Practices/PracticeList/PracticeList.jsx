import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import practices from '../practices';
import classes from './PracticeList.module.css';

const PracticeList = () => {
    const containerRef = useRef(null);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setScrollLeft(container.scrollLeft);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const isAtStart = scrollLeft === 0;
    const isAtEnd = containerRef.current && (scrollLeft >= (containerRef.current.scrollWidth - containerRef.current.offsetWidth - 20));

    return (
        <div className={classes.practiceList}>
            {practices.practices.map(group => (
                <div key={group.group} className={classes.group}>
                    <h3 className={classes.groupTitle}>{group.group}</h3>
                    <div 
                        className={classes.practicesContainer} 
                        ref={containerRef}
                        style={{
                            maskImage: `linear-gradient(to right, ${isAtStart ? 'black' : 'transparent'}, black 20px, black 90%, ${isAtEnd ? 'black' : 'transparent'})`,
                            WebkitMaskImage: `linear-gradient(to right, ${isAtStart ? 'black' : 'transparent'}, black 20px, black 90%, ${isAtEnd ? 'black' : 'transparent'})`
                        }}
                    >
                        {group.items.map(practice => (
                            <div key={practice.id} className={classes.practiceCard}>
                                <Link to={`/education/practices/${practice.title.replace(/ /g, '-')}`} className={classes.practiceLink}>
                                  <h4 className={classes.practiceTitle}>{practice.title}</h4>
                                 </Link>
                                <p className={classes.practiceDescription}>{practice.description}</p>
                                <button className={classes.startButton}>Пройти обучение</button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PracticeList;