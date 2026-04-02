import { useNavigate, useLocation } from "react-router-dom";
import BerryLogo from "./BerryLogo";

const navItems = [
  { label: "Explore", icon: "🔍", path: "/explore" },
  { label: "Matches", icon: "💕", path: "/matches" },
  { label: "Chat", icon: "💬", path: "/chat" },
  { label: "Profile", icon: "👤", path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-berry-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-[4px] active:scale-95 transition-transform"
            >
              <span className="text-[var(--text-lg)]">{item.icon}</span>
              <span className={`text-[var(--text-xs)] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
