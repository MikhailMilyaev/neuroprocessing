import React,  {  useContext  } from  'react'; 
import  {  Navigate,  useLocation  } from 'react-router-dom'; 
import  {  AuthContext } from './AuthContext';


const  PrivateRoute = ({ children  }) =>  {  
const  { isAuth } =  useContext(AuthContext);
const  location =  useLocation();  


return isAuth ? (
    children 
   ) : ( 
   <Navigate to="/" state={{ from:  location  }} replace />  
 ); 
};
 
export default PrivateRoute;  