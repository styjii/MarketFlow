import React, { useState } from "react";
import { Form, NavLink, href } from "react-router";
import { LogIn, UserPlus, LogOut, Menu, X } from "lucide-react";
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
        `transition-all hover:text-primary relative py-1 ${
          isActive
            ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary"
            : "opacity-70"
        }`
      }
    >
      {label}
    </NavLink>
  </li>
);

const AuthButtons: React.FC<{ user: User | null; onAction?: () => void }> = ({ user, onAction }) => (
  <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-base-content/20 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
    {user ? (
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex flex-col md:items-end">
          <span className="text-xs font-bold text-primary leading-none">
            {user.user_metadata?.username || "Utilisateur"}
          </span>
          <span className="text-[10px] opacity-50 lowercase">{user.email}</span>
        </div>
        <Form method="post" action={href("/auth/logout")} className="ml-auto md:ml-0">
          <button
            type="submit"
            name="intent"
            value="logout"
            onClick={onAction}
            className="btn btn-circle btn-ghost btn-sm text-error hover:bg-error/10"
          >
            <LogOut size={18} />
          </button>
        </Form>
      </div>
    ) : (
      <div className="flex gap-2 w-full md:w-auto">
        <NavLink
          to={href("/auth/login")}
          onClick={onAction}
          className="btn btn-ghost btn-sm flex-1 md:flex-none"
        >
          <LogIn size={18} />
          Connexion
        </NavLink>
        <NavLink
          to={href("/auth/register")}
          onClick={onAction}
          className="btn btn-primary btn-sm flex-1 md:flex-none"
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
      <div className="flex justify-between items-center px-4 sm:px-6 py-3">
        <NavLink to={href("/")} className="text-xl font-black text-primary tracking-tighter">
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
          className="md:hidden btn btn-ghost btn-sm btn-circle"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden px-4 pb-4 bg-base-200/95 backdrop-blur-md border-t border-base-content/10">
          <ul className="flex flex-col gap-3 text-sm font-medium pt-4">
            <NavItem to={href("/")} label="Accueil" onClick={close} />
            {!!user && <NavItem to={href("/orders")} label="Mes commandes" onClick={close} />}
            {!!user && <NavItem to={href("/notifications")} label="Notifications" onClick={close} />}
            {isAuthorized && <NavItem to={href("/dashboard/profile")} label="Dashboard" onClick={close} />}
          </ul>
          <AuthButtons user={user} onAction={close} />
        </div>
      )}
    </nav>
  );
});