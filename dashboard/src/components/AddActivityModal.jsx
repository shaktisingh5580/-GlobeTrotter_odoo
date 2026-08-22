import React, { useState } from 'react';
import { X, Compass, Loader2 } from 'lucide-react';

export default function AddActivityModal({ destinations = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    destination_id: destinations[0]?.id || '',
    name: '',
    description: '',
    category: 'SIGHTSEEING',
    estimated_cost: 1500,
    currency: 'INR',
    duration_minutes: 120,
    rating: 4.8,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destination_id || !formData.name) {
      setError('Destination and Activity Name are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(formData.destination_id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        estimated_cost: Number(formData.estimated_cost),
        currency: formData.currency,
        duration_minutes: Number(formData.duration_minutes),
        rating: Number(formData.rating),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add activity');
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
            <Compass size={20} className="text-amber-400" />
            Add Curated Activity
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
          <div>
            <label className="text-xs font-bold text-slate-300">Target Destination *</label>
            <select
              value={formData.destination_id}
              onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })}
              className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
              required
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}, {d.country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Activity Title *</label>
            <input
              type="text"
              placeholder="e.g. Fushimi Inari Sunset Hike"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
              >
                <option value="SIGHTSEEING">SIGHTSEEING</option>
                <option value="FOOD">FOOD</option>
                <option value="ADVENTURE">ADVENTURE</option>
                <option value="CULTURE">CULTURE</option>
                <option value="RELAXATION">RELAXATION</option>
                <option value="SHOPPING">SHOPPING</option>
                <option value="NIGHTLIFE">NIGHTLIFE</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Estimated Cost (INR)</label>
              <input
                type="number"
                min="0"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) })}
                className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300">Duration (Minutes)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Rating (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Description</label>
            <textarea
              rows={3}
              placeholder="Walk through thousands of vibrant vermilion torii gates winding up the mountain trail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full mt-1.5 bg-[#10141d] border border-[#283347] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 resize-none"
            />
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
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>Save Activity</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
