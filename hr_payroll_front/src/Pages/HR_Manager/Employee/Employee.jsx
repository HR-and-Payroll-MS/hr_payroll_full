import { Outlet } from 'react-router-dom';
import DetailEmployee from './Employee_Sub/DetailEmployee';
import Directory from './Employee_Sub/Directory';
import ManageEmployee from './Employee_Sub/ManageEmployee';

export default function Employee() {
  return (
    <>
      <Outlet />
      {/* <Directory/> */}
      {/* <ManageEmployee/> */}
      {/* <DetailEmployee/> */}
    </>
  );
}
