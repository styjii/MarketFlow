import React, { useState } from "react";
import { Form, NavLink, href } from "react-router";
import { LogIn, UserPlus, LogOut, Menu, X, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export interface NavbarProps {
  user: User | null;
  isAuthorized: boolean;
}

const NavItem: React.FC<{ to: string; label: string; onClick?: () => void }> = ({ to, label, onClick }) => (
  <li>
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `transition-all duration-200 hover:text-primary relative py-1 ${
          isActive
            ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary"
            : "opacity-70 hover:opacity-100"
        }`
      }
    >
      {label}
    </NavLink>
  </li>
);

const LogoutButton: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);

  return (
    <Form
      method="post"
      action={href("/auth/logout")}
      onSubmit={() => {
        setLoading(true);
        onClose?.();
      }}
    >
      <button
        type="submit"
        name="intent"
        value="logout"
        disabled={loading}
        className="btn btn-circle btn-ghost btn-sm text-error hover:bg-error/10 transition-all duration-200"
      >
        {loading
          ? <Loader2 size={18} className="animate-spin" />
          : <LogOut size={18} />
        }
      </button>
    </Form>
  );
};

const AuthButtons: React.FC<{ user: User | null; onClose?: () => void }> = ({ user, onClose }) => (
  <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-base-content/20 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
    {user ? (
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex flex-col md:items-end">
          <span className="text-xs font-bold text-primary leading-none">
            {user.user_metadata?.username || "Utilisateur"}
          </span>
          <span className="text-[10px] opacity-50 lowercase">{user.email}</span>
        </div>
        <div className="ml-auto md:ml-0">
          <LogoutButton onClose={onClose} />
        </div>
      </div>
    ) : (
      <div className="flex gap-2 w-full md:w-auto">
        <NavLink
          to={href("/auth/login")}
          onClick={onClose}
          className="btn btn-ghost btn-sm flex-1 md:flex-none gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <LogIn size={18} />
          Connexion
        </NavLink>
        <NavLink
          to={href("/auth/register")}
          onClick={onClose}
          className="btn btn-primary btn-sm flex-1 md:flex-none gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} />
          S'inscrire
        </NavLink>
      </div>
    )}
  </div>
);

export const Navbar: React.FC<NavbarProps> = React.memo(function Navbar({ user, isAuthorized }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-base-200/80 backdrop-blur-md border-b border-base-content/10 shadow-sm">
      {/* ── Barre principale ── */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3">
        <NavLink
          to={href("/")}
          className="text-xl font-black text-primary tracking-tighter transition-opacity duration-200 hover:opacity-80"
        >
          Market Flow
        </NavLink>

        <div className="hidden md:flex items-center gap-8">
          <ul className="flex gap-6 text-sm font-medium">
            <NavItem to={href("/")} label="Accueil" />
            {!!user && <NavItem to={href("/orders")} label="Mes commandes" />}
            {!!user && <NavItem to={href("/notifications")} label="Notifications" />}
            {isAuthorized && <NavItem to={href("/dashboard/profile")} label="Dashboard" />}
          </ul>
          <AuthButtons user={user} />
        </div>

        <button
          className="md:hidden btn btn-ghost btn-sm btn-circle transition-transform duration-200 active:scale-90"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Menu"
        >
          {isOpen
            ? <X size={22} className="transition-transform duration-200 rotate-90" />
            : <Menu size={22} className="transition-transform duration-200" />
          }
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 bg-base-200/95 backdrop-blur-md border-t border-base-content/10">
          <ul className="flex flex-col gap-3 text-sm font-medium pt-4">
            <NavItem to={href("/")} label="Accueil" onClick={close} />
            {!!user && <NavItem to={href("/orders")} label="Mes commandes" onClick={close} />}
            {!!user && <NavItem to={href("/notifications")} label="Notifications" onClick={close} />}
            {isAuthorized && <NavItem to={href("/dashboard/profile")} label="Dashboard" onClick={close} />}
          </ul>
          <AuthButtons user={user} onClose={close} />
        </div>
      </div>
    </nav>
  );
});