import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
