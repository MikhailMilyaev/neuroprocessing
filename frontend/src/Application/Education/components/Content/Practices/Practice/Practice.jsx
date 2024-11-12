import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classes from './Practice.module.css';
import { IoMdClose } from "react-icons/io";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ErrorPage from './../../../../../../ErrorPage'
import practices from '../practices';



const Practice = () => {
    const { practiceSlug } = useParams();
    const navigate = useNavigate(); 
    const practiceTitle = decodeURIComponent(practiceSlug.replace(/-/g, ' '));
    const practice = practices.practices.flatMap(group => group.items).find(p => p.title === practiceTitle);

    if (!practice) {
        return <ErrorPage />;
    }


 const handleClose = () => {
     navigate(-1)

 };

    return (
        <div className={classes.container}>
            <IoMdClose className={classes.closeBtn} onClick={handleClose} />
            <h1>{practice.title}</h1> 
            <ReactMarkdown className={classes.content} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {practice.content}    
            </ReactMarkdown>
        </div>
    );
};

export default Practice;