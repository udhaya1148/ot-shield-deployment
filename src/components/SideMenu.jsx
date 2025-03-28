import React, { useState } from "react";
import { BsFillArrowLeftCircleFill, BsChevronDown } from "react-icons/bs";
import { MdOutlineDashboard, MdOutlineSettings } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";
import { IoTerminal } from "react-icons/io5";

function SideMenu({ children }) {
  const [open, setOpen] = useState(false);
  const [activeMenus, setActiveMenus] = useState([]);

  const menus = [
    { name: "Home", icon: FaHome, link: "/home" },
    {
      name: "Dashboard",
      icon: MdOutlineDashboard,
      subItems: [
        { name: "ARP Table", link: "/arp" },
        { name: "Routes", link: "/routes" },
      ],
    },
    {
      name: "Settings",
      icon: MdOutlineSettings,
      subItems: [
        { name: "Network Configuration", link: "/networkconfiguration" },
        { name: "Add Static ARP", link: "/addarp" },
        { name: "Delete ARP", link: "/deletearp" },
      ],
    },
    { name: "Terminal", icon: IoTerminal, link: "/terminal" },
  ];

  const toggleMenu = () => {
    setOpen((prev) => {
      if (prev) setActiveMenus([]); // Close all submenus when collapsing
      return !prev;
    });
  };

  const handleMenuClick = (menuId) => {
    if (!open) {
      toggleMenu();
    }
    setActiveMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const renderMenuItems = (menuItems, parentId = "", level = 0) => {
    return menuItems.map((menu, index) => {
      const menuId = parentId ? `${parentId}-${index}` : `${index}`;
      return (
        <div key={menuId}>
          <div
            onClick={() => menu.subItems && handleMenuClick(menuId)}
            className="relative group flex items-center justify-between gap-3.5 font-bold p-2 pl-2 hover:bg-teal-400 hover:text-white rounded-lg cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {React.createElement(menu.icon || "div", { size: "20", className: "cursor-pointer" })}
              {!open && (
                <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 bg-gray-700 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap transition-opacity duration-200 z-50">
                  {menu.name}
                </span>
              )}
              <h2 className={`${!open && "hidden"} whitespace-pre`}>{menu.name}</h2>
            </div>
            {menu.subItems && open && (
              <BsChevronDown
                size={15}
                className={`transition-transform duration-300 ${activeMenus.includes(menuId) ? "rotate-180" : ""}`}
              />
            )}
          </div>
          {activeMenus.includes(menuId) && open && menu.subItems && (
            <div className="ml-5 space-y-2">
              {menu.subItems.map((subMenu, subIndex) => (
                <Link
                  key={subIndex}
                  to={subMenu.link}
                  className="block pl-4 py-1 text-black hover:text-white hover:bg-teal-500 rounded-lg"
                >
                  {subMenu.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={`${open ? "w-55" : "w-20"} duration-600 h-screen bg-gray-100 p-5`}>
      <div className={`py-2 hover:bg-teal-400 hover:text-white rounded-lg flex ${open ? "justify-end" : "items-center"}`}>
        <BsFillArrowLeftCircleFill
          size={30}
          className={`cursor-pointer transition-transform duration-300 ${!open && "rotate-180"}`}
          onClick={toggleMenu}
        />
      </div>
      <div className="mt-4 space-y-3 items-center">{renderMenuItems(menus)}</div>
    </div>
  );
}

export default SideMenu;
