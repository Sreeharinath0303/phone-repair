import React, { useEffect, useState } from 'react';
import {
  Settings, Save, RefreshCw, Mail, MessageSquare,
  Percent, Calendar, PlusCircle, Trash2, Sliders, Bell, X
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

const emptyOfferForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  startDate: '',
  endDate: '',
  maxUses: '',
  minOrderValue: '',
  applicableCategories: []
};

export const SettingsManagement = () => {
  const apiBaseUrl = getApiBaseUrl();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [commSettings, setCommSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    slackWebhookAlerts: true,
    slackWebhookUrl: 'https://hooks.slack.com/services/...'
  });
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerForm, setOfferForm] = useState(emptyOfferForm);

  useEffect(() => {
    fetchSettingsAndOffers();
  }, []);

  const authHeaders = (json = false) => {
    const token = localStorage.getItem('rv_token');
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`
    };
  };

  const fetchSettingsAndOffers = async () => {
    setLoading(true);
    try {
      const settingsRes = await fetch(`${apiBaseUrl}/admin/settings/communication`, {
        headers: authHeaders()
      });
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data) {
        setCommSettings(settingsData.data);
      }
      await fetchOffers();
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/settings/offers`, {
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOffers(data.data);
      } else {
        setOffers([]);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/settings/communication`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify(commSettings)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to save settings');
        return;
      }
      alert('Communication settings saved successfully.');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/admin/settings/offers`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          ...offerForm,
          maxUses: offerForm.maxUses === '' ? null : Number(offerForm.maxUses),
          minOrderValue: offerForm.minOrderValue === '' ? 0 : Number(offerForm.minOrderValue)
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to publish code');
        return;
      }
      setShowAddOffer(false);
      setOfferForm(emptyOfferForm);
      await fetchOffers();
      alert('Promo offer code published successfully.');
    } catch (err) {
      console.error('Error creating offer:', err);
      alert('Failed to publish code');
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this promotional offer?')) return;
    try {
      const res = await fetch(`${apiBaseUrl}/admin/settings/offers/${offerId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        await fetchOffers();
      } else {
        alert(data.message || 'Failed to delete offer');
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
      alert('Failed to delete offer');
    }
  };

  const toggleApplicableCategory = (category) => {
    setOfferForm((prev) => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(category)
        ? prev.applicableCategories.filter((item) => item !== category)
        : [...prev.applicableCategories, category]
    }));
  };

  return (
    <div className="space-y-8 font-['Outfit']">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="text-blue-500" />
            System Control Panel
          </h1>
          <p className="text-gray-500 mt-1">Configure global communication channels, links and promotional offers.</p>
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
                <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-sm">Email Deliveries</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Send booking, OTP, quotation and support emails</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={commSettings.emailNotifications}
                    onChange={(e) => setCommSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-black/40 border-white/10 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className="text-emerald-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-sm">SMS Triggers</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Send critical status and tracking updates by SMS</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={commSettings.smsNotifications}
                    onChange={(e) => setCommSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-black/40 border-white/10 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-4 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Sliders size={18} className="text-purple-500 mt-0.5" />
                      <div>
                        <div className="font-bold text-white text-sm">Slack Webhook Alerts</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Push real-time team alerts to a Slack channel</div>
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
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl font-bold transition-all"
                >
                  {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="border-b border-white/5 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Percent size={16} className="text-amber-500" />
                  Promo Codes
                </h3>
                <p className="text-gray-500 text-xs mt-1">Create, display, redeem and delete public offer codes</p>
              </div>
              <button
                onClick={() => {
                  setOfferForm(emptyOfferForm);
                  setShowAddOffer(true);
                }}
                className="p-1 text-blue-500 hover:text-white bg-blue-500/10 hover:bg-blue-500 rounded-lg transition-colors"
                title="Create Offer Code"
              >
                <PlusCircle size={14} />
              </button>
            </div>

            {loadingOffers ? (
              <div className="flex justify-center py-6">
                <RefreshCw size={20} className="animate-spin text-blue-500" />
              </div>
            ) : offers.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">No codes active</p>
            ) : (
              <div className="space-y-3.5">
                {offers.map((offer) => (
                  <div key={offer._id} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs space-y-2 relative">
                    <button
                      onClick={() => handleDeleteOffer(offer._id)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-400"
                      title="Delete code"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded text-[10px]">
                        {offer.code}
                      </span>
                      <span className="text-[10px] font-bold text-white">
                        Save {offer.discountValue}{offer.discountType === 'percentage' ? '%' : ' Rs'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-[10px]">{offer.description}</p>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono pt-1">
                      <Calendar size={10} /> {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                    </div>
                    {offer.maxUses ? <div className="text-[9px] text-gray-500">Max uses: {offer.maxUses}</div> : null}
                    {offer.minOrderValue ? <div className="text-[9px] text-gray-500">Min order: Rs {Number(offer.minOrderValue).toLocaleString('en-IN')}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
            <p className="text-gray-500 text-xs mb-6 font-medium">Create a real customer-facing promo code with availability rules.</p>

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

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Description / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Save 15% on screen and battery repairs"
                  value={offerForm.description}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Discount Type</label>
                  <select
                    value={offerForm.discountType}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">
                    {offerForm.discountType === 'percentage' ? 'Discount (%)' : 'Discount Amount'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={offerForm.discountType === 'percentage' ? '100' : undefined}
                    value={offerForm.discountValue}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={offerForm.startDate}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={offerForm.endDate}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    value={offerForm.maxUses}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, maxUses: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Minimum Order Value</label>
                  <input
                    type="number"
                    min="0"
                    value={offerForm.minOrderValue}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-2">Applicable Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {['smartphone', 'tablet', 'laptop', 'smartwatch'].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleApplicableCategory(category)}
                      className={`rounded-xl border px-3 py-2 text-left transition-all ${
                        offerForm.applicableCategories.includes(category)
                          ? 'bg-blue-500/10 border-blue-500 text-white'
                          : 'bg-[#1e1e1e] border-white/5 text-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">Leave all unselected to allow this code for every category.</p>
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
