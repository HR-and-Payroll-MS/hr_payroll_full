import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../Context/AuthContext';
import { getLocalData } from '../Hooks/useLocalStorage';
import DashboardSkeleton from '../animations/DashboardSkeleton';

// Context Providers for Authenticated Users
import { SocketProvider } from "../Context/SocketProvider";
import { NotificationProvider } from "../Context/NotificationProvider";
import { ProfileProvider } from "../Context/ProfileContext";
import { TableProvider } from "../Context/TableContext";
import { NetworkProvider } from '../Context/NetworkContext';
import { AnnouncementProvider } from '../Context/AnnouncementContext';
import { DataContextProvider } from '../Context/DataContextProvider';

export default function ProtectedRoutes({ allowedRoles }) {
  const { auth, setAuth, isAuthLoading } = useAuth();

  // 1. Sync local storage with Auth State on refresh
  useEffect(() => {
    if (!auth?.user && getLocalData('role') && getLocalData('id')) {
      const data = {
        accessToken: localStorage.getItem('access'),
        user: {
          role: getLocalData('role'),
          id: getLocalData('id'),
        },
      };
      setAuth({ accessToken: data.accessToken, user: data.user });
    }
  }, [auth, setAuth]);

  // 2. Show Skeleton while checking session
  if (isAuthLoading) {
    return <DashboardSkeleton />;
  }

  // 3. Redirect to login if no user is found
  if (!auth?.user) {
    console.log('No auth user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // 4. Check if the user's role is allowed for this route
  const hasAccess = allowedRoles.includes(auth?.user?.role);
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. SUCCESS: Wrap the protected content in Data Providers.
  // These providers will ONLY mount now, preventing 401s on the login page.
  return (
    <SocketProvider>
      <NetworkProvider>
        <NotificationProvider>
          <AnnouncementProvider>
            <ProfileProvider>
              <DataContextProvider>
                <TableProvider>
                  <Outlet /> 
                </TableProvider>
              </DataContextProvider>
            </ProfileProvider>
          </AnnouncementProvider>
        </NotificationProvider>
      </NetworkProvider>
    </SocketProvider>
  );
}




// import React, { useEffect } from 'react';
// import { Navigate, Outlet } from 'react-router-dom';
// import useAuth from '../Context/AuthContext';
// import { getLocalData } from '../Hooks/useLocalStorage';
// import DashboardSkeleton from '../animations/DashboardSkeleton';

// export default function ProtectedRoutes({ allowedRoles }) {
//   const { auth, setAuth, isAuthLoading } = useAuth();

//   useEffect(() => {
//     if (!auth?.user && getLocalData('role') && getLocalData('id')) {
//       const data = {
//         accessToken: localStorage.getItem('access'),
//         user: {
//           role: getLocalData('role'),
//           id: getLocalData('id'),
//         },
//       };
//        setAuth({accessToken:data.accessToken,user:data.user});
//     }
//   }, [auth]);

//   if (isAuthLoading) {
//     return <DashboardSkeleton/> 
//   }

//   if (!auth?.user) {
//     console.log('No auth user, redirecting to login');
//     return <Navigate to="/login" replace />;
//   }

//   if (!allowedRoles.includes(auth?.user?.role)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return <Outlet />;
// }