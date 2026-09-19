import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  Camera,
  MessageSquareText,
  Sparkles,
  Upload,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Send,
  Utensils,
  Plus,
  Clock,
  FileText
} from 'lucide-react';

export default function LogMealView({ meals, onAddLoggedMeal }) {
  const [activeSubTab, setActiveSubTab] = useState('photo'); // 'photo' | 'text'

  // Photo Scanner State
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [rawVsCookedState, setRawVsCookedState] = useState("cooked");

  // Text Logger State
  const [inputText, setInputText] = useState("I ate 2 rotis, 3 boiled eggs, and 150 grams of chicken breast for lunch");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState(null);

  // Sample Photo Presets
  const samplePresets = [
    {
      id: "preset-1",
      title: "Grilled Chicken & Brown Rice Bowl",
      imgUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      confidence: "96% High",
      detectedItems: [
        { name: "Grilled Chicken Breast", portion: "150g cooked", calories: 245, protein: 44, carbs: 0, fats: 5 },
        { name: "Steamed Brown Rice", portion: "150g cooked", calories: 180, protein: 4, carbs: 38, fats: 1.5 },
        { name: "Sauteed Broccoli & Peppers", portion: "100g", calories: 55, protein: 3, carbs: 8, fats: 2 }
      ]
    },
    {
      id: "preset-2",
      title: "Masala Dosa & Sambar Platter",
      imgUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
      confidence: "91% High",
      detectedItems: [
        { name: "Crispy Rice & Lentil Dosa", portion: "1 large (120g)", calories: 280, protein: 6, carbs: 46, fats: 9 },
        { name: "Vegetable Sambar", portion: "1 cup (200ml)", calories: 110, protein: 5, carbs: 16, fats: 3 },
        { name: "Coconut Chutney", portion: "2 tbsp (30g)", calories: 85, protein: 1, carbs: 3, fats: 8 }
      ]
    }
  ];

  const sampleTextPrompts = [
    "2 rotis, 1 bowl dal tadka, and 100g paneer tikka",
    "1 dosa with coconut chutney and 1 cup sambar",
    "50g oats cooked in milk with 10g almonds and 1 banana",
    "150g grilled chicken breast with brown rice and cucumber salad"
  ];

  // Photo Handlers
  const handleSelectPreset = (preset) => {
    setSelectedImage(preset.imgUrl);
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(preset);
    }, 1200);
  };

  const handleCustomUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setIsScanning(true);
      setScanResult(null);
      setTimeout(() => {
        setIsScanning(false);
        setScanResult(samplePresets[0]);
      }, 1200);
    }
  };

  const calculatePhotoTotal = () => {
    if (!scanResult) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return scanResult.detectedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fats: acc.fats + item.fats
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const handleConfirmPhotoMeal = () => {
    const totals = calculatePhotoTotal();
    if (onAddLoggedMeal && scanResult) {
      onAddLoggedMeal({
        id: `scanned-${Date.now()}`,
        category: "Lunch / Meal",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        name: scanResult.title,
        rawVsCooked: `Scanned via REPP Computer Vision (${rawVsCookedState})`,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
        isCompleted: true
      });
      alert("Meal successfully verified and logged into your daily nutrition journal!");
    }
  };

  // Text Handlers
  const handleParseText = () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParsedItems(null);
    setTimeout(() => {
      setIsParsing(false);
      setParsedItems({
        mealCategory: "Lunch",
        items: [
          { name: "Whole Wheat Roti", qty: "2 pieces (60g flour)", calories: 180, protein: 6, carbs: 36, fats: 2 },
          { name: "Boiled Eggs", qty: "3 whole eggs", calories: 210, protein: 18, carbs: 1.5, fats: 15 },
          { name: "Chicken Breast", qty: "150g raw (~115g cooked)", calories: 245, protein: 44, carbs: 0, fats: 5 }
        ]
      });
    }, 1000);
  };

  const calculateTextTotal = () => {
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

  const handleSaveTextMeal = () => {
    const totals = calculateTextTotal();
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
      alert("Meal logged to your daily food timeline!");
      setParsedItems(null);
      setInputText("");
    }
  };

  const photoTotals = calculatePhotoTotal();
  const textTotals = calculateTextTotal();

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> REPP Smart Nutrition Hub
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Log & Scan Meal</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Choose between <strong className="text-white">AI Photo Vision Scanning</strong> or <strong className="text-white">Natural Language Text Entry</strong>.
          </p>
        </div>

        {/* Sub-Tab Selector */}
        <div className="flex p-1.5 bg-[#191C28] border border-[#2D3245] rounded-2xl gap-1">
          <button
            onClick={() => setActiveSubTab('photo')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'photo'
                ? 'bg-[#C6FF00] text-black shadow'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" /> Photo Scanner
          </button>
          <button
            onClick={() => setActiveSubTab('text')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'text'
                ? 'bg-[#C6FF00] text-black shadow'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <MessageSquareText className="w-4 h-4" /> Text Log AI
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PHOTO SCANNER */}
      {activeSubTab === 'photo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-[#12141D] border-2 border-dashed border-[#2D3245] hover:border-[#C6FF00]/50 rounded-3xl p-8 text-center flex flex-col items-center justify-center transition relative overflow-hidden group">
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
              />
              <div className="w-14 h-14 rounded-2xl bg-[#191C28] text-[#C6FF00] flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Upload Food Photo or Drag & Drop</h3>
              <p className="text-xs text-[#94A3B8] max-w-xs mb-4">PNG, JPG up to 10MB supported</p>
              <span className="px-4 py-2 bg-[#191C28] border border-[#2D3245] text-white text-xs font-bold rounded-xl pointer-events-none">
                Select Photo from Device
              </span>
            </div>

            {/* Presets */}
            <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Or Select Demo Sample Photo:</h4>
              <div className="grid grid-cols-2 gap-3">
                {samplePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] hover:border-[#C6FF00] rounded-2xl text-left transition cursor-pointer group"
                  >
                    <img src={preset.imgUrl} alt={preset.title} className="w-full h-24 object-cover rounded-xl mb-2 group-hover:opacity-90" />
                    <div className="text-xs font-bold text-white truncate">{preset.title}</div>
                    <div className="text-[10px] text-[#C6FF00]">Simulate Vision Scanner</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Column */}
          <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-6">
            {!selectedImage && !isScanning && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#94A3B8] space-y-3">
                <Upload className="w-12 h-12 text-[#2D3245]" />
                <div className="text-sm font-bold text-white">No Photo Selected</div>
                <p className="text-xs max-w-xs">Upload an image or tap a demo sample photo to initiate AI computer vision analysis.</p>
              </div>
            )}

            {isScanning && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                <RefreshCw className="w-10 h-10 text-[#C6FF00] animate-spin" />
                <div className="text-sm font-bold text-white">Analyzing Food Composition...</div>
                <p className="text-xs text-[#94A3B8]">Detecting ingredients, raw vs cooked volume, and macros</p>
              </div>
            )}

            {scanResult && !isScanning && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <img src={selectedImage} alt="Meal" className="w-16 h-16 object-cover rounded-2xl border border-[#2D3245]" />
                  <div>
                    <h3 className="text-base font-extrabold text-white">{scanResult.title}</h3>
                    <span className="text-xs text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Confidence: {scanResult.confidence}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#191C28] border border-[#2D3245] rounded-2xl text-xs">
                  <span className="text-[#94A3B8] font-semibold">Portion Weight Spec:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setRawVsCookedState("cooked")}
                      className={`px-3 py-1 rounded-xl font-bold transition ${rawVsCookedState === 'cooked' ? 'bg-[#C6FF00] text-black' : 'text-[#94A3B8]'}`}
                    >
                      Cooked Weight
                    </button>
                    <button
                      onClick={() => setRawVsCookedState("raw")}
                      className={`px-3 py-1 rounded-xl font-bold transition ${rawVsCookedState === 'raw' ? 'bg-[#C6FF00] text-black' : 'text-[#94A3B8]'}`}
                    >
                      Raw Weight
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#94A3B8] uppercase">Detected Ingredients</div>
                  {scanResult.detectedItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#191C28] rounded-xl border border-[#2D3245] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-[10px] text-[#94A3B8]">{item.portion}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-white">{item.calories} kcal</div>
                        <div className="text-[10px] text-[#C6FF00]">{item.protein}g P • {item.carbs}g C • {item.fats}g F</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#191C28] border border-[#C6FF00]/40 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#94A3B8] font-bold uppercase block">Total Meal Estimate</span>
                    <span className="text-xl font-black text-white">{photoTotals.calories} kcal</span>
                  </div>
                  <div className="text-right text-xs font-bold text-[#C6FF00]">
                    {photoTotals.protein}g P • {photoTotals.carbs}g C • {photoTotals.fats}g F
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleConfirmPhotoMeal}
                    className="py-3 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Log Meal
                  </button>
                  <button
                    onClick={() => { setSelectedImage(null); setScanResult(null); }}
                    className="py-3 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 text-[#94A3B8]" /> Scan Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TEXT LOGGER AI */}
      {activeSubTab === 'text' && (
        <div className="space-y-6">
          <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-4">
            <label className="block text-xs font-bold text-[#E2E8F0] uppercase tracking-wider">Describe What You Ate in Natural Text</label>
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

            {/* Presets */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Try sample text inputs:</span>
              <div className="flex flex-wrap gap-2">
                {sampleTextPrompts.map((prompt, idx) => (
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
                  <span className="text-xl font-black text-white">{textTotals.calories} kcal</span>
                </div>
                <div className="text-right text-xs font-bold text-[#C6FF00]">
                  {textTotals.protein}g P • {textTotals.carbs}g C • {textTotals.fats}g F
                </div>
              </div>

              <button
                onClick={handleSaveTextMeal}
                className="w-full py-3 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Save to Daily Food Log
              </button>
            </div>
          )}
        </div>
      )}

      {/* Daily Timeline */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-extrabold text-white">Today's Logged Meals Timeline</h3>
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
