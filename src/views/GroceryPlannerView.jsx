import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Filter,
  DollarSign
} from 'lucide-react';

export default function GroceryPlannerView({ groceryItems, onToggleItem, onAddItem, onDeleteItem, onRegenerate }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Protein');

  const categories = ['All', 'Protein', 'Grains', 'Vegetables', 'Fruits', 'Dairy', 'Snacks', 'Spices and essentials'];

  const filteredItems = activeCategory === 'All'
    ? groceryItems
    : groceryItems.filter(item => item.category === activeCategory);

  const totalCost = groceryItems.reduce((acc, item) => acc + (item.estimatedPrice || 0), 0);
  const spentCost = groceryItems.filter(i => i.isBought).reduce((acc, item) => acc + (item.estimatedPrice || 0), 0);
  const budgetTarget = 3500; // ₹ INR weekly budget

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (onAddItem) {
      onAddItem({
        id: `custom-${Date.now()}`,
        name: newItemName,
        category: newItemCategory,
        qty: newItemQty || '1 unit',
        estimatedPrice: Number(newItemPrice) || 100,
        isBought: false
      });
    }

    setNewItemName('');
    setNewItemQty('');
    setNewItemPrice('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Automated Nutrition Logistics
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Smart Grocery Planner</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Weekly meal plan grocery list with estimated Indian market pricing (₹ INR) & budget tracking.
          </p>
        </div>

        <button
          onClick={onRegenerate}
          className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Regenerate List
        </button>
      </div>

      {/* Budget Progress Bar Card */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-white uppercase tracking-wider">Weekly Grocery Budget Progress</span>
          <span className="text-[#C6FF00] font-mono">
            Purchased: ₹{spentCost} / Total Plan: ₹{totalCost} (Budget: ₹{budgetTarget})
          </span>
        </div>
        <div className="w-full bg-[#191C28] h-3 rounded-full overflow-hidden border border-[#2D3245]">
          <div
            className="bg-[#C6FF00] h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min((totalCost / budgetTarget) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#C6FF00] text-black font-extrabold shadow'
                : 'bg-[#12141D] text-[#94A3B8] border border-[#2D3245] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Custom Item Form */}
      <form onSubmit={handleCreateCustom} className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Item Name (e.g. Soya Chunks)"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 min-w-[140px] bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
        />
        <input
          type="text"
          placeholder="Qty (e.g. 500g)"
          value={newItemQty}
          onChange={(e) => setNewItemQty(e.target.value)}
          className="w-28 bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
        />
        <input
          type="number"
          placeholder="Est Price ₹"
          value={newItemPrice}
          onChange={(e) => setNewItemPrice(e.target.value)}
          className="w-28 bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
        />
        <select
          value={newItemCategory}
          onChange={(e) => setNewItemCategory(e.target.value)}
          className="bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
        >
          {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-[#C6FF00] text-black font-extrabold text-xs rounded-xl hover:bg-[#B5F500] transition cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </form>

      {/* Grocery Items List */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
              item.isBought ? 'bg-[#191C28]/60 border-[#2D3245] opacity-75' : 'bg-[#191C28] border-[#2D3245] hover:border-[#C6FF00]/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleItem(item.id)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  item.isBought ? 'bg-[#C6FF00] text-black font-bold' : 'border border-[#2D3245] hover:border-[#C6FF00]'
                }`}
              >
                {item.isBought && <CheckCircle2 className="w-4 h-4 text-black" />}
              </button>
              <div>
                <div className={`text-xs font-bold text-white ${item.isBought ? 'line-through text-[#94A3B8]' : ''}`}>
                  {item.name}
                </div>
                <div className="text-[10px] text-[#94A3B8]">
                  {item.category} • <strong className="text-white">{item.qty}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono font-bold text-[#C6FF00]">₹{item.estimatedPrice}</span>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-1.5 text-[#94A3B8] hover:text-red-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <MedicalDisclaimer compact={true} />
    </div>
  );
}
