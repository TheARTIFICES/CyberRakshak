import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-black py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-white font-bold text-xl mb-4">CyberRakshak</h3>
            <p className="text-gray-400 text-sm">
              Sovereign AI defense for the modern enterprise.
            </p>
          </div>
          
          <div className="col-span-1">
            <h4 className="text-cyan-400 font-semibold uppercase text-sm mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Solutions</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="text-cyan-400 font-semibold uppercase text-sm mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">API Reference</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Guides</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="text-cyan-400 font-semibold uppercase text-sm mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">© 2025 CyberRakshak Security. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-4 md:mt-0">
            Engineered by <span className="text-cyan-400 font-medium">The ARTIFICES</span>
          </p>
        </div>
      </div>
    </footer>
  );
}