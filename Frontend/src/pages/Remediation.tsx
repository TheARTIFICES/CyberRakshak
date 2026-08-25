import React, { useState } from "react";
import { Zap, Shield, Server, AlertTriangle, TrendingDown, CheckCircle, FileText } from "lucide-react";

const Remediation = () => {
  const [selectedVulnerability, setSelectedVulnerability] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "SYSTEM_TERMINAL >_ root@web-server-01",
  ]);
  
  // Mock vulnerability queue data
  const vulnerabilityQueue = [
    {
      id: 1,
      title: "Log4Shell RCE",
      asset: "Web-Server-01",
      riskScore: 980,
      criticality: "critical"
    },
    {
      id: 2,
      title: "Weak SSH Key",
      asset: "Gateway-04",
      riskScore: 840,
      criticality: "high"
    },
    {
      id: 3,
      title: "Exposed S3 Bucket",
      asset: "Cloud-Storage",
      riskScore: 720,
      criticality: "high"
    },
    {
      id: 4,
      title: "SQL Injection Point",
      asset: "DB-Server-02",
      riskScore: 950,
      criticality: "critical"
    },
    {
      id: 5,
      title: "Outdated SSL Cert",
      asset: "Mail-Server-05",
      riskScore: 620,
      criticality: "medium"
    }
  ];

  // Top stats data
  const topStats = [
    {
      title: "Critical Fixes Pending",
      value: "5",
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      color: "text-red-500"
    },
    {
      title: "Est. Risk Reduction",
      value: "-640 pts",
      icon: <TrendingDown className="w-5 h-5 text-green-500" />,
      color: "text-green-500"
    },
    {
      title: "Auto-Fix Readiness",
      value: "100%",
      icon: <CheckCircle className="w-5 h-5 text-blue-500" />,
      color: "text-blue-500"
    }
  ];

  // Get border color based on criticality
  const getBorderColor = (criticality: string) => {
    switch (criticality) {
      case "critical":
        return "border-l-red-500 dark:border-l-red-500";
      case "high":
        return "border-l-orange-500 dark:border-l-orange-500";
      case "medium":
        return "border-l-yellow-500 dark:border-l-yellow-500";
      default:
        return "border-l-gray-500 dark:border-l-gray-500";
    }
  };

  // Handle deploy fix button click
  const handleDeployFix = () => {
    setIsDeploying(true);
    setTerminalOutput(["SYSTEM_TERMINAL >_ root@web-server-01"]);
    
    // Simulate terminal output
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, "> Initializing patch deployment..."]);
    }, 500);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, "> Stopping vulnerable service... [OK]"]);
    }, 1000);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, "> Applying security patch... [OK]"]);
    }, 1500);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, "> Restarting services... [OK]"]);
    }, 2000);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, "> Verifying patch integrity... [OK]"]);
    }, 2500);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, "> Risk score reduced by 640 points"]);
    }, 3000);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, "> Deployment completed successfully"]);
      setIsDeploying(false);
    }, 3500);
  };

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Header - REMOVED */}
      <div className="flex justify-end mb-6">
        <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg shadow-lg transition flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Auto-Fix All Critical
        </button>
      </div>

      {/* Top Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {topStats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</div>
                <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* LEFT PANEL: THE THREAT QUEUE (4 cols) */}
        <div className="col-span-12 md:col-span-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">The Threat Queue</h2>
          <div className="space-y-3 h-full overflow-y-auto">
            {vulnerabilityQueue.map((vuln, index) => (
              <div 
                key={vuln.id}
                className={`bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 border-l-4 ${getBorderColor(vuln.criticality)} p-4 rounded-r-lg cursor-pointer transition-all ${
                  selectedVulnerability === index 
                    ? "ring-2 ring-cyan-500 dark:ring-cyan-500" 
                    : "hover:ring-1 hover:ring-cyan-300 dark:hover:ring-cyan-500"
                }`}
                onClick={() => setSelectedVulnerability(index)}
              >
                <div className="font-bold text-slate-900 dark:text-white">{vuln.title}</div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">Asset: {vuln.asset}</div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Risk Score: {vuln.riskScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: THE WORKSPACE (8 cols) */}
        <div className="col-span-12 md:col-span-8">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl p-6 h-full flex flex-col">
            {/* Zone A: RISK SIMULATION (Visual) */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Risk Impact Simulation</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Current Risk (Critical)</span>
                    <span className="font-medium">980</span>
                  </div>
                  <div className="h-6 bg-red-200 dark:bg-red-900/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: '90%' }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Post-Fix Risk (Low)</span>
                    <span className="font-medium">340</span>
                  </div>
                  <div className="h-6 bg-green-200 dark:bg-green-900/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full animate-pulse" 
                      style={{ width: '20%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone B: THE PLAYBOOK (The "Code Editor") */}
            <div className="mb-6 flex-grow">
              <div className="rounded-lg overflow-hidden shadow-lg">
                {/* Editor Header */}
                <div className="bg-gray-800 text-gray-200 text-sm font-mono px-4 py-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>patch_script.sh</span>
                </div>
                
                {/* Editor Body */}
                <div className="bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 h-40 overflow-y-auto">
                  <div className="text-green-400"># Step 1: Stop vulnerable service</div>
                  <div className="text-blue-400">sudo systemctl stop apache2</div>
                  <br />
                  <div className="text-green-400"># Step 2: Apply hotpatch</div>
                  <div className="text-blue-400">apt-get install --only-upgrade log4j</div>
                  <br />
                  <div className="text-green-400"># Step 3: Restart service</div>
                  <div className="text-blue-400">sudo systemctl start apache2</div>
                  <br />
                  <div className="text-green-400"># Step 4: Verify patch</div>
                  <div className="text-blue-400">log4j --version</div>
                </div>
              </div>
            </div>

            {/* Zone C: LIVE TERMINAL (The Action) */}
            <div className="flex-grow">
              <div className="rounded-lg overflow-hidden">
                {/* Terminal Header */}
                <div className="bg-gray-800 text-gray-200 text-sm font-mono px-4 py-2">
                  SYSTEM_TERMINAL {'>_'} root@web-server-01
                </div>
                
                {/* Terminal Body */}
                <div className="bg-black font-mono text-sm p-4 h-32 overflow-y-auto">
                  {terminalOutput.map((line, index) => (
                    <div key={index} className="text-green-400">
                      {line}
                      {index === terminalOutput.length - 1 && !isDeploying && (
                        <span className="ml-1 inline-block w-2 h-4 bg-green-400 animate-pulse"></span>
                      )}
                    </div>
                  ))}
                  {isDeploying && (
                    <div className="text-green-400">
                      {'>'} Deploying patch...
                      <span className="ml-1 inline-block w-2 h-4 bg-green-400 animate-pulse"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end mt-4">
              <button 
                className={`px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg shadow-lg transition flex items-center gap-2 ${
                  isDeploying ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleDeployFix}
                disabled={isDeploying}
              >
                <Zap className="w-5 h-5" />
                {isDeploying ? 'DEPLOYING...' : 'DEPLOY FIX'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Remediation;