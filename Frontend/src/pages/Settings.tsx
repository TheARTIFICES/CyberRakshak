import { useState } from "react";
import SettingsTabs from "../components/settings/SettingsTabs";
import OrganizationTab from "../components/settings/OrganizationTab";
import UsersRolesTab from "../components/settings/UsersRolesTab";
import ProfileTab from "../components/settings/ProfileTab";
import PreferencesTab from "../components/settings/PreferencesTab";
import SecurityTab from "../components/settings/SecurityTab";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("organization");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Organization profile, access roles, preferences, and security controls."
      />

      <Card>
        <SettingsTabs active={activeTab} setActive={setActiveTab} />

        <div className="mt-6">
          {activeTab === "organization" && <OrganizationTab />}
          {activeTab === "users" && <UsersRolesTab />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "preferences" && <PreferencesTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>
      </Card>
    </div>
  );
};

export default Settings;
