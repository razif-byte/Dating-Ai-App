'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, Flame, Sparkles, MessageCircle, User, Settings, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Types
interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  sentiment?: string;
  chemistry?: number;
}

export default function DatingApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [overallChemistry, setOverallChemistry] = useState(50);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // In AI Studio, GEMINI_API_KEY is often available as process.env.GEMINI_API_KEY
      // even in the browser during dev for these specific applets.
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string || "" });
      
      const prompt = `You are a sophisticated dating assistant. 
      Analyze the user's message: "${input}"
      Provide a charming, natural response as if you are a potential partner or a helpful dating coach.
      Also, analyze the sentiment of the user's message.
      And decide how much "chemistry" this message builds (from -10 to +10).

      Return the response in JSON format:
      {
        "response": "your text response",
        "sentiment": "Positive/Neutral/Negative",
        "chemistryChange": 5
      }`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(result.text || "{}");
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response || "I'm a bit speechless, but I'm listening...",
        timestamp: Date.now(),
        sentiment: data.sentiment,
        chemistry: data.chemistryChange,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setOverallChemistry((prev) => Math.min(100, Math.max(0, prev + (data.chemistryChange || 0))));
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback response
       setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: "I'm having a small moment... let's try that again?",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white font-sans selection:bg-pink-500/30">
      {/* Side Navigation (Desktop Hide) */}
      <nav className="hidden lg:flex w-20 flex-col items-center py-6 border-r border-white/10 bg-[#0a0a0a] gap-8">
        <Heart className="w-8 h-8 text-pink-500 fill-pink-500/20" />
        <div className="flex flex-col gap-6 flex-1">
          <button className="p-3 bg-white/5 rounded-2xl text-pink-500"><MessageCircle /></button>
          <button className="p-3 text-white/40 hover:text-white transition-colors"><User /></button>
          <button className="p-3 text-white/40 hover:text-white transition-colors"><Settings /></button>
        </div>
        <button className="p-3 text-white/40 hover:text-white transition-colors"><Info /></button>
      </nav>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">AI Dating Assistant</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-white/50 font-medium">AI is online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Chemistry Meter */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Chemistry Meter</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '50%' }}
                    animate={{ width: `${overallChemistry}%` }}
                    className="h-full bg-gradient-to-r from-orange-400 to-pink-500"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-pink-400">{overallChemistry}%</span>
              </div>
            </div>
            <button className="lg:hidden p-2 hover:bg-white/5 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6 opacity-80">
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 rotate-12">
                <Heart className="w-10 h-10 text-pink-500 fill-pink-500/20 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold italic serif">Start your journey.</h2>
                <p className="text-white/40 mt-2 text-sm">Say anything to start chatting with your AI-powered companion. We analyze chemistry in real-time.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {['"I love travelling..."', '"Tell me a joke"', '"Recommend a movie"', '"What\'s your vibe?"'].map((suggestion) => (
                  <button 
                    key={suggestion}
                    onClick={() => setInput(suggestion.replace(/"/g, ''))}
                    className="p-3 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] group relative ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div className={`
                  p-4 rounded-2xl shadow-xl
                  ${msg.role === 'user' 
                    ? 'bg-pink-600 text-white rounded-tr-none' 
                    : 'bg-[#1a1a1a] border border-white/10 text-white/90 rounded-tl-none'}
                `}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  
                  {msg.sentiment && (
                    <div className="mt-2 flex items-center gap-2 pt-2 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-pink-400">
                       <Flame className="w-3 h-3" />
                       Sentiment: {msg.sentiment}
                    </div>
                  )}
                </div>
                <span className={`text-[9px] mt-1 block px-1 text-white/30 uppercase font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] border border-white/10 p-4 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        {/* Input Area */}
        <footer className="p-4 border-t border-white/10 bg-[#0a0a0a]">
          <div className="max-w-4xl mx-auto flex gap-2 items-center bg-white/5 p-1 rounded-2xl border border-white/10 focus-within:border-pink-500/50 transition-all">
            <input
              className="flex-1 bg-transparent border-none outline-none p-3 text-sm placeholder:text-white/20"
              placeholder="Type your charm here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`
                p-3 rounded-xl transition-all
                ${!input.trim() || isTyping 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-pink-500 hover:text-white shadow-lg active:scale-95'}
              `}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>

      {/* Right Panel - AI Insights (Desktop only) */}
      <aside className="hidden xl:flex w-80 flex-col border-l border-white/10 bg-[#0a0a0a] p-6 space-y-8 overflow-y-auto">
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black mb-4">AI Insight Engine</h3>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Match Accuracy</span>
              <span className="text-xs font-mono text-green-400">98.2%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="w-[98.2%] h-full bg-green-500" />
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed italic">
              "You seem to favor deep philosophical topics. Your connection is strengthening over intellectual curiosity."
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black mb-4">Live Analysis</h3>
          <div className="space-y-3">
             {[
               { label: 'Empathy Score', val: 85, color: 'bg-blue-500' },
               { label: 'Humor Level', val: 62, color: 'bg-yellow-500' },
               { label: 'Directness', val: 45, color: 'bg-purple-500' }
             ].map((stat) => (
               <div key={stat.label} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-white/60">{stat.label}</span>
                    <span>{stat.val}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${stat.val}%` }} className={`h-full ${stat.color}`} />
                  </div>
               </div>
             ))}
          </div>
        </section>

        <section className="mt-auto">
          <div className="p-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl border border-pink-500/20 text-center">
             <Flame className="w-8 h-8 text-pink-500 mx-auto mb-2" />
             <h4 className="text-sm font-bold">Hottest Match</h4>
             <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Available Premium-only</p>
             <button className="mt-3 w-full py-2 bg-pink-600 rounded-lg text-xs font-bold hover:bg-pink-500 transition-colors">Upgrade Now</button>
          </div>
        </section>
      </aside>
    </div>
  );
}
