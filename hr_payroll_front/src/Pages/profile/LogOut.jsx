import React, { useEffect } from 'react';
import useAuth from '../../Context/AuthContext';
import Login from '../LoginPage';

function LogOut() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return <Login />;
}

export default LogOut;

// import React, { useEffect } from 'react'
// import useAuth from '../../../Context/AuthContext'
// import Login from '../../LoginPage';

// function LogOut() {
//     const {logout}= useAuth();
//     useEffect(()=>{logout},[])
//   return <Login/>;
// }

// export default LogOut
