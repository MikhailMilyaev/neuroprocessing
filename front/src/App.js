import Education from './pages/Main/Education/Education'
import Stories from "./pages/Main/Stories/Stories";
import Login from "./pages/Auth/Login/Login";
import SignUp from "./pages/Auth/SignUp/SignUp";
import {Routes, Route} from 'react-router-dom'
import Recovery from "./pages/Auth/Recovery/Recovery";
import ProtectedRoute from './components/Auth/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import Home from './pages/Lending/Home/Home';

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/recovery' element={<Recovery />} />
      <Route path='*' element={<NotFoundPage />}/>
      <Route path='/stories' element={<Stories />} />
      <Route path='/education' element={<Education />} />

      {/* <Route element={<ProtectedRoute />}>
        <Route path='/stories' element={<Stories />} />
        <Route path='/education' element={<Education />} />
      </Route> */}
    </Routes>
  );
}

export default App;
