import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Logo from './Logo.png'; 

// --- Dashboard Component ---
const Dashboard = ({ campaigns }) => { 
    // Filter & Calc logic remains the same
    const completedCampaigns = campaigns.filter(c => c.status === 'Completed');
    const numberOfCompletedCampaigns = completedCampaigns.length;

    const budgetSpent = completedCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalClicks = completedCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const avgClicks = numberOfCompletedCampaigns > 0 ? (totalClicks / numberOfCompletedCampaigns).toFixed(0) : '0';
    const totalPPC = completedCampaigns.reduce((sum, c) => sum + (c.pricePerClick || 0), 0);
    const avgPPC = numberOfCompletedCampaigns > 0 ? (totalPPC / numberOfCompletedCampaigns).toFixed(2) : '0.00';
    const totalViews = completedCampaigns.reduce((sum, c) => sum + (c.views || 0), 0);
    const avgViews = numberOfCompletedCampaigns > 0 ? (totalViews / numberOfCompletedCampaigns).toFixed(0) : '0';
    const totalReach = completedCampaigns.reduce((sum, c) => sum + (c.reach || 0), 0);
    const avgReach = numberOfCompletedCampaigns > 0 ? (totalReach / numberOfCompletedCampaigns).toFixed(0) : '0';

    const StatCard = ({ title, value, subtext, colorClass, icon }) => (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
                <h3 className={`text-3xl font-bold ${colorClass}`}>{value}</h3>
                <p className="text-xs text-slate-400 mt-2">{subtext}</p>
            </div>
            <div className={`p-3 rounded-full bg-slate-50 ${colorClass.replace('text-', 'text-opacity-80 text-')}`}>
                {icon}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
                title="Завършени Кампании" 
                value={numberOfCompletedCampaigns} 
                subtext="Кампании със статус 'Completed'"
                colorClass="text-blue-600"
                icon={<span className="text-xl">✅</span>}
            />
            <StatCard 
                title="Изразходван Бюджет" 
                value={`€${budgetSpent.toFixed(2)}`} 
                subtext="Общ бюджет на завършени"
                colorClass="text-green-600"
                icon={<span className="text-xl">💰</span>}
            />
            <StatCard 
                title="Средно Кликове" 
                value={avgClicks} 
                subtext="Средно на кампания"
                colorClass="text-yellow-600"
                icon={<span className="text-xl">🖱️</span>}
            />
            <StatCard 
                title="Avg. Cost Per Click" 
                value={`€${avgPPC}`} 
                subtext="Средна цена за клик"
                colorClass="text-purple-600"
                icon={<span className="text-xl">📉</span>}
            />
            <StatCard 
                title="Средно Преглеждания" 
                value={avgViews} 
                subtext="Views per campaign"
                colorClass="text-red-600"
                icon={<span className="text-xl">👁️</span>}
            />
            <StatCard 
                title="Среден Reach" 
                value={avgReach} 
                subtext="Уникални потребители"
                colorClass="text-indigo-600"
                icon={<span className="text-xl">🌍</span>}
            />
        </div>
    );
};

// --- AddCampaignForm Component ---
const AddCampaignForm = ({ db, userId, isAuthReady }) => {
    const [formData, setFormData] = useState({
        name: '', status: 'Planned', budget: '', startDate: '', endDate: '',
        targetAudience: '', clicks: '', pricePerClick: '', views: '', reach: '',
        audienceNotes: '', platform: '', postText: '', postConcept: '', postScript: ''
    });

    // App ID fallback
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCampaign = async () => {
        if (!db || !userId || !isAuthReady || !formData.name.trim()) return;
        try {
            const campaignsCollectionRef = collection(db, `artifacts/${appId}/public/data/campaigns`);
            await addDoc(campaignsCollectionRef, {
                ...formData,
                budget: parseFloat(formData.budget) || 0,
                clicks: parseInt(formData.clicks) || 0,
                pricePerClick: parseFloat(formData.pricePerClick) || 0,
                views: parseInt(formData.views) || 0,
                reach: parseInt(formData.reach) || 0,
                createdAt: new Date().toISOString(),
                createdBy: userId,
            });
            // Reset form
            setFormData({
                name: '', status: 'Planned', budget: '', startDate: '', endDate: '',
                targetAudience: '', clicks: '', pricePerClick: '', views: '', reach: '',
                audienceNotes: '', platform: '', postText: '', postConcept: '', postScript: ''
            });
            alert("Кампанията е добавена успешно!");
        } catch (error) {
            console.error("Error adding campaign:", error);
        }
    };

    const isFormDisabled = !isAuthReady || !userId;

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-700 uppercase mb-6 border-b border-slate-100 pb-2">Нова Кампания</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="md:col-span-1 space-y-4">
                    <h4 className="text-xs font-bold text-blue-600 uppercase">1. Основна информация</h4>
                    <div>
                        <label className="label-clean">Име на кампания</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-clean" disabled={isFormDisabled} />
                    </div>
                    <div>
                        <label className="label-clean">Статус</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="input-clean bg-white" disabled={isFormDisabled}>
                            <option value="Planned">Планирана</option>
                            <option value="Active">Активна</option>
                            <option value="Completed">Приключила</option>
                            <option value="Paused">На пауза</option>
                        </select>
                    </div>
                    <div>
                        <label className="label-clean">Бюджет (€)</label>
                        <input type="number" name="budget" value={formData.budget} onChange={handleChange} className="input-clean" disabled={isFormDisabled} />
                    </div>
                </div>

                {/* Targeting & Dates */}
                <div className="md:col-span-1 space-y-4">
                    <h4 className="text-xs font-bold text-blue-600 uppercase">2. Таргетиране & Дати</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="label-clean">Начало</label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="input-clean" disabled={isFormDisabled} />
                        </div>
                        <div>
                            <label className="label-clean">Край</label>
                            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="input-clean" disabled={isFormDisabled} />
                        </div>
                    </div>
                    <div>
                        <label className="label-clean">Платформа</label>
                        <select name="platform" value={formData.platform} onChange={handleChange} className="input-clean bg-white" disabled={isFormDisabled}>
                            <option value="">Избери...</option>
                            <option value="TikTok">TikTok</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Instagram/Facebook">Instagram/Facebook</option>
                            <option value="Other">Друга</option>
                        </select>
                    </div>
                    <div>
                        <label className="label-clean">Целева Аудитория</label>
                        <input type="text" name="targetAudience" value={formData.targetAudience} onChange={handleChange} className="input-clean" disabled={isFormDisabled} />
                    </div>
                </div>

                {/* Content */}
                <div className="md:col-span-1 space-y-4">
                    <h4 className="text-xs font-bold text-blue-600 uppercase">3. Съдържание</h4>
                    <div>
                        <label className="label-clean">Текст на поста</label>
                        <textarea name="postText" value={formData.postText} onChange={handleChange} rows="2" className="input-clean resize-none" disabled={isFormDisabled}></textarea>
                    </div>
                    <div>
                        <label className="label-clean">Концепция</label>
                        <textarea name="postConcept" value={formData.postConcept} onChange={handleChange} rows="2" className="input-clean resize-none" disabled={isFormDisabled}></textarea>
                    </div>
                </div>

                {/* Metrics (Optional / Forecast) */}
                <div className="md:col-span-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Метрики (Прогноза / Начални)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div><label className="label-clean">Clicks</label><input type="number" name="clicks" value={formData.clicks} onChange={handleChange} className="input-clean" disabled={isFormDisabled} /></div>
                        <div><label className="label-clean">PPC (€)</label><input type="number" step="0.01" name="pricePerClick" value={formData.pricePerClick} onChange={handleChange} className="input-clean" disabled={isFormDisabled} /></div>
                        <div><label className="label-clean">Views</label><input type="number" name="views" value={formData.views} onChange={handleChange} className="input-clean" disabled={isFormDisabled} /></div>
                        <div><label className="label-clean">Reach</label><input type="number" name="reach" value={formData.reach} onChange={handleChange} className="input-clean" disabled={isFormDisabled} /></div>
                        <div><label className="label-clean">Audience Notes</label><input type="text" name="audienceNotes" value={formData.audienceNotes} onChange={handleChange} className="input-clean" disabled={isFormDisabled} /></div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleAddCampaign}
                    className={`px-8 py-3 rounded-lg font-bold shadow-md transition transform hover:scale-105 ${isFormDisabled || !formData.name.trim() ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    disabled={isFormDisabled || !formData.name.trim()}
                >
                    + Добави Кампания
                </button>
            </div>
        </div>
    );
};

// --- ManageCampaignsList Component ---
const ManageCampaignsList = ({ db, userId, isAuthReady, campaigns }) => {
    const [editingCampaign, setEditingCampaign] = useState(null);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const handleEditClick = (campaign) => {
        setEditingCampaign({
            ...campaign,
            startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
            endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
            // Convert numbers to strings for inputs
            budget: String(campaign.budget || ''),
            clicks: String(campaign.clicks || ''),
            pricePerClick: String(campaign.pricePerClick || ''),
            views: String(campaign.views || ''),
            reach: String(campaign.reach || ''),
        });
    };

    const handleUpdateCampaign = async () => {
        if (!db || !userId || !isAuthReady || !editingCampaign || !editingCampaign.name.trim()) return;
        try {
            const campaignDocRef = doc(db, `artifacts/${appId}/public/data/campaigns`, editingCampaign.id);
            await updateDoc(campaignDocRef, {
                name: editingCampaign.name,
                status: editingCampaign.status,
                budget: parseFloat(editingCampaign.budget) || 0,
                startDate: editingCampaign.startDate,
                endDate: editingCampaign.endDate,
                targetAudience: editingCampaign.targetAudience,
                clicks: parseInt(editingCampaign.clicks) || 0,
                pricePerClick: parseFloat(editingCampaign.pricePerClick) || 0,
                views: parseInt(editingCampaign.views) || 0,
                reach: parseInt(editingCampaign.reach) || 0,
                audienceNotes: editingCampaign.audienceNotes,
                platform: editingCampaign.platform,
                postText: editingCampaign.postText,
                postConcept: editingCampaign.postConcept,
                postScript: editingCampaign.postScript,
            });
            setEditingCampaign(null);
        } catch (error) {
            console.error("Error updating campaign:", error);
        }
    };

    const handleDeleteCampaign = async (id) => {
        if (!window.confirm("Сигурни ли сте, че искате да изтриете тази кампания?")) return;
        try {
            const campaignDocRef = doc(db, `artifacts/${appId}/public/data/campaigns`, id);
            await deleteDoc(campaignDocRef);
        } catch (error) {
            console.error("Error deleting campaign:", error);
        }
    };

    const sortedCampaigns = [...campaigns].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
    });

    const isFormDisabled = !isAuthReady || !userId;

    return (
        <div>
            {sortedCampaigns.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <p className="text-slate-500">Няма намерени кампании.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedCampaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col">
                            
                            {/* HEADER */}
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-start">
                                {editingCampaign && editingCampaign.id === campaign.id ? (
                                    <input 
                                        value={editingCampaign.name} 
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })} 
                                        className="font-bold text-slate-700 bg-white border border-blue-300 rounded px-1 w-full"
                                    />
                                ) : (
                                    <div>
                                        <h3 className="font-bold text-slate-700 text-sm truncate w-48" title={campaign.name}>{campaign.name}</h3>
                                        <p className="text-[10px] text-slate-400">{campaign.platform || 'No Platform'}</p>
                                    </div>
                                )}
                                
                                {editingCampaign && editingCampaign.id === campaign.id ? (
                                    <select 
                                        value={editingCampaign.status} 
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value })}
                                        className="text-xs border rounded ml-2"
                                    >
                                        <option value="Planned">Planned</option>
                                        <option value="Active">Active</option>
                                        <option value="Completed">Done</option>
                                        <option value="Paused">Paused</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                                        ${campaign.status === 'Active' ? 'bg-green-100 text-green-700' :
                                          campaign.status === 'Completed' ? 'bg-purple-100 text-purple-700' :
                                          campaign.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-blue-100 text-blue-700'}`}>
                                        {campaign.status}
                                    </span>
                                )}
                            </div>

                            {/* BODY */}
                            <div className="p-4 flex-grow space-y-3 text-xs">
                                {editingCampaign && editingCampaign.id === campaign.id ? (
                                    // EDIT MODE
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><label className="text-[9px] font-bold text-slate-400">Budget</label><input type="number" value={editingCampaign.budget} onChange={e => setEditingCampaign({...editingCampaign, budget: e.target.value})} className="input-clean py-1" /></div>
                                            <div><label className="text-[9px] font-bold text-slate-400">Clicks</label><input type="number" value={editingCampaign.clicks} onChange={e => setEditingCampaign({...editingCampaign, clicks: e.target.value})} className="input-clean py-1" /></div>
                                        </div>
                                        <div><label className="text-[9px] font-bold text-slate-400">Audience</label><input type="text" value={editingCampaign.targetAudience} onChange={e => setEditingCampaign({...editingCampaign, targetAudience: e.target.value})} className="input-clean py-1" /></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><label className="text-[9px] font-bold text-slate-400">Start</label><input type="date" value={editingCampaign.startDate} onChange={e => setEditingCampaign({...editingCampaign, startDate: e.target.value})} className="input-clean py-1" /></div>
                                            <div><label className="text-[9px] font-bold text-slate-400">End</label><input type="date" value={editingCampaign.endDate} onChange={e => setEditingCampaign({...editingCampaign, endDate: e.target.value})} className="input-clean py-1" /></div>
                                        </div>
                                    </div>
                                ) : (
                                    // VIEW MODE
                                    <>
                                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                                            <div><span className="block text-[9px] text-slate-400 uppercase font-bold">Budget</span>€{campaign.budget || 0}</div>
                                            <div><span className="block text-[9px] text-slate-400 uppercase font-bold">Clicks</span>{campaign.clicks || 0}</div>
                                            <div><span className="block text-[9px] text-slate-400 uppercase font-bold">Reach</span>{campaign.reach || 0}</div>
                                            <div><span className="block text-[9px] text-slate-400 uppercase font-bold">PPC</span>€{campaign.pricePerClick || 0}</div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100">
                                            <p className="text-[9px] text-slate-400 uppercase font-bold">Target</p>
                                            <p className="text-slate-800 truncate">{campaign.targetAudience || '-'}</p>
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                                {editingCampaign && editingCampaign.id === campaign.id ? (
                                    <>
                                        <button onClick={() => setEditingCampaign(null)} className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                        <button onClick={handleUpdateCampaign} className="px-3 py-1 text-xs font-bold bg-green-500 text-white rounded hover:bg-green-600">Save</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleDeleteCampaign(campaign.id)} className="p-1 text-slate-400 hover:text-red-500 transition" disabled={isFormDisabled}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        <button onClick={() => handleEditClick(campaign)} className="px-3 py-1 text-xs font-bold bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-100 transition" disabled={isFormDisabled}>
                                            Manage
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Module ---
const MarketingHubModule = ({ db, userId, isAuthReady, campaigns }) => {
    const [activeSubTab, setActiveSubTab] = useState('Dashboard');

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 p-8 pb-20">
            {/* Global Style for this module */}
            <style>{`
                .label-clean { display: block; font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem; }
                .input-clean { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
                .input-clean:focus { border-color: #3b82f6; ring: 2px; ring-color: #bfdbfe; }
            `}</style>

            {/* Header */}
            <div className="w-full max-w-6xl mb-8 text-center">
                <div className="flex justify-center mb-4">
                    <img src={Logo} alt="Dynamax Logo" className="h-20 w-auto object-contain" onError={(e) => e.target.style.display='none'} />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Marketing Hub</h1>
                <p className="text-slate-500 mt-1">Център за управление на рекламни кампании и анализи.</p>
            </div>

            {/* Main Card Container */}
            <div className="bg-white w-full max-w-6xl shadow-xl rounded-lg overflow-hidden border border-slate-200">
                
                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
                    {['Dashboard', 'Add Campaign', 'Manage Campaigns'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveSubTab(tab)}
                            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors
                                ${activeSubTab === tab 
                                    ? 'bg-white text-blue-600 border-t-4 border-blue-600' 
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                        >
                            {tab === 'Add Campaign' ? '+ Добави Кампания' : tab === 'Manage Campaigns' ? 'Управление' : 'Табло (Dashboard)'}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-8 bg-slate-50/30 min-h-[500px]">
                    {activeSubTab === 'Dashboard' && <Dashboard campaigns={campaigns} />}
                    {activeSubTab === 'Add Campaign' && <AddCampaignForm db={db} userId={userId} isAuthReady={isAuthReady} />}
                    {activeSubTab === 'Manage Campaigns' && <ManageCampaignsList db={db} userId={userId} isAuthReady={isAuthReady} campaigns={campaigns} />}
                </div>
            </div>
        </div>
    );
};

export default MarketingHubModule;
