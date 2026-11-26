import React, { useState, useEffect, useCallback } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { TodayVsTarget, MealImpact } from '../components/TodayNutrition';
import { Plus, Trash } from '../components/ui/icons';

// Server returns { title, confidence, category, imagePath, items, totals }.
function toMealResult(res) {
  if (!res || !Array.isArray(res.items)) return null;
  const totals = res.totals || {};
  return {
    title: res.title,
    confidence: res.confidence,
    category: res.category,
    imagePath: res.imagePath,
    items: res.items,
    detectedItems: res.items,
    calories: Math.round(totals.calories || 0),
    protein: Math.round(totals.protein || 0),
    carbs: Math.round(totals.carbs || 0),
    fats: Math.round(totals.fats || 0),
  };
}

export default function LogMealView() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState('photo'); // 'photo' | 'text'

  // Photo Scanner State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Text Logger State
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedMeal, setParsedMeal] = useState(null);

  // Today's intake vs targets
  const [summary, setSummary] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setSummary(await api.get('/meals/summary'));
    } catch (err) {
      console.error('Failed to load nutrition summary:', err);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleDeleteLog = async (log) => {
    if (!window.confirm(`Remove "${log.name}" (${log.calories} kcal) from today's log?`)) return;
    setDeletingId(log.id);
    try {
      await api.delete(`/meals/${log.id}`);
      showToast("Meal removed from today's log.", 'success');
      fetchSummary();
      refreshUser();
    } catch (err) {
      showToast(err.message || 'Failed to remove meal', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Quick prompt chips
  const sampleTextPrompts = [
    "2 rotis, 1 bowl dal tadka, and 100g paneer tikka",
    "1 dosa with coconut chutney and 1 cup sambar",
    "50g oats cooked in milk with 10g almonds and 1 banana",
    "150g grilled chicken breast with brown rice and cucumber salad"
  ];

  // Photo Handlers
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanResult(null);

    // Automatically send to AI vision
    setIsScanning(true);
    try {
      showToast('Analyzing food photo with REPP Vision AI...', 'info');
      const formData = new FormData();
      formData.append('photo', file);

      const result = toMealResult(await api.post('/meals/parse-photo', formData));
      if (result) {
        setScanResult(result);
        showToast('Meal successfully recognized!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to scan meal photo', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmPhotoMeal = async () => {
    if (!scanResult) return;
    try {
      await api.post('/meals/log', {
        name: scanResult.title || 'Scanned Meal',
        category: scanResult.category || 'Meal',
        source: 'photo',
        imagePath: scanResult.imagePath,
        items: scanResult.items,
        confidence: scanResult.confidence,
        calories: scanResult.calories || 0,
        protein: scanResult.protein || 0,
        carbs: scanResult.carbs || 0,
        fats: scanResult.fats || 0,
        rawVsCooked: scanResult.notes || 'Scanned via Vision AI',
      });

      showToast('Meal verified & logged into your nutrition journal!', 'success');
      refreshUser();
      fetchSummary();
      setScanResult(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      showToast(err.message || 'Failed to log meal', 'error');
    }
  };

  // Text Handlers
  const handleParseText = async (textToUse) => {
    const text = textToUse || inputText;
    if (!text.trim()) return;

    setIsParsing(true);
    setParsedMeal(null);

    try {
      showToast('Parsing meal items & calculating nutrition...', 'info');
      const result = toMealResult(await api.post('/meals/parse-text', { text }));
      if (result) {
        setParsedMeal(result);
        showToast('Nutritional breakdown calculated!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to parse meal text', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmTextMeal = async () => {
    if (!parsedMeal) return;
    try {
      await api.post('/meals/log', {
        name: parsedMeal.title || 'Quick Logged Meal',
        category: parsedMeal.category || 'Quick Log',
        source: 'text',
        items: parsedMeal.items,
        calories: parsedMeal.calories || 0,
        protein: parsedMeal.protein || 0,
        carbs: parsedMeal.carbs || 0,
        fats: parsedMeal.fats || 0,
        rawVsCooked: parsedMeal.notes || 'Logged via Natural Language',
      });

      showToast('Meal successfully logged into your daily journal!', 'success');
      refreshUser();
      fetchSummary();
      setParsedMeal(null);
      setInputText('');
    } catch (err) {
      showToast(err.message || 'Failed to log meal', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">Log & Scan Meal</h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Photograph a meal or describe it in words. REPP estimates calories, protein, carbs and fats before you save it.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-page p-1 rounded-sm border border-line">
          <button
            onClick={() => setActiveSubTab('photo')}
            className={`px-4 py-2 text-xs font-bold rounded-sm transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'photo' ? 'bg-brand text-on-brand ' : 'text-muted hover:text-ink'
            }`}
          >
            
            <span>Photo Scanner</span>
          </button>
          <button
            onClick={() => setActiveSubTab('text')}
            className={`px-4 py-2 text-xs font-bold rounded-sm transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'text' ? 'bg-brand text-on-brand ' : 'text-muted hover:text-ink'
            }`}
          >
            
            <span>Natural Language</span>
          </button>
        </div>
      </div>

      <TodayVsTarget summary={summary} />

      {/* Sub-tab 1: Photo Scanner */}
      {activeSubTab === 'photo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Box */}
          <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
               Snap or Upload Food Photo
            </h3>

            <div className="border-2 border-dashed border-line hover:border-line-strong rounded-sm p-8 text-center relative transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {previewUrl ? (
                <div className="space-y-3">
                  <img src={previewUrl} alt="Preview" className="max-h-60 mx-auto rounded-sm object-cover" />
                  <p className="text-xs text-muted">Click or drop another photo to change</p>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="text-sm font-bold text-ink">Click or drag & drop food image</div>
                  <p className="text-xs text-muted">Supports JPG, PNG, WEBP up to 10MB</p>
                </div>
              )}
            </div>

            {isScanning && (
              <div className="p-4 bg-subtle rounded-sm flex items-center justify-center gap-3 text-xs text-brand">
                
                <span>Running computer vision analysis on plate items...</span>
              </div>
            )}
          </div>

          {/* Results Box */}
          <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
               AI Detection Result
            </h3>

            {scanResult ? (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-brand uppercase tracking-wider">Identified Meal</div>
                  <h4 className="text-xl font-bold text-ink">{scanResult.title || 'Detected Food'}</h4>
                  {scanResult.confidence && (
                    <span className="text-[10px] bg-subtle text-brand border border-line-strong px-2 py-0.5 rounded-sm font-mono mt-1 inline-block">
                      Confidence: {scanResult.confidence}
                    </span>
                  )}
                </div>

                {/* Macro Summary Grid */}
                <div className="grid grid-cols-4 gap-2 bg-subtle p-4 rounded-sm text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted block">Calories</span>
                    <span className="font-bold text-ink text-sm">{scanResult.calories} kcal</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Protein</span>
                    <span className="font-bold text-brand text-sm">{scanResult.protein}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Carbs</span>
                    <span className="font-bold text-data-carbs text-sm">{scanResult.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Fats</span>
                    <span className="font-bold text-warning text-sm">{scanResult.fats}g</span>
                  </div>
                </div>

                {/* Detected Items list if available */}
                {scanResult.detectedItems?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted">Detected Ingredients:</span>
                    {scanResult.detectedItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-subtle rounded-sm flex justify-between text-xs text-ink">
                        <span>{item.name} ({item.portion})</span>
                        <span className="font-mono text-brand">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                )}

                <MealImpact summary={summary} meal={scanResult} />

                <button
                  onClick={handleConfirmPhotoMeal}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Log Scanned Meal to Today's Journal
                </button>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted space-y-2">
                
                <p>Upload a food picture to automatically analyze portions and macros.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Natural Language Logger */}
      {activeSubTab === 'text' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
               Natural Language Food Entry
            </h3>

            <div className="space-y-2">
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. 2 rotis with 1 bowl dal tadka and 150g grilled chicken breast"
                className="w-full bg-white border border-line-strong rounded-sm p-4 text-sm text-ink placeholder-muted focus:outline-none focus:border-brand transition"
              />
              <button
                onClick={() => handleParseText()}
                disabled={isParsing || !inputText.trim()}
                className="w-full py-3 bg-brand hover:bg-brand-hover disabled:opacity-50 text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                
                <span>{isParsing ? 'Calculating Macros...' : 'Analyze Meal with AI'}</span>
              </button>
            </div>

            {/* Quick Chips */}
            <div className="space-y-2 pt-2 border-t border-line">
              <span className="text-xs font-bold text-muted">Sample Indian Food Entries:</span>
              <div className="flex flex-col gap-1.5">
                {sampleTextPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setInputText(prompt); handleParseText(prompt); }}
                    className="text-left text-xs p-2 rounded-sm bg-subtle hover:bg-subtle-hover text-muted hover:text-ink transition cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
               Parsed Meal Details
            </h3>

            {parsedMeal ? (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-brand uppercase tracking-wider">Calculated Breakdown</div>
                  <h4 className="text-xl font-bold text-ink">{parsedMeal.title || 'Logged Meal'}</h4>
                </div>

                <div className="grid grid-cols-4 gap-2 bg-subtle p-4 rounded-sm text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted block">Calories</span>
                    <span className="font-bold text-ink text-sm">{parsedMeal.calories} kcal</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Protein</span>
                    <span className="font-bold text-brand text-sm">{parsedMeal.protein}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Carbs</span>
                    <span className="font-bold text-data-carbs text-sm">{parsedMeal.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Fats</span>
                    <span className="font-bold text-warning text-sm">{parsedMeal.fats}g</span>
                  </div>
                </div>

                {parsedMeal.items?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted">Items Breakdown:</span>
                    {parsedMeal.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-subtle rounded-sm flex justify-between text-xs text-ink">
                        <span>{item.name}{(item.portion || item.qty) ? ` (${item.portion || item.qty})` : ''}</span>
                        <span className="font-mono text-brand">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                )}

                <MealImpact summary={summary} meal={parsedMeal} />

                <button
                  onClick={handleConfirmTextMeal}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Save Meal to Today's Journal
                </button>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted space-y-2">
                
                <p>Type what you ate above or click a sample entry to parse.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's logged meals */}
      {summary && (
        <div className="bg-surface border border-line rounded-sm p-6 space-y-3">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
             Today's Food Log
          </h3>
          {summary.loggedMeals.length === 0 && summary.planMealsEaten.length === 0 ? (
            <p className="text-xs text-muted">Nothing logged yet today. Scan a photo or describe a meal above.</p>
          ) : (
            <div className="space-y-2">
              {summary.loggedMeals.map(log => (
                <div key={log.id} className="p-3 bg-subtle rounded-sm flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-ink truncate">{log.name}</div>
                    <div className="text-[11px] text-muted flex items-center gap-1.5">
                      
                      {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.category} · {log.source === 'photo' ? 'Photo scan' : log.source === 'text' ? 'Described' : 'Manual'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-muted hidden sm:inline">
                      P {log.protein}g · C {log.carbs}g · F {log.fats}g
                    </span>
                    <span className="font-mono font-bold text-brand">{log.calories} kcal</span>
                    <button
                      onClick={() => handleDeleteLog(log)}
                      disabled={deletingId === log.id}
                      className="p-1.5 text-muted hover:text-danger rounded-sm cursor-pointer disabled:opacity-50"
                      aria-label={`Remove ${log.name}`}
                    >
                      {deletingId === log.id ? null : <Trash className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              {summary.planMealsEaten.map(m => (
                <div key={m.id} className="p-3 bg-subtle rounded-sm flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-ink truncate">{m.name}</div>
                    <div className="text-[11px] text-muted">{m.category} · From your diet plan</div>
                  </div>
                  <span className="font-mono font-bold text-brand shrink-0">{m.calories} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
}
