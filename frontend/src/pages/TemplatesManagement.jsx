import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Search, PlusCircle, RefreshCw, Edit, Trash2, 
  X, Eye, Send, FileCode, CheckCircle, Code, AlignLeft, FileText
} from 'lucide-react';

export const TemplatesManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Forms state
  const [templateForm, setTemplateForm] = useState({
    name: '', subject: '', body: '', type: 'transactional'
  });
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/email-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching email templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewTemplate = async (template) => {
    setSelectedTemplate(template);
    setLoadingPreview(true);
    setPreviewHtml('');
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/preview-template`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: template._id,
          // optional dummy data for rendering preview
          dummyData: {
            customerName: 'Sreehari Nath',
            referenceNumber: 'RV-2026-00392',
            deviceBrand: 'Apple',
            deviceModel: 'iPhone 15 Pro',
            quotationAmount: 4999,
            estimatedTime: '2 Hours'
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewHtml(data.html || data.data || '');
      } else {
        // Fallback to displaying template body directly if rendering fails
        setPreviewHtml(template.body);
      }
    } catch (err) {
      console.error('Error previewing template:', err);
      setPreviewHtml(template.body);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/email-templates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(templateForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setTemplateForm({ name: '', subject: '', body: '', type: 'transactional' });
        fetchTemplates();
      } else {
        alert(data.message || 'Failed to create template');
      }
    } catch (err) {
      console.error('Error adding template:', err);
    }
  };

  const handleEditTemplate = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/email-templates/${selectedTemplate._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(templateForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedTemplate(null);
        setTemplateForm({ name: '', subject: '', body: '', type: 'transactional' });
        fetchTemplates();
      } else {
        alert(data.message || 'Failed to update template');
      }
    } catch (err) {
      console.error('Error updating template:', err);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to permanently delete this email template?')) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/email-templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
        setSelectedTemplate(null);
      }
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!selectedTemplate || !testEmailAddress) return;
    setSendingTest(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/send-test-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          templateId: selectedTemplate._id,
          testEmail: testEmailAddress
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowTestModal(false);
        setTestEmailAddress('');
        alert('Test email queued and sent successfully!');
      } else {
        alert(data.message || 'Failed to send test email');
      }
    } catch (err) {
      console.error('Error sending test email:', err);
    } finally {
      setSendingTest(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-['Outfit']">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Mail className="text-blue-500" />
            Email Templates
          </h1>
          <p className="text-gray-500 mt-1">Design, preview and sandbox test transactional email notifications for platform events</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTemplates} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh List
          </button>
          <button 
            onClick={() => {
              setTemplateForm({ name: '', subject: '', body: '', type: 'transactional' });
              setShowAddModal(true);
            }} 
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <PlusCircle size={14} />
            Create Template
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="Search templates by name or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Template List Table */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-gray-500 text-sm">Loading email templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-24">
              <Mail size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">No templates found</h3>
              <p className="text-gray-500 text-sm">Create a new template to start custom notification workflows.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 font-bold">Template Name</th>
                    <th className="px-6 py-4 font-bold">Subject Line</th>
                    <th className="px-6 py-4 font-bold">Type</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTemplates.map(t => (
                    <tr 
                      key={t._id} 
                      onClick={() => handlePreviewTemplate(t)}
                      className={`group hover:bg-white/[0.01] transition-colors cursor-pointer ${
                        selectedTemplate?._id === t._id ? 'bg-white/[0.02] border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <FileCode size={14} className="text-gray-500" />
                          {t.name}
                        </div>
                        <div className="text-[9px] text-gray-500 mt-0.5">Last modified {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 font-medium truncate max-w-xs">{t.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${
                          t.type === 'transactional' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTemplate(t);
                              setTemplateForm({
                                name: t.name, subject: t.subject, body: t.body, type: t.type || 'transactional'
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit Template"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTemplate(t);
                              setShowTestModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Send Sandbox Test"
                          >
                            <Send size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(t._id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Template Preview Panel */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6 flex flex-col h-[550px] overflow-hidden">
          <div className="border-b border-white/5 pb-4 flex justify-between items-center flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye size={16} className="text-blue-500" />
                Live HTML Sandbox
              </h3>
              <p className="text-gray-500 text-xs mt-1">Rendered transactional template preview</p>
            </div>
            {selectedTemplate && (
              <button
                onClick={() => setShowTestModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-blue-500/20"
              >
                <Send size={10} /> Test Send
              </button>
            )}
          </div>

          <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative p-1 flex flex-col">
            {selectedTemplate ? (
              loadingPreview ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <RefreshCw size={24} className="animate-spin text-blue-500" />
                  <p className="text-gray-500 text-[10px] font-mono">RENDERING_TEMPLATE...</p>
                </div>
              ) : previewHtml ? (
                <iframe
                  title="HTML Email Preview"
                  srcDoc={previewHtml}
                  className="w-full h-full border-none bg-white rounded-xl"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex flex-col p-4 overflow-y-auto text-[10px] font-mono text-gray-400 h-full">
                  <span className="text-gray-500 uppercase font-bold text-[9px] mb-1.5">Template Source Code:</span>
                  <pre className="whitespace-pre-wrap">{selectedTemplate.body}</pre>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs text-center p-6">
                Select a template from the list to render interactive email previews.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Create Email Template</h3>
            <p className="text-gray-500 text-xs mb-6">Build an HTML template incorporating dynamic MERN bindings.</p>

            <form onSubmit={handleAddTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Template Identifier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. BOOKING_CONFIRMATION"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Template Type</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="transactional">Transactional Event</option>
                    <option value="marketing">Marketing Promotion</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Email Subject Line</label>
                  <input
                    type="text"
                    placeholder="e.g. Repair Order {{referenceNumber}} Received!"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5 flex justify-between items-center">
                    <span>HTML Template Source Body</span>
                    <span className="text-[10px] text-gray-500 font-normal font-mono">use {"{{customerName}}"}, {"{{referenceNumber}}"} placeholders</span>
                  </label>
                  <textarea
                    placeholder="<div style='font-family: Arial;'><h2>Hello {{customerName}}</h2>...</div>"
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-64 font-mono leading-relaxed"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Edit Template: {selectedTemplate.name}</h3>
            <p className="text-gray-500 text-xs mb-6">Modify HTML and subjects for live transactional dispatching.</p>

            <form onSubmit={handleEditTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Template Identifier Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Template Type</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="transactional">Transactional Event</option>
                    <option value="marketing">Marketing Promotion</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Email Subject Line</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5 flex justify-between items-center">
                    <span>HTML Template Source Body</span>
                    <span className="text-[10px] text-gray-500 font-normal font-mono">use {"{{customerName}}"}, {"{{referenceNumber}}"} placeholders</span>
                  </label>
                  <textarea
                    placeholder="HTML source code..."
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-64 font-mono leading-relaxed"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Test Email Modal */}
      {showTestModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-md relative">
            <button 
              onClick={() => setShowTestModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Send Sandbox Test</h3>
            <p className="text-gray-500 text-xs mb-6">Dispatch a test rendered copy of '{selectedTemplate.name}' directly to an inbox.</p>

            <form onSubmit={handleSendTestEmail} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Destination Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. test@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {sendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Send Sandbox Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
