import React, { useState } from 'react';
import SearchBar from './components/SearchBar/SearchBar';
import Section from './components/Section/Section';
import articles from './components/Articles/articles';
import classes from './Education.module.css';
import { useNavigate } from 'react-router-dom'; 


const Education = () => {
  const navigate = useNavigate(); 
  const [showArticlesAll, setShowArticlesAll] = useState({});

  const handleToggleCategory = (category) => {
    setShowArticlesAll(prevState => ({
      ...prevState,
      [category]: !prevState[category]
    }));
  };

 const handleArticleClick = (article, category) => {
    const encodedTitle = encodeURIComponent(article.title)
    navigate(`/education/${category}/${encodedTitle}`); 
  };

  return (
    <div className={classes.container}>
      <SearchBar />
        <>
          {articles.map(categoryData => {
            const isShowAll = showArticlesAll[categoryData.category] || false;
            return (
              <div key={categoryData.category}>
                <h2>{categoryData.category}</h2>
                <div className={classes.articlesContainer}>
                  {categoryData.articles.slice(0, isShowAll ? categoryData.articles.length : 2).map((article, index) => (
                    <Section
                      key={index}
                      article={article}
                      category={categoryData.category}
                      onClick={() => handleArticleClick(article, categoryData.category)}
                    />
                  ))}
                </div>
                {categoryData.articles.length > 2 && (
                  <span className={classes.buttonsContainer}>
                    <button className={classes.showArticlesAll} onClick={() => handleToggleCategory(categoryData.category)}>
                      {isShowAll ? "Скрыть" : "Показать все"}
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </>
    </div>
  );
};

export default Education;