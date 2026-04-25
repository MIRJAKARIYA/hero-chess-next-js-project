"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Users, Cpu, Trophy, MessageCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center px-4"
      >
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
          HERO <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">CHESS</span>
        </h1>
        <p className="text-xl md:text-2xl text-foreground/70 mb-12 max-w-2xl mx-auto">
          Experience the world's most elegant chess platform. Play online, 
          challenge friends locally, or sharpen your skills against our AI.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <Link href="/play/online">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              <Users size={20} /> Play Online
            </motion.button>
          </Link>
          
          <Link href="/play/local">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 glass text-foreground rounded-2xl font-bold flex items-center gap-2"
            >
              <Play size={20} /> Local Game
            </motion.button>
          </Link>

          <Link href="/play/computer">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border border-border rounded-2xl font-bold flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              <Cpu size={20} /> Vs Computer
            </motion.button>
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 z-10"
      >
        <Feature icon={<Trophy className="text-accent" />} label="Tournaments" />
        <Feature icon={<MessageCircle className="text-primary" />} label="Real-time Chat" />
        <Feature icon={<Users className="text-secondary" />} label="Active Community" />
        <Feature icon={<Play className="text-foreground" />} label="Smooth UI" />
      </motion.div>

      <div className="mt-20 z-10 opacity-50 text-sm">
        Built with Next.js, Tailwind, and MongoDB
      </div>
    </div>
  );
}

function Feature({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 glass rounded-2xl animate-float">
        {icon}
      </div>
      <span className="font-medium text-foreground/60">{label}</span>
    </div>
  );
}
