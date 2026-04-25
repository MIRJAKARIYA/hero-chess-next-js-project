"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { LogOut, User, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm">H</div>
          HERO <span className="text-primary">CHESS</span>
        </Link>

        <div className="flex items-center gap-6">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm font-bold text-foreground/60 hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold">
                  {session.user.name?.[0]}
                </div>
                <span className="text-sm font-bold hidden md:block">{session.user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 text-sm font-bold hover:text-primary transition-colors flex items-center gap-2"
                >
                  <LogIn size={16} /> Login
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <UserPlus size={16} /> Register
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
