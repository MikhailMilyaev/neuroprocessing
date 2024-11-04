import React, { useRef } from 'react';
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import SearchBar from './components/SearchBar/SearchBar';
import Section from './components/Section/Section';
import articles from './components/Articles/articles';
import classes from './Education.module.css';
import { useNavigate } from 'react-router-dom';

const Education = () => {
  const navigate = useNavigate();
  const articlesContainerRefs = useRef({});

  const handleArticleClick = (article, category) => {
    const encodedTitle = encodeURIComponent(article.title);
    navigate(`/education/${category}/${encodedTitle}`);
  };

  const handleNext = (category) => {
    const ref = articlesContainerRefs.current[category];
    if (ref) {
      const containerWidth = ref.offsetWidth;
      const sectionWidth = ref.firstChild?.offsetWidth || 0;
      const maxScroll = ref.scrollWidth - containerWidth;
      const gap = parseInt(getComputedStyle(ref).columnGap || '0');

      ref.scrollTo({
        left: Math.min(ref.scrollLeft + sectionWidth + gap, maxScroll),
        behavior: 'smooth'
      });
    }
  };

  const handlePrev = (category) => {
    const ref = articlesContainerRefs.current[category];
    if (ref) {
      const sectionWidth = ref.firstChild?.offsetWidth || 0;
      const gap = parseInt(getComputedStyle(ref).columnGap || '0');

      ref.scrollTo({
        left: Math.max(0, ref.scrollLeft - sectionWidth - gap),
        behavior: 'smooth'
      });
    }
  };


  return (
    <div className={classes.education}>
      <div className={classes.container}>
        <SearchBar />
        {articles.map(categoryData => (
          <div key={categoryData.category}>
            <h2>{categoryData.category}</h2>
            <div className={classes.articlesWrapper}>
              <div className={classes.navigationButtons}>
                <button onClick={() => handlePrev(categoryData.category)}><IoIosArrowBack /></button>
                <button onClick={() => handleNext(categoryData.category)}><IoIosArrowForward /></button>
              </div>
              <div
                className={classes.articlesContainer}
                ref={el => articlesContainerRefs.current[categoryData.category] = el}
                style={{ overflowX: 'auto', display: 'flex' }}
              >
                {categoryData.articles.map((article, index) => (
                  <div
                    key={index}
                    className={classes.articleItem}
                    style={{
                      marginRight: index < categoryData.articles.length - 1 ? '2rem' : '0'
                    }}
                  >
                     <Section
                      article={article}
                      category={categoryData.category}
                      onClick={() => handleArticleClick(article, categoryData.category)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Education;