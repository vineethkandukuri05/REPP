import React, { useState, useRef, useEffect } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Lightbulb,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function AskReppView({ userProfile, chatHistory, onSendMessage }) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState(chatHistory || []);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const suggestedPrompts = [
    "What should I eat for dinner?",
    "Replace chicken with another protein source.",
    "I missed my workout. What should I do?",
    "How can I increase my protein intake?",
    "Adjust my plan for next week.",
    "Analyze my progress."
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Append User Message
    const userMsg = {
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    // Contextual AI Response Generator
    setTimeout(() => {
      let aiReply = "I am analyzing your query with your REPP profile parameters...";

      const lower = query.toLowerCase();

      if (lower.includes("dinner") || lower.includes("eat")) {
        aiReply = `Based on your remaining macros today, I recommend: 150g grilled chicken breast or 100g paneer with 1 cup brown rice and stir-fried green beans. This yields ~32g protein and 450 kcal.`;
      } else if (lower.includes("replace chicken") || lower.includes("protein source")) {
        aiReply = `Great alternative options for 150g raw chicken breast (~31g protein):
1) 200g Low-fat Paneer (28g P)
2) 60g Dry Soya Chunks (31g P - budget friendly ₹15)
3) 4 Whole Eggs + 2 Whites (26g P)
4) 150g Basa or Rohu Fish Fillet (29g P).`;
      } else if (lower.includes("missed workout") || lower.includes("missed")) {
        aiReply = `No stress, Alex! Consistency over time matters more than one day.
Option A: Shift today's Upper Body Hypertrophy session to tomorrow and push rest day to Sunday.
Option B: Perform a condensed 35-minute push/pull circuit today at home.`;
      } else if (lower.includes("increase my protein") || lower.includes("protein intake")) {
        aiReply = `To hit your 155g protein target consistently without overeating calories:
• Add 25g soya chunks to your lunch dal (+13g protein)
• Replace afternoon biscuit snack with 3 boiled egg whites (+11g protein)
• Include 100g Greek yogurt or curd after dinner (+10g protein).`;
      } else if (lower.includes("adjust") || lower.includes("next week")) {
        aiReply = `Your 30-day weight trend shows a steady -2.1kg drop and waist reduction of 2cm. For next week, we will adjust calories slightly from 2,200 to 2,150 kcal while keeping your protein target firm at 155g.`;
      } else if (lower.includes("analyze my progress") || lower.includes("progress")) {
        aiReply = `You are performing exceptionally well! 94% protein adherence, 7-day active streak, and -2.1kg fat reduction with zero muscle loss. Your arm circumference has remained 38cm while waist decreased 2cm.`;
      } else {
        aiReply = `Got it, Alex! I've noted that in your REPP adaptive log. Based on your current Body Recomposition goal and ${userProfile.workoutLocation}, I'll ensure your meal plan and workout recovery remain balanced.`;
      }

      const aiMsg = {
        sender: "ai",
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center border border-[#C6FF00]/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>Ask REPP — AI Fitness Coach</span>
              <span className="text-[10px] font-extrabold bg-[#C6FF00] text-black px-2 py-0.5 rounded-md">Live</span>
            </h2>
            <p className="text-xs text-[#94A3B8]">Context-aware coaching remembering your goals, budget, and Indian food preferences.</p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts Pills */}
      <div className="shrink-0 space-y-2">
        <span className="text-[11px] font-bold text-[#94A3B8] uppercase flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-[#C6FF00]" /> Suggested Coach Prompts:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs bg-[#12141D] hover:bg-[#191C28] text-white border border-[#2D3245] hover:border-[#C6FF00] px-3.5 py-1.5 rounded-xl transition cursor-pointer"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 overflow-y-auto space-y-4">
        {messages.map((m, index) => {
          const isAI = m.sender === 'ai';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isAI ? 'bg-[#C6FF00] text-black' : 'bg-[#191C28] text-white border border-[#2D3245]'
                }`}
              >
                {isAI ? <Bot className="w-4 h-4 text-black" /> : <User className="w-4 h-4 text-white" />}
              </div>

              <div
                className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                  isAI
                    ? 'bg-[#191C28] border border-[#2D3245] text-white'
                    : 'bg-[#C6FF00] text-black font-semibold'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                <div className={`text-[9px] font-mono text-right ${isAI ? 'text-[#94A3B8]' : 'text-black/70'}`}>
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C6FF00] text-black flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-[#191C28] border border-[#2D3245] rounded-2xl text-xs text-[#94A3B8] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C6FF00] animate-spin" /> Coach REPP is crafting response...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Box */}
      <div className="shrink-0 space-y-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask REPP about meal swaps, missing workouts, protein sources, or progress..."
            className="flex-1 bg-[#12141D] border border-[#2D3245] focus:border-[#C6FF00] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-6 py-3.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-2xl shadow transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4 fill-black" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <MedicalDisclaimer compact={true} />
      </div>
    </div>
  );
}
