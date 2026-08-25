import { Outlet } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import LandingFooter from "../components/landing/LandingFooter";

export const LandingLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <LandingNavbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingLayout;
