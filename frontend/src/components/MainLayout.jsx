import React, { useState, createContext, useContext } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const SidebarContext = createContext();
export const useSidebar = () => useContext(SidebarContext);

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex pt-[70px]">
          {/* <Sidebar /> */}
          <main
            className={`transition-all duration-300 ease-in-out w-full ${
              isSidebarOpen ? "md:ml-[220px]" : "ml-0"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default MainLayout;
