import React, { useState } from 'react';
import { X, MapPin, Loader2, Sparkles } from 'lucide-react';

export default function AddDestinationModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    region: '',
    description: '',
    image_url: '',
    cost_index: 2,
    popularity_score: 80,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.country) {
      setError('City Name and Country are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        ...formData,
        cost_index: Number(formData.cost_index),
        popularity_score: Number(formData.popularity_score),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add destination');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161c28] border border-[#283347] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#283347]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin size={20} className="text-emerald-400" />
            Add Curated Destination
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300">City / Place Name *</label>
              <input
                type="text"
                placeholder="e.g. Kyoto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Country *</label>
              <input
                type="text"
                placeholder="e.g. Japan"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Region / State (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Kansai"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Cover Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Description</label>
            <textarea
              rows={3}
              placeholder="Historical temples, traditional tea houses, and tranquil bamboo groves..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300">Cost Index (1-4)</label>
              <select
                value={formData.cost_index}
                onChange={(e) => setFormData({ ...formData, cost_index: Number(e.target.value) })}
                className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value={1}>$ - Budget Friendly</option>
                <option value={2}>$$ - Moderate</option>
                <option value={3}>$$$ - Upscale</option>
                <option value={4}>$$$$ - Luxury</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Popularity Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.popularity_score}
                onChange={(e) => setFormData({ ...formData, popularity_score: Number(e.target.value) })}
                className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-rose-400 text-xs font-bold">{error}</div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#283347]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>Save Destination</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
