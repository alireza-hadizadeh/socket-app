"use client";

import { useState, useEffect } from "react";
import { Mail, Zap, GitBranch, Smartphone, Send } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<any>({});

  useEffect(() => {
    // Countdown timer (30 days from now)
    const calculateTimeLeft = () => {
      const launchDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubscribed(true);
    setEmail("");
    setLoading(false);

    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="p-5 backdrop-blur-md bg-black/30 border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-lg">SocketHub</span>
            </div>
            <div className="text-sm text-gray-400">Real-time Communication Platform</div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-full">
              <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Coming Soon — v1.0 Launch</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Real-Time Communication
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">Redefined</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">A powerful Socket.io-based platform connecting Flutter mobile apps, Laravel backends, and modern web applications in real-time. Built with TypeScript, Tailwind CSS, and production-grade architecture.</p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 my-12">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 hover:border-purple-500/50 transition-all">
                <Smartphone className="w-8 h-8 mx-auto mb-4 text-purple-400" />
                <h3 className="font-bold mb-2">Multi-Platform</h3>
                <p className="text-sm text-gray-400">Flutter, Laravel, Web & more</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 hover:border-pink-500/50 transition-all">
                <Zap className="w-8 h-8 mx-auto mb-4 text-pink-400" />
                <h3 className="font-bold mb-2">Lightning Fast</h3>
                <p className="text-sm text-gray-400">WebSocket & polling support</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 hover:border-blue-500/50 transition-all">
                <GitBranch className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                <h3 className="font-bold mb-2">Production Ready</h3>
                <p className="text-sm text-gray-400">SQLite, error handling, logging</p>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="mb-16">
            <p className="text-center text-sm text-gray-400 mb-6">Official launch in:</p>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{String(item.value || 0).padStart(2, "0")}</div>
                  <div className="text-xs text-gray-500 mt-2">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Signup */}
          <div className="max-w-md mx-auto">
            <p className="text-center text-sm text-gray-400 mb-6">Be the first to access the admin panel</p>

            <form onSubmit={handleSubscribe} className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors" required />
                </div>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Notify Me
                    </>
                  )}
                </button>
              </div>
            </form>

            {subscribed && <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-center text-green-400 text-sm">Thanks for subscribing! 🎉</div>}
          </div>

          {/* Tech Stack */}
          <div className="mt-20 pt-16 border-t border-white/10">
            <p className="text-center text-sm text-gray-500 mb-8">Built with cutting-edge technology</p>
            <div className="flex flex-wrap justify-center gap-6 items-center text-sm text-gray-400">
              {["Socket.io", "Next.js", "TypeScript", "SQLite", "Flutter", "Laravel", "Tailwind CSS"].map((tech) => (
                <div key={tech} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:border-white/30 transition-colors">
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/50 backdrop-blur-md mt-20">
          <div className="max-w-6xl mx-auto px-6 py-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Real-Time Communication Platform. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
