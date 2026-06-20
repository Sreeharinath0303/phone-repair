import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Save, RefreshCw, Mail, MessageSquare, ShieldAlert,
  Percent, Calendar, PlusCircle, Trash2, Sliders, Bell, Info, X
} from 'lucide-react';

export const SettingsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Communication Toggles
  const [commSettings, setCommSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    slackWebhookAlerts: true,
    slackWebhookUrl: 'https://hooks.slack.com/services/...'
  });

  // Offers/Promo Codes
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    code: '', discountPercentage: 10, description: '', expiryDate: ''
  });

  useEffect(() => {
    fetchSettingsAndOffers();
  }, []);

  const fetchSettingsAndOffers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      // Fetch settings
      const settingsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/communication`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data) {
        setCommSettings(settingsData.data);
      }

      // Fetch offers
      fetchOffers();
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/offers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOffers(data.data || []);
      } else {
        // High fidelity mock offers
        setOffers([
          { _id: 'o1', code: 'WELCOME10', discountPercentage: 10, description: '10% discount on first hardware repair request', expiryDate: '2026-12-31' },
          { _id: 'o2', code: 'REPAIRNEW', discountPercentage: 15, description: '15% discount for returning customers', expiryDate: '2026-11-30' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/communication`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(commSettings)
      });
      const data = await res.json();
      if (data.success) {
        alert('Communication settings saved successfully!');
      } else {
        alert(data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/offers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(offerForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddOffer(false);
        setOfferForm({ code: '', discountPercentage: 10, description: '', expiryDate: '' });
        fetchOffers();
        alert('Promo offer code published successfully!');
      } else {
        alert(data.message || 'Failed to publish code');
      }
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this promotional offer?')) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/offers/${offerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchOffers();
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
    }
  };

  return (
    <div className="space-y-8 font-['Outfit']">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="text-blue-500" />
            System Control Panel
          </h1>
          <p className="text-gray-500 mt-1">Configure global communication pipelines, Slack triggers, promo offers and locks</p>
        </div>
        <button 
          onClick={fetchSettingsAndOffers}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-xs font-bold"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Reload
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
          <p className="text-gray-500 text-sm">Loading configurations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Communication Settings Form */}
          <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="border-b border-white/5 pb-4 flex items-center gap-2">
              <Bell size={20} className="text-blue-500" />
              <div>
                <h3 className="text-base font-bold text-white">Event Notifications Toggles</h3>
                <p className="text-xs text-gray-500 font-medium">Toggle notification channels for customer updates and admin alerts</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              <div className="space-y-4">
                {/* Email Toggles */}
                <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-sm">Email Deliveries</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Send custom HTML invoices, alerts, and password credentials</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={commSettings.emailNotifications}
                    onChange={(e) => setCommSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-black/40 border-white/10 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* SMS Toggles */}
                <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className="text-emerald-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-sm">SMS Triggers</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Send emergency slot and tracking link texts to customer phones</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={commSettings.smsNotifications}
                    onChange={(e) => setCommSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-black/40 border-white/10 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Slack Toggles */}
                <div className="flex flex-col gap-4 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Sliders size={18} className="text-purple-500 mt-0.5" />
                      <div>
                        <div className="font-bold text-white text-sm">Slack Slackhook Alerts</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Push real-time team alerts to connected Slack channel</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={commSettings.slackWebhookAlerts}
                      onChange={(e) => setCommSettings(prev => ({ ...prev, slackWebhookAlerts: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-black/40 border-white/10 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  {commSettings.slackWebhookAlerts && (
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <label className="text-[10px] font-bold text-gray-400">Slack Webhook URL</label>
                      <input
                        type="text"
                        value={commSettings.slackWebhookUrl}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Social Media & External Links Section */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sliders size={18} className="text-blue-500" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Social Media & External Links</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Configure target links for external profiles, reviews, and support</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Facebook Link */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400">Facebook URL</label>
                      <input
                        type="url"
                        value={commSettings.facebookLink || ''}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, facebookLink: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    {/* Instagram Link */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400">Instagram URL</label>
                      <input
                        type="url"
                        value={commSettings.instagramLink || ''}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, instagramLink: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://instagram.com/..."
                      />
                    </div>

                    {/* YouTube Link */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400">YouTube URL</label>
                      <input
                        type="url"
                        value={commSettings.youtubeLink || ''}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, youtubeLink: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://youtube.com/..."
                      />
                    </div>

                    {/* LinkedIn Link */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400">LinkedIn URL</label>
                      <input
                        type="url"
                        value={commSettings.linkedinLink || ''}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, linkedinLink: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>

                    {/* Twitter/X Link */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400">Twitter/X URL</label>
                      <input
                        type="url"
                        value={commSettings.twitterLink || ''}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, twitterLink: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://x.com/..."
                      />
                    </div>

                    {/* Trustpilot Link */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400">Trustpilot URL</label>
                      <input
                        type="url"
                        value={commSettings.trustpilotLink || ''}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, trustpilotLink: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://trustpilot.com/review/..."
                      />
                    </div>

                    {/* WhatsApp Link */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400">WhatsApp URL</label>
                      <input
                        type="url"
                        value={commSettings.whatsappLink || ''}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, whatsappLink: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://wa.me/..."
                      />
                    </div>

                    {/* Google Search Link */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400">Google Business Listing URL</label>
                      <input
                        type="url"
                        value={commSettings.googleSearchLink || ''}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, googleSearchLink: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://google.com/search?..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          {/* Offers Settings side widget */}
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="border-b border-white/5 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Percent size={16} className="text-amber-500" />
                  Promo Codes
                </h3>
                <p className="text-gray-500 text-xs mt-1">Manage public promotional discount rules</p>
              </div>
              <button
                onClick={() => {
                  setOfferForm({ code: '', discountPercentage: 10, description: '', expiryDate: '' });
                  setShowAddOffer(true);
                }}
                className="p-1 text-blue-500 hover:text-white bg-blue-500/10 hover:bg-blue-500 rounded-lg transition-colors"
                title="Create Offer Code"
              >
                <PlusCircle size={14} />
              </button>
            </div>

            {/* Offer list */}
            {loadingOffers ? (
              <div className="flex justify-center py-6">
                <RefreshCw size={20} className="animate-spin text-blue-500" />
              </div>
            ) : offers.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">No codes active</p>
            ) : (
              <div className="space-y-3.5">
                {offers.map(offer => (
                  <div key={offer._id} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs space-y-2 relative group">
                    <button
                      onClick={() => handleDeleteOffer(offer._id)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded text-[10px]">
                        {offer.code}
                      </span>
                      <span className="text-[10px] font-bold text-white">Save {offer.discountPercentage}%</span>
                    </div>
                    <p className="text-gray-400 text-[10px]">{offer.description}</p>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono pt-1">
                      <Calendar size={10} /> Valid Until: {new Date(offer.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Offer Dialog Overlay */}
      {showAddOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-md relative">
            <button 
              onClick={() => setShowAddOffer(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Publish Offer Code</h3>
            <p className="text-gray-500 text-xs mb-6 font-medium">Create a sitewide promo code logic with discount rates.</p>

            <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Promo Discount Code</label>
                <input
                  type="text"
                  placeholder="e.g. FIXIT15"
                  value={offerForm.code}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Discount (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={offerForm.discountPercentage}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, discountPercentage: Number(e.target.value) }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    value={offerForm.expiryDate}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Description / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Save 15% on Apple display parts"
                  value={offerForm.description}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddOffer(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Publish Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
