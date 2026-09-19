import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  MessageSquareText,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Utensils,
  Plus,
  Trash2
} from 'lucide-react';

export default function TextLoggingView({ meals, onAddLoggedMeal }) {
  const [inputText, setInputText] = useState("I ate 2 rotis, 3 boiled eggs, and 150 grams of chicken breast for lunch");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState(null);

  const samplePrompts = [
    "2 rotis, 1 bowl dal tadka, and 100g paneer tikka",
    "1 dosa with coconut chutney and 1 cup sambar",
    "50g oats cooked in milk with 10g almonds and 1 banana",
    "150g grilled chicken breast with brown rice and cucumber salad"
  ];

  const handleParseText = () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParsedItems(null);

    setTimeout(() => {
      setIsParsing(false);
      // Simulated AI Natural Language Parser Output
      setParsedItems({
        mealCategory: "Lunch",
        items: [
          { name: "Whole Wheat Roti", qty: "2 pieces (60g flour)", calories: 180, protein: 6, carbs: 36, fats: 2 },
          { name: "Boiled Eggs", qty: "3 whole eggs", calories: 210, protein: 18, carbs: 1.5, fats: 15 },
          { name: "Chicken Breast", qty: "150g raw (~115g cooked)", calories: 245, protein: 44, carbs: 0, fats: 5 }
        ]
      });
    }, 1200);
  };

  const calculateTotal = () => {
    if (!parsedItems) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return parsedItems.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fats: acc.fats + item.fats
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const totals = calculateTotal();

  const handleSaveToLog = () => {
    if (parsedItems && onAddLoggedMeal) {
      onAddLoggedMeal({
        id: `text-log-${Date.now()}`,
        category: parsedItems.mealCategory,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        name: `Quick Log: ${parsedItems.items.map(i => i.name).join(', ')}`,
        rawVsCooked: "Natural Language AI Entry",
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
        isCompleted: true
      });
      alert("Meal logged to your daily nutrition timeline!");
      setParsedItems(null);
      setInputText("");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Natural Language Food Logger
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Text-Based Food Logging</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Type what you ate in plain English or Hindi food names. REPP AI parses quantities and macros instantly.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-4">
        <label className="block text-xs font-bold text-[#E2E8F0] uppercase tracking-wider">Describe Your Meal</label>
        <div className="relative">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. I ate 2 rotis, 3 boiled eggs, and 150 grams of chicken breast for lunch"
            className="w-full bg-[#191C28] border border-[#2D3245] focus:border-[#C6FF00] rounded-2xl p-4 text-sm text-white focus:outline-none resize-none"
          />
          <button
            onClick={handleParseText}
            disabled={isParsing || !inputText.trim()}
            className="absolute bottom-4 right-4 px-4 py-2 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isParsing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isParsing ? 'Parsing...' : 'Parse Meal'}</span>
          </button>
        </div>

        {/* Quick Sample Suggestions */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Try sample text inputs:</span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(prompt)}
                className="text-xs bg-[#191C28] hover:bg-[#222636] text-[#94A3B8] hover:text-white border border-[#2D3245] px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parsed AI Results */}
      {parsedItems && (
        <div className="bg-[#12141D] border border-[#C6FF00]/40 rounded-3xl p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#2D3245]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C6FF00]" />
              <h3 className="text-base font-extrabold text-white">AI Recognized Food Items</h3>
            </div>
            <span className="text-xs font-bold text-black bg-[#C6FF00] px-3 py-1 rounded-full uppercase">
              {parsedItems.mealCategory}
            </span>
          </div>

          <div className="space-y-2">
            {parsedItems.items.map((item, i) => (
              <div key={i} className="p-3 bg-[#191C28] rounded-xl border border-[#2D3245] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-[10px] text-[#94A3B8]">{item.qty}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-white">{item.calories} kcal</div>
                  <div className="text-[10px] text-[#C6FF00]">{item.protein}g P • {item.carbs}g C • {item.fats}g F</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#94A3B8] font-bold uppercase block">Parsed Total</span>
              <span className="text-xl font-black text-white">{totals.calories} kcal</span>
            </div>
            <div className="text-right text-xs font-bold text-[#C6FF00]">
              {totals.protein}g P • {totals.carbs}g C • {totals.fats}g F
            </div>
          </div>

          <button
            onClick={handleSaveToLog}
            className="w-full py-3 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Save to Daily Food Log
          </button>
        </div>
      )}

      {/* Timeline View of Logged Meals */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-extrabold text-white">Daily Food Log Timeline</h3>
        <div className="space-y-3">
          {meals.map((m) => (
            <div key={m.id} className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Utensils className="w-4 h-4 text-[#C6FF00]" />
                <div>
                  <div className="font-bold text-white">{m.name}</div>
                  <div className="text-[10px] text-[#94A3B8]">{m.category} • {m.time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-white">{m.calories} kcal</div>
                <div className="text-[10px] text-[#C6FF00]">{m.protein}g Protein</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MedicalDisclaimer compact={true} />
    </div>
  );
}
