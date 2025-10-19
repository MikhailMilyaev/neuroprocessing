import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import UserStore from './store/UserStore.js';
import '../styles/main.css';
import { Context } from './utils/context.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Context.Provider value={{ user: new UserStore() }}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Context.Provider>
);
