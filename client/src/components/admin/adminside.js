import React from "react";
import { Link } from "react-router-dom";
import "../../css/adminbar.css";
import { useNavigate, NavLink } from "react-router-dom";
import { BiCPlusPlus } from "react-icons/bi";
import { RxDashboard } from "react-icons/rx";
import {
  AiOutlineUserAdd,
  AiOutlineUnorderedList,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { BiCartAdd, BiPackage, BiLogOut } from "react-icons/bi";
import { GiHealingShield } from "react-icons/gi";

const Sidebar = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    // setIsLoggedIn(false);
    navigate("/login");
  };
  // <BsGridAlt size={28} color={"#FF0000"} />
  return (
    <div className="sidebar">
      <div className="logo-details">
        <i className="bx bxl-c-plus-plus"></i>
        <span className="logo_name">Organic Healtcare</span>
      </div>
      <ul className="nav-links">
        <li>
          <a href="/admin" className="active">
            <i className="bx bx-box">
              <RxDashboard />
            </i>
            <span className="links_name">Dashboard</span>
          </a>
        </li>
        <li>
          <a href="/allproduct">
            <i className="bx bx-box">
              <AiOutlineShoppingCart />
            </i>
            <span className="links_name">Product</span>
          </a>
        </li>
        <li>
          <a href="/orders">
            <i className="bx bx-list-ul">
              <AiOutlineUnorderedList />
            </i>
            <span className="links_name">Order list</span>
          </a>
        </li>

        <li>
          <a href="/stock">
            <i className="bx bx-coin-stack">
              <BiPackage />
            </i>
            <span className="links_name">Stock</span>
          </a>
        </li>
        <li>
          <a href="/addhealth">
            <i className="bx bx-book-alt">
              <GiHealingShield />
            </i>
            <span className="links_name">Add HealthProblem</span>
          </a>
        </li>
        <li>
          <a href="/addproduct">
            <i className="bx bx-book-alt">
              <BiCartAdd />
            </i>
            <span className="links_name">Add Product</span>
          </a>
        </li>
        <li>
          <a href="/addadmin">
            <i className="bx bx-book-alt">
              <AiOutlineUserAdd />
            </i>
            <span className="links_name">Add Admin</span>
          </a>
        </li>

        <li className="log_out">
          <a onClick={handleLogout} href="/login">
            <i className="bx bx-log-out">
              <BiLogOut />
            </i>
            <span className="links_name">Log out</span>
          </a>
        </li>
      </ul>
    </div>
  );
  // return (
  //   <div className="sidebar">
  //     <div className="sidebar-header">
  //       <h3>Admin</h3>
  //     </div>
  //     <ul className="sidebar-menu">
  //       <li>
  //         <Link to="/admin">Users</Link>
  //       </li>
  //       <li>
  //         <Link to="/orders">Orders</Link>
  //       </li>
  //       <li>
  //         <Link to="/allproduct">Products</Link>
  //       </li>
  //       <li>
  //         <Link to="/addhealth">Add HealthProblem</Link>
  //       </li>
  //       <li>
  //         <Link to="/stock">Stock</Link>
  //       </li>
  //       <li>
  //         <Link to="/addadmin">Add Admin</Link>
  //       </li>
  //       <li>
  //         <Link to="/addproduct">Add Product</Link>
  //       </li>
  //     </ul>
  //   </div>
  // );
};

export default Sidebar;
