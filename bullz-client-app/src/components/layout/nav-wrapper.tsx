import { ReactNode } from "react";
import Header from "./header";
import NavBar from "./navbar";

const NavWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Header />
      <main className="pb-[4.5rem] mt-[4rem]">{children}</main>
      <NavBar />
    </>
  );
};

export default NavWrapper;
