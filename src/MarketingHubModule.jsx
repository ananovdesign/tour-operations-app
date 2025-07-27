import React, { useState, useEffect, useCallback } from 'react';
// We will assume Logo.png is accessible from the main App.jsx context,
// or ensure it's copied to a shared assets folder.
import Logo from './Logo.png'; 

// Import Firebase operations directly from the main app's Firebase setup
// We are REMOVING the FirebaseContext, FirebaseProvider, and useFirebase hook from here.
// These props will now be passed down from the main App.jsx
import { collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';


// Navbar Component for Marketing Hub's internal navigation
// This Navbar will be used *inside* the MarketingHubModule, not replacing the main app's sidebar.
const MarketingNavbar = ({ activeTab, setActiveTab }) => {
    // Logout function will be handled by the main app's Navbar, not this internal one.
    // So, we remove the useFirebase() and logout call from here.

    const navItems = [
        { name: 'Dashboard', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
            </svg>
        )},
        { name: 'Add Campaign', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" />
            </svg>
        )},
        { name: 'Manage Campaigns', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3ZM12 3a.75.75 0 0 0-.75.75V6a.75.75 0 0 0 1.5 0V3.75A.75.75 0 0 0 12 3ZM12 15a.75.75 0 0 0-.75.75v2.25a.75.75 0 0 0 1.5 0V15.75A.75.75 0 0 0 12 15ZM12 9a.75.75 0 0 0-.75.75v2.25a.75.75 0 0 0 1.5 0V9.75A.75.75 0 0 0 12 9Z" />
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM4.5 12a7.5 7.5 0 0 0 7.5 7.5V4.5a7.5 7.5 0 0 0-7.5 7.5Z" clipRule="evenodd" />
            </svg>
        )},
    ];

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 shadow-lg rounded-b-lg flex justify-center items-center">
            <div className="container mx-auto flex flex-wrap justify-center gap-4">
                {navItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => setActiveTab(item.name)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ease-in-out
                            ${activeTab === item.name
                                ? 'bg-white text-blue-700 shadow-md transform scale-105'
                                : 'text-white hover:bg-blue-700 hover:shadow-md'
                            }`}
                    >
                        {item.icon}
                        <span className="font-semibold">{item.name}</span>
                    </button>
                ))}
            </div>
            {/* Logout button here is removed as it will be in the main app's sidebar */}
        </nav>
    );
};

// Dashboard Component
const Dashboard = ({ campaigns }) => { // campaigns received as prop
    // Filter for completed campaigns
    const completedCampaigns = campaigns.filter(c => c.status === 'Completed');
    const numberOfCompletedCampaigns = completedCampaigns.length;

    // Calculate metrics only from completed campaigns
    const budgetSpent = completedCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

    const totalClicks = completedCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const avgClicks = numberOfCompletedCampaigns > 0 ? (totalClicks / numberOfCompletedCampaigns).toFixed(0) : 'N/A';

    const totalPPC = completedCampaigns.reduce((sum, c) => sum + (c.pricePerClick || 0), 0);
    const avgPPC = numberOfCompletedCampaigns > 0 ? (totalPPC / numberOfCompletedCampaigns).toFixed(2) : 'N/A';

    const totalViews = completedCampaigns.reduce((sum, c) => sum + (c.views || 0), 0);
    const avgViews = numberOfCompletedCampaigns > 0 ? (totalViews / numberOfCompletedCampaigns).toFixed(0) : 'N/A';

    const totalReach = completedCampaigns.reduce((sum, c) => sum + (c.reach || 0), 0);
    const avgReach = numberOfCompletedCampaigns > 0 ? (totalReach / numberOfCompletedCampaigns).toFixed(0) : 'N/A';

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview (Completed Campaigns)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
                    <h3 className="text-xl font-semibold text-blue-700 mb-2">Total Completed Campaigns</h3>
                    <p className="text-4xl font-bold text-blue-900">{numberOfCompletedCampaigns}</p>
                    <p className="text-gray-600 mt-2">Number of campaigns with 'Completed' status.</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
                    <h3 className="text-xl font-semibold text-green-700 mb-2">Budget Spent</h3>
                    <p className="text-4xl font-bold text-green-900">€{budgetSpent.toFixed(2)}</p>
                    <p className="text-gray-600 mt-2">Total budget for completed campaigns.</p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
                    <h3 className="text-xl font-semibold text-yellow-700 mb-2">Average Clicks</h3>
                    <p className="text-4xl font-bold text-yellow-900">{avgClicks}</p>
                    <p className="text-gray-600 mt-2">Average clicks across completed campaigns.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-200">
                    <h3 className="text-xl font-semibold text-purple-700 mb-2">Average Price per Click</h3>
                    <p className="text-4xl font-bold text-purple-900">€{avgPPC}</p>
                    <p className="text-gray-600 mt-2">Average cost per click for completed campaigns.</p>
                </div>
                <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
                    <h3 className="text-xl font-semibold text-red-700 mb-2">Average Views</h3>
                    <p className="text-4xl font-bold text-red-900">{avgViews}</p>
                    <p className="text-gray-600 mt-2">Average views across completed campaigns.</p>
                </div>
                <div className="bg-indigo-50 p-6 rounded-lg shadow-sm border border-indigo-200">
                    <h3 className="text-xl font-semibold text-indigo-700 mb-2">Average Reach</h3>
                    <p className="text-4xl font-bold text-indigo-900">{avgReach}</p>
                    <p className="text-gray-600 mt-2">Average reach across completed campaigns.</p>
                </div>
            </div>
        </div>
    );
};

// AddCampaignForm Component
const AddCampaignForm = ({ db, userId, isAuthReady }) => { // db, userId, isAuthReady received as props
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignStatus, setNewCampaignStatus] = useState('Planned');
    const [newCampaignBudget, setNewCampaignBudget] = useState('');
    const [newCampaignStartDate, setNewCampaignStartDate] = useState('');
    const [newCampaignEndDate, setNewCampaignEndDate] = useState('');
    const [newCampaignTargetAudience, setNewCampaignTargetAudience] = useState('');
    const [newCampaignClicks, setNewCampaignClicks] = useState('');
    const [newCampaignPricePerClick, setNewCampaignPricePerClick] = useState('');
    const [newCampaignViews, setNewCampaignViews] = useState('');
    const [newCampaignReach, setNewCampaignReach] = useState('');
    const [newCampaignAudienceNotes, setNewCampaignAudienceNotes] = useState('');
    const [newCampaignPlatform, setNewCampaignPlatform] = useState('');
    const [newCampaignPostText, setNewCampaignPostText] = useState('');
    const [newCampaignPostConcept, setNewCampaignPostConcept] = useState('');
    const [newCampaignPostScript, setNewCampaignPostScript] = useState('');

    // appId needs to come from the main app's context or prop
    // For now, keep the fallback or define it if you know it's always available globally
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; 

    const handleAddCampaign = async () => {
        if (!db || !userId || !isAuthReady || !newCampaignName.trim()) {
            console.error("Cannot add campaign: Firestore not ready, user not authenticated, or campaign name is empty.");
            return;
        }
        try {
            const campaignsCollectionRef = collection(db, `artifacts/${appId}/public/data/campaigns`);
            await addDoc(campaignsCollectionRef, {
                name: newCampaignName,
                status: newCampaignStatus,
                budget: newCampaignBudget ? parseFloat(newCampaignBudget) : 0, // Convert to number
                startDate: newCampaignStartDate,
                endDate: newCampaignEndDate,
                targetAudience: newCampaignTargetAudience,
                clicks: newCampaignClicks ? parseInt(newCampaignClicks) : 0, // Convert to number
                pricePerClick: newCampaignPricePerClick ? parseFloat(newCampaignPricePerClick) : 0, // Convert to number
                views: newCampaignViews ? parseInt(newCampaignViews) : 0, // Convert to number
                reach: newCampaignReach ? parseInt(newCampaignReach) : 0, // Convert to number
                audienceNotes: newCampaignAudienceNotes,
                platform: newCampaignPlatform,
                postText: newCampaignPostText,
                postConcept: newCampaignPostConcept,
                postScript: newCampaignPostScript,
                createdAt: new Date().toISOString(),
                createdBy: userId,
            });
            // Reset form fields
            setNewCampaignName('');
            setNewCampaignStatus('Planned');
            setNewCampaignBudget('');
            setNewCampaignStartDate('');
            setNewCampaignEndDate('');
            setNewCampaignTargetAudience('');
            setNewCampaignClicks('');
            setNewCampaignPricePerClick('');
            setNewCampaignViews('');
            setNewCampaignReach('');
            setNewCampaignAudienceNotes('');
            setNewCampaignPlatform('');
            setNewCampaignPostText('');
            setNewCampaignPostConcept('');
            setNewCampaignPostScript('');

            console.log("Campaign added successfully!");
        } catch (error) {
            console.error("Error adding campaign:", error);
        }
    };

    const isFormDisabled = !isAuthReady || !userId;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Add New Campaign</h2>
            <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Campaign Name"
                        value={newCampaignName}
                        onChange={(e) => setNewCampaignName(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <select
                        value={newCampaignStatus}
                        onChange={(e) => setNewCampaignStatus(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    >
                        <option value="Planned">Planned</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Paused">Paused</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Budget (€)"
                        value={newCampaignBudget}
                        onChange={(e) => setNewCampaignBudget(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <input
                        type="date"
                        placeholder="Start Date"
                        value={newCampaignStartDate}
                        onChange={(e) => setNewCampaignStartDate(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <input
                        type="date"
                        placeholder="End Date"
                        value={newCampaignEndDate}
                        onChange={(e) => setNewCampaignEndDate(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <input
                        type="text"
                        placeholder="Target Audience (e.g., 'Young Adults')"
                        value={newCampaignTargetAudience}
                        onChange={(e) => setNewCampaignTargetAudience(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <input
                        type="number"
                        placeholder="Clicks"
                        value={newCampaignClicks}
                        onChange={(e) => setNewCampaignClicks(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <input
                        type="number"
                        step="0.01" // Allow decimal for price
                        placeholder="Price per Click (€)"
                        value={newCampaignPricePerClick}
                        onChange={(e) => setNewCampaignPricePerClick(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <input
                        type="number"
                        placeholder="Views"
                        value={newCampaignViews}
                        onChange={(e) => setNewCampaignViews(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <input
                        type="number"
                        placeholder="Reach"
                        value={newCampaignReach}
                        onChange={(e) => setNewCampaignReach(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <input
                        type="text"
                        placeholder="Audience Notes (e.g., 'Male, 18-24, interests in tech')"
                        value={newCampaignAudienceNotes}
                        onChange={(e) => setNewCampaignAudienceNotes(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    />
                    <select
                        value={newCampaignPlatform}
                        onChange={(e) => setNewCampaignPlatform(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={isFormDisabled}
                    >
                        <option value="">Select Platform</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Instagram/Facebook">Instagram/Facebook</option>
                        <option value="Other">Other</option>
                    </select>
                    <textarea
                        placeholder="Post Text"
                        value={newCampaignPostText}
                        onChange={(e) => setNewCampaignPostText(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 col-span-full"
                        rows="3"
                        disabled={isFormDisabled}
                    ></textarea>
                    <textarea
                        placeholder="Post Concept"
                        value={newCampaignPostConcept}
                        onChange={(e) => setNewCampaignPostConcept(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 col-span-full"
                        rows="3"
                        disabled={isFormDisabled}
                    ></textarea>
                    <textarea
                        placeholder="Post Script"
                        value={newCampaignPostScript}
                        onChange={(e) => setNewCampaignPostScript(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 col-span-full"
                        rows="3"
                        disabled={isFormDisabled}
                    ></textarea>
                </div>
                <button
                    onClick={handleAddCampaign}
                    className={`mt-6 w-full px-6 py-3 font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform
                        ${isFormDisabled || !newCampaignName.trim()
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                        }`}
                    disabled={isFormDisabled || !newCampaignName.trim()}
                >
                    Add Campaign
                </button>
                {isFormDisabled && (
                    <p className="text-red-600 text-sm mt-2">
                        Please ensure you are logged in to add campaigns.
                    </p>
                )}
            </div>
        </div>
    );
};

// ManageCampaignsList Component (formerly Campaigns component)
const ManageCampaignsList = ({ db, userId, isAuthReady, campaigns }) => { // db, userId, isAuthReady, campaigns received as props

    const [editingCampaign, setEditingCampaign] = useState(null); // Stores campaign being edited

    // appId needs to come from the main app's context or prop
    // For now, keep the fallback or define it if you know it's always available globally
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Start editing a campaign
    const handleEditClick = (campaign) => {
        setEditingCampaign({
            ...campaign,
            // Ensure dates are formatted for input type="date"
            startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
            endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
            // Ensure numeric fields are strings for input value
            budget: campaign.budget !== undefined ? String(campaign.budget) : '',
            clicks: campaign.clicks !== undefined ? String(campaign.clicks) : '',
            pricePerClick: campaign.pricePerClick !== undefined ? String(campaign.pricePerClick) : '',
            views: campaign.views !== undefined ? String(campaign.views) : '',
            reach: campaign.reach !== undefined ? String(campaign.reach) : '',
        });
    };

    // Update a campaign
    const handleUpdateCampaign = async () => {
        if (!db || !userId || !isAuthReady || !editingCampaign || !editingCampaign.name.trim()) {
            console.error("Cannot update campaign: Firestore not ready, user not authenticated, or campaign data is invalid.");
            return;
        }
        try {
            const campaignDocRef = doc(db, `artifacts/${appId}/public/data/campaigns`, editingCampaign.id);
            await updateDoc(campaignDocRef, {
                name: editingCampaign.name,
                status: editingCampaign.status,
                budget: editingCampaign.budget ? parseFloat(editingCampaign.budget) : 0,
                startDate: editingCampaign.startDate,
                endDate: editingCampaign.endDate,
                targetAudience: editingCampaign.targetAudience,
                clicks: editingCampaign.clicks ? parseInt(editingCampaign.clicks) : 0,
                pricePerClick: editingCampaign.pricePerClick ? parseFloat(editingCampaign.pricePerClick) : 0,
                views: editingCampaign.views ? parseInt(editingCampaign.views) : 0,
                reach: editingCampaign.reach ? parseInt(editingCampaign.reach) : 0,
                audienceNotes: editingCampaign.audienceNotes,
                platform: editingCampaign.platform,
                postText: editingCampaign.postText,
                postConcept: editingCampaign.postConcept,
                postScript: editingCampaign.postScript,
            });
            setEditingCampaign(null); // Exit editing mode
            console.log("Campaign updated successfully!");
        } catch (error) {
            console.error("Error updating campaign:", error);
        }
    };

    // Delete a campaign
    const handleDeleteCampaign = async (id) => {
        if (!db || !userId || !isAuthReady) {
            console.error("Cannot delete campaign: Firestore not ready or user not authenticated.");
            return;
        }
        // Implement a simple confirmation dialog (not alert)
        if (window.confirm("Are you sure you want to delete this campaign?")) {
            try {
                const campaignDocRef = doc(db, `artifacts/${appId}/public/data/campaigns`, id);
                await deleteDoc(campaignDocRef);
                console.log("Campaign deleted successfully!");
            } catch (error) {
                console.error("Error deleting campaign:", error);
            }
        }
    };

    // Sort campaigns by creation date (client-side)
    const sortedCampaigns = [...campaigns].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
    });

    const isFormDisabled = !isAuthReady || !userId; // Used for disabling edit/delete buttons if not authenticated

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Campaigns</h2>
            {sortedCampaigns.length === 0 ? (
                <p className="text-gray-600">No campaigns found. Go to "Add Campaign" to create one!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedCampaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg shadow-md p-6 flex flex-col justify-between transition-transform duration-200 hover:scale-[1.02]">
                            {editingCampaign && editingCampaign.id === campaign.id ? (
                                // Edit Form within Card
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editingCampaign.name}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <select
                                        value={editingCampaign.status}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    >
                                        <option value="Planned">Planned</option>
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Paused">Paused</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Budget (€)"
                                        value={editingCampaign.budget}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, budget: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <input
                                        type="date"
                                        value={editingCampaign.startDate}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <input
                                        type="date"
                                        value={editingCampaign.endDate}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Target Audience"
                                        value={editingCampaign.targetAudience}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, targetAudience: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Clicks"
                                        value={editingCampaign.clicks}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, clicks: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="PPC (€)"
                                        value={editingCampaign.pricePerClick}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, pricePerClick: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Views"
                                        value={editingCampaign.views}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, views: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Reach"
                                        value={editingCampaign.reach}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, reach: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Audience Notes"
                                        value={editingCampaign.audienceNotes}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, audienceNotes: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    />
                                    <select
                                        value={editingCampaign.platform}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, platform: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        disabled={isFormDisabled}
                                    >
                                        <option value="">Select Platform</option>
                                        <option value="TikTok">TikTok</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="Instagram/Facebook">Instagram/Facebook</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <textarea
                                        placeholder="Post Text"
                                        value={editingCampaign.postText}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, postText: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        rows="2"
                                        disabled={isFormDisabled}
                                    ></textarea>
                                    <textarea
                                        placeholder="Post Concept"
                                        value={editingCampaign.postConcept}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, postConcept: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        rows="2"
                                        disabled={isFormDisabled}
                                    ></textarea>
                                    <textarea
                                        placeholder="Post Script"
                                        value={editingCampaign.postScript}
                                        onChange={(e) => setEditingCampaign({ ...editingCampaign, postScript: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        rows="2"
                                        disabled={isFormDisabled}
                                    ></textarea>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={handleUpdateCampaign}
                                            className={`px-4 py-2 rounded-md transition duration-200 text-sm
                                                ${isFormDisabled || !editingCampaign.name.trim()
                                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                                }`}
                                            disabled={isFormDisabled || !editingCampaign.name.trim()}
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingCampaign(null)}
                                            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition duration-200 text-sm"
                                            disabled={isFormDisabled}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Display Card
                                <div className="flex flex-col h-full">
                                    <div className="flex-grow space-y-2 mb-4">
                                        <h3 className="text-xl font-bold text-blue-700">{campaign.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            Status: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                                                ${campaign.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                                                ${campaign.status === 'Planned' ? 'bg-blue-100 text-blue-800' : ''}
                                                ${campaign.status === 'Completed' ? 'bg-purple-100 text-purple-800' : ''}
                                                ${campaign.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            `}>
                                                {campaign.status}
                                            </span>
                                        </p>
                                        <p className="text-gray-700">Budget: €{campaign.budget || 'N/A'}</p>
                                        <p className="text-gray-700">Dates: {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}</p>
                                        <p className="text-gray-700">Platform: {campaign.platform || 'N/A'}</p>
                                        <p className="text-gray-700">Target: {campaign.targetAudience || 'N/A'}</p>
                                        <p className="text-gray-700">Audience Notes: {campaign.audienceNotes || 'N/A'}</p>
                                        <p className="text-gray-700">Clicks: {campaign.clicks || 'N/A'}</p>
                                        <p className="text-gray-700">PPC: €{campaign.pricePerClick || 'N/A'}</p>
                                        <p className="text-gray-700">Views: {campaign.views || 'N/A'}</p>
                                        <p className="text-gray-700">Reach: {campaign.reach || 'N/A'}</p>
                                        <div className="text-sm text-gray-700 mt-2">
                                            <p className="font-semibold">Post Text:</p>
                                            <p className="text-xs max-h-16 overflow-y-auto border border-gray-200 rounded p-2">{campaign.postText || 'N/A'}</p>
                                        </div>
                                        <div className="text-sm text-gray-700 mt-2">
                                            <p className="font-semibold">Post Concept:</p>
                                            <p className="text-xs max-h-16 overflow-y-auto border border-gray-200 rounded p-2">{campaign.postConcept || 'N/A'}</p>
                                        </div>
                                        <div className="text-sm text-gray-700 mt-2">
                                            <p className="font-semibold">Post Script:</p>
                                            <p className="text-xs max-h-16 overflow-y-auto border border-gray-200 rounded p-2">{campaign.postScript || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={() => handleEditClick(campaign)}
                                            className={`px-4 py-2 rounded-md transition duration-200 text-sm
                                                ${isFormDisabled
                                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                }`}
                                            disabled={isFormDisabled}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCampaign(campaign.id)}
                                            className={`px-4 py-2 rounded-md transition duration-200 text-sm
                                                ${isFormDisabled
                                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                                    : 'bg-red-500 text-white hover:bg-red-600'
                                                }`}
                                            disabled={isFormDisabled}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// MarketingHubModule will encapsulate the internal navigation and components of the Marketing Hub
const MarketingHubModule = ({ db, userId, isAuthReady, campaigns }) => {
    // State for the Marketing Hub's internal tabs
    const [activeSubTab, setActiveSubTab] = useState('Dashboard');

    // Function to render content based on active internal tab
    const renderContent = () => {
        switch (activeSubTab) {
            case 'Dashboard':
                return <Dashboard campaigns={campaigns} />;
            case 'Add Campaign':
                return <AddCampaignForm db={db} userId={userId} isAuthReady={isAuthReady} />;
            case 'Manage Campaigns':
                return <ManageCampaignsList db={db} userId={userId} isAuthReady={isAuthReady} campaigns={campaigns} />;
            default:
                return <Dashboard campaigns={campaigns} />;
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                {/* Logo added here */}
                <img src={Logo} alt="Dynamax Logo" className="mx-auto mb-4 w-32 h-auto rounded-full shadow-lg" />
                <h1 className="text-5xl font-extrabold text-blue-800 leading-tight mb-2">
                    Marketing Hub
                </h1>
                <p className="text-xl text-gray-600">Your all-in-one solution for marketing management.</p>
                {/* User status display will be handled by the main app, or pass currentUser as a prop if needed here */}
            </header>

            <MarketingNavbar activeTab={activeSubTab} setActiveTab={setActiveSubTab} />

            <main className="mt-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default MarketingHubModule;
