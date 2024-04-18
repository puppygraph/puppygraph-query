import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import HeaderDisplay from "./HeaderDisplay";

const userNavigation = [
  { name: "Sign out", href: "#" },
];

export default function SidebarLayout() {
  const { loggedIn, logout } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleMenuItemClick = (e, itemName, itemHref) => {
    e.preventDefault();
    if (itemName === "Sign out") {
      logout();
    }
    // Check if the href is an absolute URL
    else if (/^(?:[a-z]+:)?\/\//i.test(itemHref)) {
      // It's an absolute URL, open it in a new tab
      window.open(itemHref, "_blank");
    } else {
      // It's a relative URL, use navigate
      navigate(itemHref);
    }
  };

  return (
    <>
      <div>
        <div>
          <HeaderDisplay
            loggedIn={loggedIn}
            userNavigation={userNavigation}
            handleMenuItemClick={handleMenuItemClick}
          />
        </div>
      </div>
    </>
  );
}
