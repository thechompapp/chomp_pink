import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const Navbar = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <nav className="bg-[#D1B399] p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">
          DOOF
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/lists/my-lists" className="text-white hover:text-[#b89e89]">
            My Lists
          </Link>
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center text-white hover:text-[#b89e89]"
            >
              <Settings size={20} className="mr-2" />
              Settings
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-gray-800 hover:bg-[#D1B399] hover:text-white"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Pending
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;