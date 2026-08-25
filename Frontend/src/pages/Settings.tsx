import React, { useState } from "react";
import SettingsTabs from "../components/settings/SettingsTabs";
import ProfileTab from "../components/settings/ProfileTab";
import PreferencesTab from "../components/settings/PreferencesTab";
import SecurityTab from "../components/settings/SecurityTab";
import ConnectorsTab from "../components/settings/ConnectorsTab";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="opacity-70 text-sm">
          Manage your profile, preferences, and security controls.
        </p>
      </div>

      {/* Settings content container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <SettingsTabs active={activeTab} setActive={setActiveTab} />

        <div className="mt-6">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "preferences" && <PreferencesTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "connectors" && <ConnectorsTab />}
        </div>
      </div>

    </div>
  );
};

export default Settings;