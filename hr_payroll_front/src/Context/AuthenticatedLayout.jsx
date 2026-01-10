import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Import your auth hook
import { SocketProvider } from "./SocketProvider";
import { NotificationProvider } from "./NotificationProvider";
import { ProfileProvider } from "./ProfileContext";
import { TableProvider } from "./TableContext";
import { NetworkProvider } from "./NetworkContext"

const AuthenticatedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading Session...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <SocketProvider>
      <NetworkProvider>
        <NotificationProvider>
          <ProfileProvider>
            <TableProvider>
              <Outlet /> 
            </TableProvider>
          </ProfileProvider>
        </NotificationProvider>
      </NetworkProvider>
    </SocketProvider>
  );
};

export default AuthenticatedLayout;