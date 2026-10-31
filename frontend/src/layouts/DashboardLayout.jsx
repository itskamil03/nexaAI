import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import NewInvestmentModal from '../components/NewInvestmentModal';
import DepositModal from '../components/DepositModal';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      {/* Sidebar (Desktop sticky / Mobile drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Navbar
          onOpenInvest={() => setInvestModalOpen(true)}
          onOpenDeposit={() => setDepositModalOpen(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet
            context={{
              onOpenInvest: () => setInvestModalOpen(true),
              onOpenDeposit: () => setDepositModalOpen(true),
            }}
          />
        </main>
      </div>

      {/* Global Modals */}
      <NewInvestmentModal
        isOpen={investModalOpen}
        onClose={() => setInvestModalOpen(false)}
        onOpenDeposit={() => setDepositModalOpen(true)}
      />

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />
    </div>
  );
}
