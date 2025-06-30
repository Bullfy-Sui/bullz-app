import { Outlet } from "react-router";

const RootProvider = () => {
  return (
    <div className="max-w-[26.875rem] w-full mx-auto">
      <Outlet />
    </div>
  );
};

export default RootProvider;
