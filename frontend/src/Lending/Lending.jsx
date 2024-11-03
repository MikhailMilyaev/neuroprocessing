import React from 'react';
import NavBar from './NavBar/NavBar';
import Footer from './Footer/Footer';
import StartPage from './Pages/StartPage/StartPage';
import './Lending.css';

const Lending = () => {
  return (
    <div className="lending-container">
      <NavBar />
      <main className="content"> 
        <StartPage />
      </main>
      <Footer />
    </div>
  );
};

export default Lending;