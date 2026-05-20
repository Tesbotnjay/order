import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, BarChart3, Settings, LogOut, Crown } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { MelodyPixel } from '../template/MelodyPixel';

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/memberships', label: 'Membership', icon: Crown },
  { path: '/admin/orders', label: 'Transaksi', icon: ShoppingBag },
  { path: '/admin/analytics', label: 'Analitik', icon: BarChart3 },
  { path: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearSession } = useAdminStore();

  const handleLogout = () => {
    clearSession();
    navigate('/admin/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r-[3px] border-admin-border sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b-[2px] border-admin-border">
          <div className="w-10 h-10 bg-pink-light border-[3px] border-border rounded-xl flex items-center justify-center overflow-hidden shadow-[3px_3px_0_var(--color-sage)]">
            <MelodyPixel className="w-8 h-8 translate-y-1" animated={false} />
          </div>
          <div>
            <p className="font-pixel text-sm text-ink font-black">Admin Panel</p>
            <p className="text-xs text-ink/40 font-medium">Pixel Memories</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-pink-light border-[2px] border-border text-ink shadow-[3px_3px_0_var(--color-sage)]'
                    : 'text-ink/60 hover:bg-surface hover:text-ink border-2 border-transparent'
                }`}
              >
                <Icon size={18} className={active ? 'text-pink-deep' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6 border-t-[2px] border-admin-border pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-2 border-transparent hover:border-red-200"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-border z-50 flex">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold transition-colors ${
                active ? 'text-pink-deep' : 'text-ink/40'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold text-red-500"
        >
          <LogOut size={20} />
          Keluar
        </button>
      </nav>
    </>
  );
}
