"use client";

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    } 
  },
};

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const userName = user?.username?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-100/50 dark:bg-blue-900/20"
            style={{
              width: Math.random() * 200 + 100,
              height: Math.random() * 200 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(40px)',
            }}
            animate={{
              x: [0, (Math.random() - 0.5) * 100],
              y: [0, (Math.random() - 0.5) * 100],
              scale: [1, 1 + Math.random() * 0.3],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-16">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div 
            className="inline-flex items-center justify-center mb-6 p-3 rounded-full bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm"
            variants={item}
          >
            <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Mindful Journaling Redefined
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-6 leading-tight"
            variants={fadeInUp}
          >
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text">Tranquil</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            Your personal sanctuary for mindfulness and self-reflection. 
            Capture your thoughts, track your mood, and find your inner peace.
          </motion.p>

          <motion.div variants={fadeInUp}>
            {isAuthenticated ? (
              <div className="space-y-6">
                <p className="text-lg text-slate-700 dark:text-slate-300">
                  Welcome back, <span className="font-medium text-blue-600 dark:text-blue-400">{userName}</span>! 👋
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/chat"
                    className="group relative inline-flex items-center justify-center px-6 py-3.5 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <span className="relative z-10">Start Chatting</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <Link
                    href="/journal"
                    className="group relative inline-flex items-center justify-center px-6 py-3.5 overflow-hidden bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <span className="relative z-10">Journal Entries</span>
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-700/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="group relative inline-flex items-center justify-center px-6 py-3.5 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center px-6 py-3.5 overflow-hidden bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span className="relative z-10">Create Account</span>
                  <div className="absolute inset-0 bg-slate-50 dark:bg-slate-700/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            )}
          </motion.div>
          
          {/* Feature highlights */}
          <motion.div 
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
            variants={container}
          >
            {[
              {
                icon: '💭',
                title: 'Reflective Journaling',
                description: 'Capture your thoughts and feelings in a private, judgment-free space.'
              },
              {
                icon: '🧠',
                title: 'AI-Powered Insights',
                description: 'Gain deeper understanding of your emotions and patterns over time.'
              },
              {
                icon: '🌱',
                title: 'Mindfulness Tools',
                description: 'Access guided exercises to cultivate peace and self-awareness.'
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="p-6 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/70 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                variants={item}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
