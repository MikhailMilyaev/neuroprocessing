import React, {useState} from 'react'
import SearchBar from './components/SearchBar/SearchBar'
import Section from './components/Section/Section';
import classes from './Education.module.css'

const Education = () => {
  const [showAll, setShowAll] = useState(false);

  const handleShowAllClick = () => {
    setShowAll(true)
  }

  const handleShowLessClick = () => {
    setShowAll(false)
  }

  const sections = [
    {
      title: "Фундаментальные практики",
      articles: [
        { title: 'Сравнение важности', description: 'Снизьте психоэмоциональное напряжение возникшее в следствии обладании фиксированной идеи, сравнивая ее важность с другими идеями. Это позволит объективно оценить её влияние на вашу реальность.', isCompleted: false },
        { title: 'Хорошо - Плохо', description: 'Описание 2', isCompleted: false },
        { title: 'Парадигма достижения цели', description: 'Описание 3', isCompleted: false },
      ],
    },
    {
      title: "Основы",
      articles: [
        { title: `Обучение разделу "Истории"`, description: 'Описание 1', isCompleted: false },
        { title: `Обучение разделу "Идеи"`, description: 'Описание 2', isCompleted: false },
        { title: `Обучение разделу "Сообщества"`, description: 'Описание 3', isCompleted: false },
      ],
    },
];

  return (
    <div className={classes.container}>
      <SearchBar />
      {sections.map((section, index) => (
      <div key={index} className={classes.sectionContainer}>
        <h2 className={classes.sectionTitle}>{section.title}</h2>
        <div className={classes.articlesContainer}>
          {section.articles.slice(0, showAll ? section.articles.length : 2).map((article, articleIndex) => (
          <Section
          key={articleIndex}
          title={article.title}
          description={article.description}
          isCompleted={article.isCompleted}/>))}
        </div>
        <div className={classes.buttonsContainer}>
          {!showAll && section.articles.length > 2 && (
          <button className={classes.showMoreButton} onClick={handleShowAllClick}>Показать все</button>
          )}
          {showAll && (
          <button className={classes.showLessButton} onClick={handleShowLessClick}>Скрыть</button>
          )}
        </div>
    </div>
  ))}
</div>
);
};
export default Education;