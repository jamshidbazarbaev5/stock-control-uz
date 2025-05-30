import { 
  ShoppingBag,
  User2,
  List as ListView,
  Ruler,
  Package,
  ArrowLeftRight,
  Menu,
  X,
  UserCheck,
  Wallet,
  Receipt,
  PlusCircle,
  BanknoteIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLogout } from '../api/auth';
import { useCurrentUser } from '../hooks/useCurrentUser';


export default function Layout({ children }: any) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();

  // Set active submenu based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    navItems.forEach(item => {
      if (item.submenu && item.submenu.some(subItem => subItem.href === currentPath)) {
        setActiveSubmenu(item.id);
      }
    });
  }, [location.pathname]);
  const { t } = useTranslation();
  const logout = useLogout();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const navItems = [
    { icon: ArrowLeftRight, label: t('navigation.transfers'), href: '/transfers' },
    { icon: Package, label: t('navigation.stocks'), href: '/stock' },
    { icon: ShoppingBag, label: t('navigation.sale'), href: '/sales' },
    { icon: UserCheck, label: t('navigation.clients'), href: '/clients' },
    { icon: ShoppingBag, label: t('navigation.debt'), href: '/debts' },
    
    {
      icon: Wallet,
      label: t('navigation.finance'),
      id: 'finance',
      submenu: [
        { icon: Receipt, label: t('navigation.expense_name'), href: '/expense-name' },
        { icon: BanknoteIcon, label: t('navigation.expense'), href: '/expense' },
        { icon: PlusCircle, label: t('navigation.add_money'), href: '/finance' },
        { icon: Receipt, label: t('navigation.cash_inflow_names'), href: '/cash-inflow-names' },
        { icon: BanknoteIcon, label: t('navigation.income'), href: '/income' },
      ]
    },

    {
      icon: Package,
      label: t('navigation.settings'),
      id: 'settings',
      submenu: [
        { icon: ShoppingBag, label: t('navigation.stores'), href: '/stores' },
        { icon: ListView, label: t('navigation.categories'), href: '/categories' },
        { icon: Ruler, label: t('navigation.measurements'), href: '/measurements' },
        { icon: ShoppingBag, label: t('navigation.products'), href: '/products' },
        {icon: ArrowLeftRight, label: t('navigation.recyclings'), href: '/recyclings' },
        { icon: ListView, label: t('navigation.suppliers'), href: '/suppliers' },
        { icon: User2, label: t('navigation.users'), href: '/users' },
        //  { icon: ShoppingBag, label: t('navigation.staff'), href: '/staff' },

      ]
    },
  ];
  const handleLogout = () => {
    logout.mutate();  
    navigate('/login');
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-gray-800">
            Stock-control
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <User2 size={20} className="text-emerald-600" />
              </div>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg py-3 z-50">
                {currentUser && (
                  <div className="px-4 py-2 border-b mb-2">
                    <div className="font-medium text-gray-800">{currentUser.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{currentUser.phone_number}</div>
                    <div className="text-sm font-medium text-emerald-600 mt-1">{currentUser.role}</div>
                  </div>
                )}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <User2 size={16} />
                  {t('common.profile')}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <ArrowLeftRight size={16} />
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-gray-600" />
            ) : (
              <Menu size={24} className="text-gray-600" />
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row relative">
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div 
            // className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        {/* Sidebar - Desktop and Mobile */}
        <aside className={`
          ${mobileMenuOpen ? 'block' : 'hidden'}
          md:block
          w-full bg-white shadow-lg
          fixed md:sticky
          top-[3.5rem] md:top-0
          h-[calc(100vh-3.5rem)] md:h-screen
          z-50
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:w-20' : 'md:w-72'}
          flex-shrink-0
          overflow-hidden
        `}>
          {/* Desktop Logo and Language Switcher */}
          <div className="hidden md:block px-6 py-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-500">C</span>
                </div> */}
                {!isCollapsed && (
                  <div className="font-semibold text-gray-800">
                    Stock-control
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 flex flex-col overflow-y-auto bg-white relative z-50">
            {navItems.map((item, index) => (
              <div key={index}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => setActiveSubmenu(activeSubmenu === item.id ? null : item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left mb-1 transition-colors
                        ${activeSubmenu === item.id ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <item.icon size={20} className={activeSubmenu === item.id ? 'text-emerald-500' : 'text-gray-500'} />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium">{item.label}</span>
                          <svg
                            className={`ml-auto h-5 w-5 transform transition-transform ${activeSubmenu === item.id ? 'rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </button>
                    {activeSubmenu === item.id && (
                      <div className={`ml-2 ${isCollapsed ? 'absolute left-full top-0 ml-2 bg-white shadow-lg rounded-lg p-2 min-w-[200px] max-h-[80vh] overflow-y-auto' : ''}`}>
                        {item.submenu.map((subItem, subIndex) => (
                          <a
                            key={subIndex}
                            href={subItem.href}
                            onClick={(e) => {
                              e.preventDefault();
                              setMobileMenuOpen(false);
                              navigate(subItem.href);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left mb-1 transition-colors
                              ${location.pathname === subItem.href ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            <subItem.icon size={20} className={location.pathname === subItem.href ? 'text-emerald-500' : 'text-gray-500'} />
                            <span className="font-medium">{subItem.label}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      navigate(item.href);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left mb-1 transition-colors
                      ${location.pathname === item.href ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <item.icon size={20} className={location.pathname === item.href ? 'text-emerald-500' : 'text-gray-500'} />
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </a>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 transition-all duration-300 overflow-x-auto">
          <div className="h-full flex flex-col min-w-[320px]">
            <div className="bg-white px-4 md:px-6 py-4 flex items-center justify-end gap-4 sticky top-0 z-10">
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User2 size={20} className="text-emerald-600" />
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg py-3 z-50">
                    {currentUser && (
                      <div className="px-4 py-2 border-b mb-2">
                        <div className="font-medium text-gray-800">{currentUser.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{currentUser.phone_number}</div>
                        <div className="text-sm font-medium text-emerald-600 mt-1">{currentUser.role}</div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User2 size={16} />
                      {t('common.profile')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <ArrowLeftRight size={16} />
                      {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="max-w-[1920px] mx-auto">
                {children}
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
