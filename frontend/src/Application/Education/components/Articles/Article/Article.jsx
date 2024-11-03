import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import articles from '../articles';
import ErrorPage from '../../../../../ErrorPage';
import classes from './Article.module.css'
import { IoMdClose } from "react-icons/io";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Link } from 'react-router-dom';

const Article = () => {
  const { category, title } = useParams();
  const navigate = useNavigate();

  const categoryData = articles.find(item => item.category === category);

  if (!categoryData) {
    return <ErrorPage />; 
  }

  const article = categoryData.articles.find(item => item.title === title);

  if (!article) {
    return <ErrorPage />;
  }

  const handleClose = () => {
    navigate('/education'); 
  };

  return (
    <>
    <div className={classes.container}>
        <IoMdClose className={classes.closeBtn} onClick={handleClose} />
        <h1 className={classes.title}>{article.title}</h1>
      <ReactMarkdown className={classes.content} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {article.content}
      </ReactMarkdown>
    </div>
    <div className={classes.errorContainer}>
      <Link className={classes.error}>Нашли ошибку?</Link>
    </div>
</>
  );
};

export default Article;