import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Map as MapIcon, Shield, Activity, Users, Settings, LogIn, ChevronRight,
    Car, Bell, PowerOff, Battery, Thermometer, Box, Database,
    LogOut, Crosshair, ArrowRight, CheckCircle2, AlertTriangle, PlayCircle,
    FileText, CreditCard, Droplet, LayoutDashboard, Zap, Menu, X, Hexagon, Route as RouteIcon,
    TrendingDown, CheckSquare, Wrench, FolderOpen, UserCircle, Briefcase, Share2, FileWarning, Smartphone, Monitor
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- CUSTOM MAP MARKERS (Standard 2D Directional) ---
const createIcon = (color, heading) => {
    const svg = `
    < svg width = "36" height = "36" viewBox = "0 0 36 36" fill = "none" xmlns = "http://www.w3.org/2000/svg" >
      <circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>
      <path d="M18 8L26 26L18 22L10 26L18 8Z" fill="${color}"/>
    </svg >
    `;
    return L.divIcon({
        html: `< div style = "transform: rotate(${heading}deg); transition: transform 0.3s linear; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));" > ${svg}</div > `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
};

// --- MOCK DATA ---
const MOCK_FLEET = [
    { id: '1', name: 'Delivery Van A', type: 'van', status: 'moving', speed: 65, heading: 45, lat: 34.0522, lng: -118.2437, fuel: 82, temp: 18, color: '#10b981', driver: 'John D.', aiScore: 92, ais140: true },
    { id: '2', name: 'Exec Car 1', type: 'car', status: 'idle', speed: 0, heading: 120, lat: 34.0480, lng: -118.2500, fuel: 45, temp: 22, color: '#f59e0b', driver: 'Sarah W.', aiScore: 88, ais140: false },
    { id: '3', name: 'Heavy Truck B', type: 'truck', status: 'offline', speed: 0, heading: 0, lat: 34.0600, lng: -118.2300, fuel: 12, temp: 4, color: '#64748b', driver: 'Mike T.', aiScore: 74, ais140: true }
];

const MOCK_FUEL_DATA = [
    { time: '08:00', fuel: 90 }, { time: '10:00', fuel: 85 }, { time: '12:00', fuel: 80 },
    { time: '14:00', fuel: 75 }, { time: '16:00', fuel: 30 }, { time: '18:00', fuel: 100 } // Noticeable sudden drop then fill up
];

const MOCK_ALERTS = [
    { id: 4, type: 'critical', message: 'SOS Panic Button Pressed', vehicle: 'Delivery Van A', time: '14:15 PM' },
    { id: 1, type: 'critical', message: 'Sudden Fuel Drop (-45L in 2 mins)', vehicle: 'Heavy Truck B', time: '14:05 PM' },
    { id: 2, type: 'warning', message: 'Harsh Braking Event', vehicle: 'Delivery Van A', time: '13:22 PM' },
    { id: 3, type: 'info', message: 'Geofence Exit: Warehouse', vehicle: 'Exec Car 1', time: '09:00 AM' },
];

// --- COMPONENTS ---

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Background Gradient Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

            <header className="px-8 py-6 flex justify-between items-center z-10 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-dark-bg/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-500 p-2 rounded-lg"><MapIcon className="text-white" size={24} /></div>
                    <h2 className="text-2xl font-bold tracking-tight">GeoSurePath <span className="text-brand-500">Enterprise</span></h2>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="font-medium hover:text-brand-500 transition-colors hidden md:block">Client Demo</Link>
                    <Link to="/login" className="btn-primary gap-2">Login Portal <ArrowRight size={18} /></Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center pt-24 pb-16 px-6 z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 font-medium text-sm border border-brand-500/20 mb-6">
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" /> Zero-Delay Live TCP Engine 2.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                        The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-500">White-Label</span><br />
                        GPS SaaS Platform
                    </h1>

                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Enterprise-grade hardware agnostic telematics. Features 1-click ignition cuts, SMS remote configs, AI eco-scoring, and multi-tenant billing. Built for scale.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="btn-primary text-lg px-8 py-4 gap-2"><PlayCircle /> View Live Demo</button>
                        <button className="btn-secondary text-lg px-8 py-4">Register Reseller</button>
                    </div>
                </motion.div>

                {/* Premium Feature Grid */}
                <motion.div
                    className="grid md:grid-cols-3 gap-6 mt-24 max-w-6xl w-full"
                    initial="hidden" animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                >
                    {[
                        { icon: <Activity className="text-brand-500" size={28} />, title: 'Zero-Delay WebSockets', desc: 'Direct Redis-to-UI streaming bypassing disk I/O for instantaneous marker updates.' },
                        { icon: <PowerOff className="text-red-500" size={28} />, title: '1-Click Engine Blocks', desc: 'Secure immobilization via UI with integrated speed-safety checks and hardware ACK.' },
                        { icon: <Users className="text-blue-500" size={28} />, title: 'Strict Multi-Tenancy', desc: 'Reseller hierarchy. End-clients only see sanitized mapped data, never raw IMEIs.' }
                    ].map((f, i) => (
                        <motion.div key={i} className="glass-panel p-8 text-left hover:-translate-y-1 transition-transform duration-300" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <div className="bg-slate-100 dark:bg-slate-800 w-14 h-14 rounded-xl flex items-center justify-center mb-6">{f.icon}</div>
                            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Cinematic Animation Prompts Section */}
                <motion.div
                    className="max-w-6xl mx-auto mt-32 text-left w-full"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-800 dark:text-white">
                            See the Platform in <span className="text-brand-500">Action</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                            Watch our cinematic explainers demonstrating the power of the GeoSurePath ecosystem, from hardware installation to master admin control.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Prompt 1 */}
                        <div className="glass-panel p-8 md:p-10 border-t-8 border-brand-500 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Monitor size={120} /></div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Video 1</span>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Features & Specifications</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-8 italic">Style: High-end isometric 3D / cinematic cartoon. Vibrant lighting, glassmorphism aesthetic.</p>

                            <div className="space-y-6 relative z-10">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-brand-500 flex items-center gap-2 mb-2"><LayoutDashboard size={18} /> Scene 1: Master Dashboard</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Camera swoops into a sleek control room. Fleet Manager views glowing holographic UI with sharp metrics & translucent panels.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-brand-500 flex items-center gap-2 mb-2"><MapIcon size={18} /> Scene 2: Live Tracking & AIS-140</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">3D isometric cartoon city. 3D trucks navigate roads with glowing "AIS-140 CERTIFIED" shields and green satellite links.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-brand-500 flex items-center gap-2 mb-2"><Hexagon size={18} /> Scene 3: Geofences & Corridors</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">A glowing blue dome forms over a warehouse, and a purple path traces a highway. A truck deviates, triggering a bright red alert.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-brand-500 flex items-center gap-2 mb-2"><Bell size={18} /> Scene 4: Alerts & Notifications</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Red bell shakes with sound wave effects. Split screen: Admin dashboard flashes, while a driver's smartphone lights up with an SMS push.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-brand-500 flex items-center gap-2 mb-2"><FileText size={18} /> Scene 5: Reports & Matrix</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Digital data transforms into physical PDF/Excel reports. Admin toggles a slider, instantly "suspending" a vehicle's tracking beam.</p>
                                </div>
                            </div>
                        </div>

                        {/* Prompt 2 */}
                        <div className="glass-panel p-8 md:p-10 border-t-8 border-blue-500 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Box size={120} /></div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Video 2</span>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Hardware & Registration</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-8 italic">Style: 2D vector animation + polished 3D close-ups. Educational, technical but approachable vibe.</p>

                            <div className="space-y-6 relative z-10">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-2"><Box size={18} /> Scene 1: Hardware Unboxing</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Exploded 3D cinematic view of the GeoSurePath Tracker. Casing separates to show circuit board and SIM slot. Laser etches 15-Digit IMEI.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-2"><Wrench size={18} /> Scene 2: Wiring & Installation</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Mechanic connects glowing Red (Power), Black (Ground), Yellow (Ignition) wires under a truck's dashboard. LED lights blink blue & green.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-2"><Database size={18} /> Scene 3: Admin Whitelisting</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Super Admin types 15-digit IMEI and 13-digit SIM into the Secure Device Inventory and clicks "Whitelist Device". Green checkmark appears.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-2"><Smartphone size={18} /> Scene 4: Client Smart Registration</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Delivery Client types their IMEI into the Mobile App. AI visually links the database to the phone, and SIM details auto-fill magically.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-2"><Car size={18} /> Scene 5: Bind & Go-Live</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Client clicks "Bind & Activate". A digital handshake appears. Engine roars to life, and the truck instantly populates as a moving dot on the map.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

const LoginPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-dark-bg p-4">
            {/* Abstract map lines bg */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83v58.34h-58.34v-.83l58.34-58.34z\' fill=\'%23000000\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />

            <motion.div className="glass-panel w-full max-w-md p-10 z-10" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 mb-4">
                        <MapIcon className="text-brand-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Sign In to Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back to GeoSurePath</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input type="email" placeholder="admin@GeoSurePath.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
                    </div>

                    <div className="pt-4 grid grid-cols-2 gap-3">
                        <button className="btn-secondary w-full justify-center" onClick={() => navigate('/client')}>Login as Client</button>
                        <button className="btn-primary w-full justify-center" onClick={() => navigate('/admin')}>Login as Admin</button>
                    </div>
                    <div className="text-center mt-6">
                        <span className="text-slate-500 text-sm">Don't have an account? <button onClick={() => navigate('/register')} className="font-bold text-brand-500 hover:underline">Register New Device</button></span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const RegistrationPage = () => {
    const navigate = useNavigate();
    const [imei, setImei] = useState('');
    const [sim, setSim] = useState('');
    const [error, setError] = useState(false);

    // Simulated check against Device Inventory DB
    const MOCK_INVENTORY = { '863012938475102': '8991203049581' };

    const handleImeiCheck = (val) => {
        setImei(val);
        if (val.length >= 15) {
            if (MOCK_INVENTORY[val]) {
                setSim(MOCK_INVENTORY[val]);
                setError(false);
            } else {
                setSim('');
                setError(true);
            }
        } else {
            setError(false);
            setSim('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-dark-bg p-4">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83v58.34h-58.34v-.83l58.34-58.34z\' fill=\'%23000000\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />
            <motion.div className="glass-panel w-full max-w-lg p-10 z-10" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold">Client Registration</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Bind your hardware and create your profile</p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <input type="text" placeholder="John" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name</label>
                            <input type="text" placeholder="Doe" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input type="email" placeholder="client@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    </div>
                    <hr className="my-6 border-slate-200 dark:border-slate-700" />
                    <div>
                        <label className="block text-sm font-medium mb-1">Device IMEI (15 Digits)</label>
                        <input type="text" value={imei} onChange={(e) => handleImeiCheck(e.target.value)} maxLength={15} placeholder="e.g. 863012938475102" className={`w-full px-4 py-3 rounded-xl border outline-none ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'} bg-white dark:bg-slate-800 transition-all`} />
                        {error && <div className="text-red-500 text-xs font-bold mt-2 animate-pulse">⚠️ IMEI number is not registered in Stock. Contact Support.</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 flex justify-between">
                            <span>M2M SIM Number (Auto-Fill)</span>
                            {sim && <span className="text-emerald-500 text-xs font-bold">Verified ✓</span>}
                        </label>
                        <input type="text" value={sim} readOnly placeholder="Auto-populated from DB..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono transition-all" />
                    </div>
                    <div className="pt-6 grid grid-cols-2 gap-3">
                        <button className="btn-secondary w-full justify-center" onClick={() => navigate('/login')}>Back to Log In</button>
                        <button className={`btn-primary w-full justify-center ${error || !sim ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={error || !sim} onClick={() => navigate('/client')}>Complete Registration</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- LAYOUTS ---

const DashboardLayout = ({ role, activeTab, setActiveTab, children }) => {
    const [theme, setTheme] = useState('dark');
    const [appTheme, setAppTheme] = useState('theme-brand');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        theme === 'dark' ? document.body.classList.add('dark') : document.body.classList.remove('dark');
    }, [theme]);

    useEffect(() => {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(appTheme);
    }, [appTheme]);

    const TabItem = ({ id, icon, label, badge }) => (
        <button
            onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
            className={`w-full flex items-center py-2.5 transition-all font-medium relative group ${isSidebarOpen ? 'px-3 rounded-lg mx-2 w-[calc(100%-1rem)] text-sm' : 'justify-center'} ${activeTab === id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
        >
            <div className="flex items-center gap-3">
                {React.cloneElement(icon, { size: isSidebarOpen ? 18 : 20 })}
                <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>{label}</span>
            </div>
            {badge && isSidebarOpen && <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === id ? 'bg-white/20' : 'bg-brand-500 text-white'}`}>{badge}</span>}
            {!isSidebarOpen && (
                <div className="absolute left-16 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {label}
                </div>
            )}
        </button>
    );

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-200 dark:bg-slate-900 transition-colors duration-300 font-sans relative text-slate-800 dark:text-slate-100">

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-40 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            <aside
                className={`absolute top-0 left-0 h-full z-50 transition-all duration-300 flex flex-col border-r border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-2xl ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full md:translate-x-0'}`}
                onMouseEnter={() => setIsSidebarOpen(true)}
                onMouseLeave={() => setIsSidebarOpen(false)}
            >
                <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-white/10 shrink-0 px-4">
                    <MapIcon className="text-brand-500 shrink-0" size={28} />
                    <div className={`ml-3 overflow-hidden transition-all duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                        <h1 className="font-bold text-xl tracking-tight leading-tight">GeoSurePath<span className="text-brand-500">.</span></h1>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar flex flex-col items-center">
                    <TabItem id="overview" icon={<LayoutDashboard />} label="Dashboard" />
                    <TabItem id="map" icon={<MapIcon />} label="Live Map" badge="LIVE" />
                    <TabItem id="geofence" icon={<Hexagon />} label="Plots & Routes" />
                    <TabItem id="alerts" icon={<Bell />} label="Alert Rules" badge="12" />

                    <div className={`mt-4 w-full px-5 overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}><div className="h-px bg-slate-200 dark:bg-slate-800"></div></div>

                    <TabItem id="drivers" icon={<UserCircle />} label="Drivers" />
                    <TabItem id="tasks" icon={<CheckSquare />} label="Task Dispatch" />
                    <TabItem id="maintenance" icon={<Wrench />} label="Maintenance" badge="2 Due" />
                    <TabItem id="fuel" icon={<Droplet />} label="Fuel Manage" />

                    <div className={`mt-4 w-full px-5 overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}><div className="h-px bg-slate-200 dark:bg-slate-800"></div></div>

                    <TabItem id="reports" icon={<FileText />} label="Data Reports" />
                    <TabItem id="expenses" icon={<TrendingDown />} label="Expenses" />
                    <TabItem id="documents" icon={<FolderOpen />} label="Documents" />

                    {role === 'ADMIN' && (
                        <>
                            <div className={`mt-4 w-full px-5 overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}><div className="h-px bg-slate-200 dark:bg-slate-800"></div></div>
                            <TabItem id="admin_control" icon={<Settings />} label="Full Control Setup" />
                            <TabItem id="devices" icon={<Smartphone />} label="Device Master Stock" />
                            <TabItem id="landing" icon={<Monitor />} label="Landing Page Editor" />
                            <TabItem id="integrations" icon={<Database />} label="RTO / Vahan Connect" />
                            <TabItem id="billing" icon={<CreditCard />} label="Billing Setup" />
                        </>
                    )}
                </nav>

                <div className={`p-4 border-t border-slate-200 dark:border-white/10 shrink-0 flex flex-col items-center overflow-hidden transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 p-0 border-0'}`}>
                    <div className="flex w-full gap-2 mb-3">
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`flex - 1 py - 1.5 rounded border border - slate - 200 dark: border - slate - 700 text - xs font - bold transition - colors flex items - center justify - center gap - 1 ${soundEnabled ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border-brand-200 dark:border-brand-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}>
                            {soundEnabled ? <Bell size={12} /> : <div className="relative"><Bell size={12} className="opacity-50" /><div className="absolute inset-0 bg-slate-500 w-px h-4 rotate-45 left-1.5 -top-0.5" /></div>}
                            {soundEnabled ? 'Sound ON' : 'Muted'}
                        </button>
                    </div>
                    <div className="flex w-full gap-2 mb-3">
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex-1 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors">{theme === 'dark' ? 'Light' : 'Dark'}</button>
                    </div>
                    <div className="flex w-full gap-2 justify-between">
                        <button onClick={() => setAppTheme('theme-brand')} className={`w - 6 h - 6 rounded - full bg - teal - 500 border - 2 ${appTheme === 'theme-brand' ? 'border-white' : 'border-transparent'} shadow-sm`}></button>
                        <button onClick={() => setAppTheme('theme-blue')} className={`w - 6 h - 6 rounded - full bg - blue - 500 border - 2 ${appTheme === 'theme-blue' ? 'border-white' : 'border-transparent'} shadow-sm`}></button>
                        <button onClick={() => setAppTheme('theme-orange')} className={`w - 6 h - 6 rounded - full bg - orange - 500 border - 2 ${appTheme === 'theme-orange' ? 'border-white' : 'border-transparent'} shadow-sm`}></button>
                    </div>
                </div>
            </aside>

            {/* Persistent Background Map */}
            <main className="absolute inset-0 z-0 bg-slate-200 dark:bg-slate-900 transition-all duration-300 md:pl-16">
                <div className="absolute inset-0 z-0">
                    <MapContainer center={[34.0522, -118.2437]} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        {MOCK_FLEET.map(vehicle => (
                            <Marker key={vehicle.id} position={[vehicle.lat, vehicle.lng]} icon={createIcon(vehicle.color, vehicle.heading)}>
                                <Popup className="premium-popup">
                                    <div className="font-bold text-sm mb-1">{vehicle.name} <span className="text-[10px] ml-1 bg-slate-100 text-slate-500 px-1 py-0.5 rounded">{vehicle.speed} km/h</span></div>
                                    <div className="text-xs text-slate-500 mb-2">{vehicle.driver} • V-ID: {vehicle.id}94X</div>
                                </Popup>
                            </Marker>
                        ))}
                        {activeTab === 'geofence' && (
                            <>
                                <Polygon positions={[[34.06, -118.25], [34.06, -118.23], [34.04, -118.23], [34.04, -118.25]]} pathOptions={{ color: 'var(--color-brand-500)', fillColor: 'var(--color-brand-500)', fillOpacity: 0.2, weight: 3 }} />
                                <Polyline positions={[[34.03, -118.26], [34.02, -118.24], [34.00, -118.22]]} pathOptions={{ color: '#3b82f6', weight: 6, dashArray: '10, 10' }} />
                                <Circle center={[34.08, -118.26]} radius={800} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 3 }} />
                            </>
                        )}
                        {/* Mock Measure Line */}
                        {(activeTab === 'map' || activeTab === 'geofence') && (
                            <Polyline positions={[[34.0522, -118.2437], [34.0480, -118.2500]]} pathOptions={{ color: '#8b5cf6', weight: 4, dashArray: '5, 5' }} />
                        )}
                    </MapContainer>
                </div>

                {/* Blinking Top Notification Bar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] pointer-events-auto">
                    <div className="bg-red-500 text-white px-6 py-2 rounded-full font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400 flex items-center gap-3 animate-pulse cursor-pointer hover:scale-105 transition-transform">
                        <AlertTriangle size={16} /> [URGENT] FUEL THEFT WARNING: Heavy Truck B (-45L)
                    </div>
                </div>

                {/* Audio Element for Critical Alerts */}
                {soundEnabled && (
                    <audio autoPlay loop src="https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg" className="hidden" />
                )}

                {/* Mobile Menu Toggle Layer */}
                <header className="absolute top-0 left-0 w-full h-16 flex items-center justify-between pointer-events-none z-30 px-6 bg-gradient-to-b from-slate-900/40 to-transparent">
                    <button className="md:hidden p-2 bg-black/50 rounded pointer-events-auto text-white mt-4" onClick={() => setMobileMenuOpen(true)}><Menu size={24} /></button>
                </header>

                <div className={`absolute inset-0 z-20 transition-all duration-300 ${isSidebarOpen ? 'md:pl-48' : ''} pointer-events-none`}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} transition={{ duration: 0.15 }} className="w-full h-full">
                            {(activeTab === 'map' || activeTab === 'geofence') ? (
                                children
                            ) : (
                                <div className="pointer-events-auto absolute inset-0 md:top-16 flex items-start justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md overflow-hidden">
                                    <div className="w-full h-[98%] custom-scrollbar max-w-[1500px] bg-slate-50 dark:bg-slate-900 shadow-2xl rounded-2xl overflow-y-auto border border-slate-200 dark:border-slate-800 relative">
                                        <button onClick={() => setActiveTab('map')} className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors shadow-sm z-50"><X size={18} /></button>
                                        <div className="p-6 md:p-8">{children}</div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

// --- DASHBOARDS ---

const KPIWidget = ({ title, value, icon, colorClass }) => (
    <div className="glass-panel p-5 flex flex-col">
        <div className="flex justify-between items-start mb-4">
            <div className={`p - 2.5 rounded - xl bg - ${colorClass} -50 dark: bg - ${colorClass} -500 / 10 text - ${colorClass} -500`}>
                {icon}
            </div>
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
    </div>
);

const ClientDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPIWidget title="Total Fleet" value="12" icon={<Car size={24} />} colorClass="brand" />
                <KPIWidget title="Moving Now" value="8" icon={<Activity size={24} />} colorClass="emerald" />
                <KPIWidget title="Distance Today" value="482 km" icon={<MapIcon size={24} />} colorClass="blue" />
                <KPIWidget title="Avg Eco Score" value="94/100" icon={<Shield size={24} />} colorClass="amber" />
            </div>

            {/* Unified Tab Layout for Quick Access without leaving Overview */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <PlayCircle className="text-blue-500" /> Start Tracking Instantly
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-2xl">
                    GeoSurePath provides a completely frictionless tracking experience. Vehicles update every 10 seconds via our zero-delay WebSockets engine.
                </p>
                <button onClick={() => setActiveTab('map')} className="btn-primary text-lg px-8 py-3 w-full md:w-auto">
                    Open Live Map Fullscreen <ArrowRight className="ml-2" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alerts Mini-Feed */}
                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Bell className="text-amber-500" /> Recent Alerts</h3>
                        <button onClick={() => setActiveTab('alerts')} className="text-brand-500 text-sm font-bold hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {MOCK_ALERTS.map(a => (
                            <div key={a.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex gap-4 items-start">
                                <div className={`p - 2 rounded - full mt - 1 shrink - 0 ${a.type === 'critical' ? 'bg-red-500/20 text-red-500' : a.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'} `}>
                                    {a.type === 'critical' ? <AlertTriangle size={16} /> : a.type === 'warning' ? <Activity size={16} /> : <Box size={16} />}
                                </div>
                                <div>
                                    <div className="font-bold text-sm mb-1">{a.message}</div>
                                    <div className="flex gap-3 text-xs text-slate-500 font-medium">
                                        <span className="flex items-center gap-1"><Car size={12} /> {a.vehicle}</span>
                                        <span className="flex items-center gap-1"><Bell size={12} /> {a.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 1-Click Engine Control */}
                <div className="glass-panel p-6 border-l-4 border-l-red-500 flex flex-col">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-red-500"><PowerOff size={20} /> 1-Click Immobilizer</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Instantly cut engine power during emergencies. Requires vehicle speed to be below 20km/h for safety.</p>

                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 mb-2">
                            <optgroup label="Moving Vehicles">
                                <option>Delivery Van A (65 km/h) - UNSAFE</option>
                            </optgroup>
                            <optgroup label="Idle/Parked Vehicles">
                                <option>Exec Car 1 (0 km/h) - SAFE</option>
                                <option>Heavy Truck B (Offline)</option>
                            </optgroup>
                        </select>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold tracking-wide shadow-[0_4px_20px_rgba(239,68,68,0.4)] transition-all active:scale-95 flex flex-col justify-center items-center gap-1">
                                <PowerOff size={20} /> BLOCK ENGINE
                            </button>
                            <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold tracking-wide shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex flex-col justify-center items-center gap-1">
                                <Zap size={20} /> RESTORE IGNITION
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMap = () => (
        <div className="pointer-events-none absolute inset-0">
            {/* Live Date & Master Status Chip */}
            <div className="absolute top-4 left-4 md:left-24 z-[1000] pointer-events-auto">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">System Time</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">March 5, 2026</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">All Systems Operational</span>
                    </div>
                </div>
            </div>

            {/* TCP Socket Floating Widget */}
            <div className="absolute top-4 right-4 md:right-8 z-[1000] glass-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl flex gap-4 pointer-events-auto border border-brand-500/30 items-center hover:border-brand-500 transition-all scale-90 origin-top-right">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">WebSocket Status</span>
                    <span className="text-emerald-500 font-bold text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> CONNECTED (0ms delay)</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                    <Zap size={16} />
                </div>
            </div>

            {/* Map Layer Controls (Satellite, Terrain, etc.) */}
            <div className="absolute bottom-6 left-4 md:left-24 z-[1000] pointer-events-auto flex flex-col gap-2">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50 flex flex-col gap-1 w-12">
                    <button title="Street View (Default)" className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-500 bg-brand-50 dark:bg-brand-500/10 hover:bg-slate-100 transition-colors tooltip-trigger"><MapIcon size={18} /></button>
                    <button title="Satellite View" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Database size={18} /></button>
                    <button title="Traffic Overlay" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"><car size={18} /><Car size={18} /></button>
                    <button title="Dark Mode Map" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Settings size={18} /></button>
                </div>
            </div>

            {/* Geographic Tool Kit Overlay */}
            <div className="absolute bottom-6 left-20 md:left-40 z-[1000] pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-700">
                    <button className="flex flex-col items-center justify-center text-slate-500 hover:text-brand-500 group">
                        <div className="p-2 rounded-lg group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 transition-colors"><Crosshair size={18} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Measure</span>
                    </button>
                    <button className="flex flex-col items-center justify-center text-slate-500 hover:text-blue-500 group">
                        <div className="p-2 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors"><RouteIcon size={18} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Route Info</span>
                    </button>
                    <button className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-500 group">
                        <div className="p-2 rounded-lg group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors"><Hexagon size={18} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Quick Geo</span>
                    </button>
                </div>
                <div className="flex flex-col min-w-[120px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Tool</span>
                    <span className="text-sm font-bold text-brand-500">Distance Measure</span>
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mt-0.5">1.24 km</span>
                </div>
            </div>

            {/* Today's Statistics (Important things only) */}
            <div className="absolute top-20 left-4 md:left-24 z-[1000] glass-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl pointer-events-auto border border-emerald-500/20 max-w-sm">
                <div className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <Activity className="text-brand-500" size={18} /> Today's Statistics
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Active Vehicles</div>
                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">8 / 12</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20">
                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Distance Driven</div>
                        <div className="text-2xl font-black text-blue-700 dark:text-blue-300">482 <span className="text-sm font-bold opacity-70">km</span></div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20 col-span-2 flex justify-between items-center">
                        <div>
                            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Alerts Tripped</div>
                            <div className="text-xl font-black text-amber-700 dark:text-amber-300">3 Warnings</div>
                        </div>
                        <button className="text-[10px] font-bold bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200 px-3 py-1.5 rounded-lg">View All</button>
                    </div>
                </div>
            </div>

            {/* Floating Live Fleet Drawer (Right Side) */}
            <div className="absolute right-4 md:right-8 top-20 bottom-6 w-72 lg:w-80 glass-panel p-0 flex flex-col overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl pointer-events-auto">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 font-bold flex justify-between items-center text-base">
                    Live Tracking
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-500 uppercase tracking-widest shadow-inner">Client View</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 relative custom-scrollbar">
                    {MOCK_FLEET.map(v => (
                        <div key={v.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm hover:shadow-md group relative overflow-hidden backdrop-blur-md">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${v.status === 'moving' ? 'bg-emerald-500' : v.status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'} `} />

                            <div className="flex justify-between items-start mb-2 ml-1">
                                <div className="font-bold flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-100 flex-wrap">
                                    {v.name}
                                    {v.status === 'moving' && <span className="animate-pulse w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>}
                                    {v.ais140 && <span className="text-[8px] bg-indigo-500/10 text-indigo-500 px-1 py-0.5 rounded border border-indigo-500/20 font-bold ml-1">AIS-140</span>}
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold shadow-sm ${v.status === 'moving' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{v.speed} km/h</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-1 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                <span className="flex items-center gap-1"><Battery size={12} className={v.fuel && v.fuel < 20 ? 'text-red-500' : 'text-blue-500'} /> {v.fuel ? `${v.fuel}L` : '-'}</span>
                                <span className="flex items-center gap-1"><Thermometer size={12} className={v.temp ? 'text-rose-500' : 'text-slate-400'} /> {v.temp ? `${v.temp}°C` : '-'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderFuelAndCAN = () => (
        <div className="space-y-6">
            <div className="glass-panel p-6 mb-6">
                <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-brand-500"><Droplet /> Advanced Fuel Analytics</h3>
                <p className="text-slate-500 text-sm mb-8 max-w-2xl">Visualizing precise hardware sensor data. Spikes or sudden drops immediately trigger platform alerts to prevent fuel theft.</p>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_FUEL_DATA}>
                            <defs>
                                <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="time" stroke="#64748b" />
                            <YAxis stroke="#64748b" label={{ value: 'Fuel Level (Liters)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                            <Area type="monotone" dataKey="fuel" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorFuel)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 border-l-4 border-l-rose-500">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={20} /> CAN Bus Diagnostics</h4>
                    <div className="space-y-4 text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-mono">
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2"><span className="text-slate-500 flex items-center gap-2"><Thermometer size={14} /> Engine Temp</span> <span className="font-bold text-rose-500">105°C (High)</span></div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2"><span className="text-slate-500 flex items-center gap-2"><Database size={14} /> RPM (Current)</span> <span className="font-bold">2,450 rpm</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 flex items-center gap-2"><AlertTriangle size={14} /> Diagnostic Codes</span> <span className="font-bold text-emerald-500">P0000 (Clear)</span></div>
                    </div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-l-blue-500">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><Shield size={20} /> AI Driver Eco-Scoring</h4>
                    <div className="flex items-end gap-6 mb-4">
                        <div className="text-6xl font-black text-blue-500 tracking-tighter">92</div>
                        <div className="text-slate-500 text-sm mb-2 font-bold uppercase tracking-widest">Fleet Average Score</div>
                    </div>
                    <p className="text-sm text-slate-500">Calculated continuously using harsh braking sensors, cornering G-force packets, and overspeeding rules. Used to lower insurance premiums.</p>
                </div>
            </div>
        </div>
    );

    const renderGeofence = () => (
        <div className="pointer-events-none absolute inset-0">
            {/* Top Drawing Toolbar Overlay */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] glass-panel bg-white/95 dark:bg-slate-900/95 px-6 py-4 rounded-full shadow-2xl flex gap-6 md:gap-8 pointer-events-auto border border-brand-500/20 font-bold text-sm items-center backdrop-blur-2xl">
                <button className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"><Hexagon size={18} className="text-brand-500" /> <span className="hidden md:inline">Draw Polygon</span></button>
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700"></div>
                <button className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"><Circle size={18} /> <span className="hidden md:inline">Draw Circle</span></button>
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700"></div>
                <button className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"><RouteIcon size={18} /> <span className="hidden md:inline">Draw Route</span></button>
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700"></div>
                <button className="btn-primary text-xs px-4 py-1.5 shadow-md">Save Rule</button>
            </div>

            {/* Floating Right Control Drawer */}
            <div className="absolute right-6 md:right-10 top-24 bottom-6 w-80 lg:w-[380px] glass-panel p-0 flex flex-col overflow-hidden pointer-events-auto border border-slate-200 dark:border-white/10 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 font-bold flex justify-between items-center text-lg bg-slate-50/50 dark:bg-slate-800/50">
                    <span className="flex items-center gap-2"><Hexagon className="text-brand-500" size={20} /> Zone Rules</span>
                </div>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex gap-2">
                    <button className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-500/20">
                        + Auto-Detect Zone
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                    <div>
                        <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-3 ml-1">Active Geofences (Polygons)</h4>
                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl border border-brand-200 dark:border-brand-500/30 bg-white dark:bg-slate-800/60 shadow-sm cursor-pointer hover:border-brand-500 transition-all hover:shadow-md group">
                                <div className="font-bold mb-2 flex justify-between items-center text-slate-800 dark:text-slate-100">
                                    Main Warehouse
                                    <span className="text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-md tracking-wider">ACTIVE</span>
                                </div>
                                <div className="text-xs text-slate-500 mb-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <span className="block mb-1 text-slate-700 dark:text-slate-300"><strong className="text-brand-500">Alerts:</strong> Entry & Exit Notifications</span>
                                    <span className="block"><strong className="text-slate-600 dark:text-slate-400">Applies to:</strong> All Vehicles</span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">Edit Shape</button>
                                    <button className="py-1.5 px-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-red-200 dark:border-red-500/30">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-3 ml-1 mt-2">Active Routefences (Corridors)</h4>
                        <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-slate-800/60 shadow-sm cursor-pointer hover:border-blue-500 transition-all hover:shadow-md">
                            <div className="font-bold mb-2 flex justify-between items-center text-blue-700 dark:text-blue-400">
                                I-5 Cargo Route
                                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md tracking-wider">ACTIVE</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="block text-slate-600 dark:text-slate-400 mb-1"><strong>Tolerance:</strong> 500 meters lateral</span>
                                <span className="block bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-2 py-1 rounded font-bold mt-2">Rule: IMMEDIATE SMS if deviated</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAlerts = () => (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Bell className="text-brand-500" /> Alerts & Notification Rules</h2>
                    <button className="btn-primary text-sm px-4 py-2">+ Create Alert Rule</button>
                </div>
                <p className="text-slate-500 mb-6 max-w-2xl">Configure real-time notifications for specific events. Alerts are distributed instantly via WebSocket, Email, and SMS (for critical events).</p>

                <div className="space-y-4">
                    {MOCK_ALERTS.map(a => (
                        <div key={a.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30 flex gap-4 items-center">
                            <div className={`p - 3 rounded - full shrink - 0 ${a.type === 'critical' ? 'bg-red-500/20 text-red-500' : a.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'} `}>
                                {a.type === 'critical' ? <AlertTriangle size={20} /> : a.type === 'warning' ? <Activity size={20} /> : <Box size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-base mb-1 truncate">{a.message}</div>
                                <div className="flex gap-4 text-sm text-slate-500 font-medium">
                                    <span className="flex items-center gap-1"><Car size={14} /> {a.vehicle}</span>
                                    <span className="flex items-center gap-1"><Bell size={14} /> {a.time}</span>
                                </div>
                            </div>
                            <div className="shrink-0 flex gap-2">
                                <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Acknowledge</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-300">Active Alert Triggers (Rules)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm">Over-speeding &gt; 80km/h</h4>
                            <div className="w-8 h-4 bg-brand-500 rounded-full flex items-center px-0.5 justify-end"><div className="w-3 h-3 bg-white rounded-full shadow-sm"></div></div>
                        </div>
                        <p className="text-xs text-slate-500">Triggers if vehicle exceeds 80km/h for more than 30 seconds. Applies to All Trucks.</p>
                    </div>
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm">Fuel Theft Warning</h4>
                            <div className="w-8 h-4 bg-brand-500 rounded-full flex items-center px-0.5 justify-end"><div className="w-3 h-3 bg-white rounded-full shadow-sm"></div></div>
                        </div>
                        <p className="text-xs text-slate-500">Triggers on sudden fuel level drop (-10% in under 5 minutes).</p>
                    </div>
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm">Ignition Outside Working Hours</h4>
                            <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center px-0.5"><div className="w-3 h-3 bg-white rounded-full shadow-sm"></div></div>
                        </div>
                        <p className="text-xs text-slate-500">Triggers if ignition ON between 22:00 and 06:00.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><FileText className="text-brand-500" /> Advanced Data Reports</h2>
                <p className="text-slate-500 mb-6">Generate highly detailed PDF and Excel reports for auditing and compliance based on raw database telemetry.</p>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Report Type</label>
                        <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                            <option>Trip History (Detailed)</option>
                            <option>Stops & Idle Time</option>
                            <option>Daily Mileage & Fuel</option>
                            <option>Geofence In/Out Log</option>
                            <option>Driver Eco-Score Card</option>
                            <option>Expense Summary</option>
                            <option>Maintenance Log</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Vehicle / Group</label>
                        <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                            <option>All Vehicles</option>
                            <option>Delivery Van A</option>
                            <option>Heavy Truck B</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Time Range</label>
                        <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                            <option>Today</option>
                            <option>Yesterday</option>
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                            <option>Custom Date Range...</option>
                        </select>
                    </div>
                    <div>
                        <button className="btn-primary w-full shadow-md py-2.5">Generate Report</button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Vehicle</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Trip Start Time</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Trip End Time</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Distance</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Fuel Used</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Avg Speed</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white/30 dark:bg-transparent">
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-bold">Delivery Van A</td>
                                <td className="px-6 py-4 text-slate-500">08:15 AM</td>
                                <td className="px-6 py-4 text-slate-500">11:30 AM</td>
                                <td className="px-6 py-4 font-mono font-medium">142 km</td>
                                <td className="px-6 py-4 font-mono text-blue-500 font-bold">12 L</td>
                                <td className="px-6 py-4">45 km/h</td>
                                <td className="px-6 py-4"><button className="text-brand-500 font-bold hover:underline">Show on Map</button></td>
                            </tr>
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-bold">Heavy Truck B</td>
                                <td className="px-6 py-4 text-slate-500">06:00 AM</td>
                                <td className="px-6 py-4 text-slate-500">14:45 PM</td>
                                <td className="px-6 py-4 font-mono font-medium">450 km</td>
                                <td className="px-6 py-4 font-mono text-blue-500 font-bold">95 L</td>
                                <td className="px-6 py-4">65 km/h</td>
                                <td className="px-6 py-4"><button className="text-brand-500 font-bold hover:underline">Show on Map</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderDrivers = () => (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><UserCircle className="text-blue-500" /> Driver Management</h2>
                    <button className="btn-primary">+ Add New Driver</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'John Doe', license: 'TX-8921-X', exp: '2027-05-12', vehicle: 'Delivery Van A', status: 'On Shift', score: 92 },
                        { name: 'Sarah Wood', license: 'CA-1029-A', exp: '2024-11-01', vehicle: 'Exec Car 1', status: 'Off Duty', score: 88 },
                        { name: 'Mike Tyson', license: 'NY-4411-C', exp: '2026-08-22', vehicle: 'Heavy Truck B', status: 'On Shift', score: 74, warning: true }
                    ].map((d, i) => (
                        <div key={i} className={`p - 5 rounded - 2xl border ${d.warning ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50/30' : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50'} `}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">
                                    {d.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h4 className="font-bold">{d.name}</h4>
                                    <div className="text-xs text-slate-500 font-mono">Lic: {d.license}</div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Status</span> <span className={`font - bold ${d.status === 'On Shift' ? 'text-emerald-500' : ''} `}>{d.status}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Vehicle</span> <span className="font-medium text-brand-500">{d.vehicle}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Eco-Score</span> <span className={`font - bold ${d.score < 80 ? 'text-amber-500' : 'text-emerald-500'} `}>{d.score}/100</span></div>
                            </div>
                            {d.warning && <div className="mt-4 text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-3 py-2 rounded-lg flex gap-2"><AlertTriangle size={14} /> Harsh Braking Alert Today</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderTasks = () => (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><CheckSquare className="text-emerald-500" /> Dispatch & Jobs</h2>
                    <button className="btn-primary">+ Dispatch New Task</button>
                </div>

                <div className="space-y-4">
                    {[
                        { id: '#TSK-1042', status: 'In Progress', title: 'Deliver Medical Supplies to Gen Hospital', vehicle: 'Delivery Van A', driver: 'John Doe', ETA: '45 mins' },
                        { id: '#TSK-1043', status: 'Pending', title: 'Pickup Cargo Container 899X', vehicle: 'Heavy Truck B', driver: 'Mike Tyson', ETA: 'Scheduled 14:00' },
                        { id: '#TSK-1041', status: 'Completed', title: 'VIP Airport Transfer', vehicle: 'Exec Car 1', driver: 'Sarah Wood', ETA: 'Arrived 09:15 AM', proof: true }
                    ].map((t, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30 items-center">
                            <div className="w-full md:w-32">
                                <span className={`text - xs px - 2 py - 1 font - bold rounded - lg ${t.status === 'In Progress' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : t.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'} `}>{t.status}</span>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="font-bold text-lg mb-1">{t.title} <span className="text-xs text-slate-400 ml-2 font-mono">{t.id}</span></div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><Car size={14} /> {t.vehicle}</span>
                                    <span className="flex items-center gap-1"><UserCircle size={14} /> {t.driver}</span>
                                    <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">ETA: {t.ETA}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {t.proof && <button className="text-brand-500 font-bold text-sm px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg">View Proof</button>}
                                <button className="text-slate-500 hover:text-brand-500 font-bold text-sm px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Track on Map</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderMaintenance = () => (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="glass-panel p-6 border-l-4 border-l-amber-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-500"><Wrench /> Fleet Maintenance System</h2>
                    <button className="btn-primary bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]">+ Add Service Record</button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold mb-4 uppercase text-xs tracking-wider text-slate-400">Due / Upcoming Maintenance</h3>
                        <div className="space-y-3">
                            <div className="p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10">
                                <div className="flex justify-between mb-1"><span className="font-bold text-red-600 dark:text-red-400">Engine Oil Change</span> <span className="text-xs font-bold text-slate-700 bg-white dark:bg-slate-900 px-2 rounded border border-red-200">Heavy Truck B</span></div>
                                <p className="text-xs text-slate-500 font-medium font-mono">Due at: 150,000 km | Current: 150,420 km (OVERDUE)</p>
                            </div>
                            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10">
                                <div className="flex justify-between mb-1"><span className="font-bold text-amber-600 dark:text-amber-400">Tire Rotation</span> <span className="text-xs font-bold text-slate-700 bg-white dark:bg-slate-900 px-2 rounded border border-amber-200">Delivery Van A</span></div>
                                <p className="text-xs text-slate-500 font-medium font-mono">Due at: 45,000 km | Current: 44,800 km (Soon)</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4 uppercase text-xs tracking-wider text-slate-400">Recent Service Logs</h3>
                        <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity">
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 flex justify-between items-center text-sm">
                                <div>
                                    <div className="font-bold text-slate-700 dark:text-slate-300">Brake Pad Replacement <span className="text-xs font-normal text-slate-500 block">Exec Car 1 • 2 days ago</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-emerald-600">$450.00</div>
                                    <button className="text-xs text-brand-500 font-bold hover:underline">View Invoice PDF</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderExpenses = () => (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><TrendingDown className="text-red-500" /> Fleet Expenses & Fuel Costs</h2>
                    <button className="btn-primary bg-slate-800 hover:bg-slate-700 text-white">+ Log New Expense</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total This Month</div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">$4,250.00</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Fuel Expenses</div>
                        <div className="text-2xl font-bold text-blue-500">$2,800.00</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Maintenance</div>
                        <div className="text-2xl font-bold text-amber-500">$1,150.00</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Tolls & Other</div>
                        <div className="text-2xl font-bold text-slate-500">$300.00</div>
                    </div>
                </div>

                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-lg">Date</th>
                            <th className="px-6 py-4">Vehicle</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Logged By</th>
                            <th className="px-6 py-4 rounded-tr-lg">Receipt</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        <tr>
                            <td className="px-6 py-4 text-slate-500">Today, 09:30 AM</td>
                            <td className="px-6 py-4 font-bold">Delivery Van A</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded-md text-xs font-bold">Fuel</span></td>
                            <td className="px-6 py-4 font-mono font-bold">$120.50</td>
                            <td className="px-6 py-4">John Doe</td>
                            <td className="px-6 py-4"><button className="text-brand-500 hover:underline inline-flex items-center gap-1"><FolderOpen size={14} /> View</button></td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-slate-500">Yesterday, 14:00 PM</td>
                            <td className="px-6 py-4 font-bold">Exec Car 1</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-md text-xs font-bold">Toll/Parking</span></td>
                            <td className="px-6 py-4 font-mono font-bold">$15.00</td>
                            <td className="px-6 py-4">Sarah Wood</td>
                            <td className="px-6 py-4 text-slate-400 text-xs italic">No receipt attached</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDocuments = () => (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="glass-panel p-6 shadow-xl border-l-[6px] border-l-slate-700">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-100"><FolderOpen /> Compliance & Document Vault</h2>
                <p className="text-slate-500 mb-8 max-w-2xl">Securely upload, store, and track expiry dates for vehicle Registration Certificates (RC), Insurance policies, and regional Permits.</p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { doc: 'Insurance Policy 2026', vehicle: 'Delivery Van A', exp: '2026-12-31', status: 'Valid', color: 'emerald' },
                        { doc: 'Regional Tolling Pass', vehicle: 'All Fleet', exp: '2026-08-01', status: 'Valid', color: 'emerald' },
                        { doc: 'Pollution/Emissions Certificate', vehicle: 'Heavy Truck B', exp: '2026-03-10', status: 'Expiring Soon', color: 'amber' },
                        { doc: 'Vehicle RC Copy', vehicle: 'Exec Car 1', exp: '-', status: 'Permanent', color: 'blue' }
                    ].map((doc, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500"><FileWarning size={24} /></div>
                                <span className={`text - [10px] uppercase font - bold px - 2 py - 1 rounded bg - ${doc.color} -100 dark: bg - ${doc.color} -500 / 20 text - ${doc.color} -600 dark: text - ${doc.color} -400`}>{doc.status}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">{doc.doc}</h4>
                            <div className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1"><Car size={12} /> {doc.vehicle}</div>
                            <hr className="border-slate-100 dark:border-slate-700 mb-3" />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 font-mono">EXP: {doc.exp}</span>
                                <button className="text-sm font-bold text-brand-500 hover:text-brand-600">Download</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout role="CLIENT" activeTab={activeTab} setActiveTab={setActiveTab}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'map' && renderMap()}
            {activeTab === 'geofence' && renderGeofence()}
            {activeTab === 'alerts' && renderAlerts()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'fuel' && renderFuelAndCAN()}
            {activeTab === 'ai_scoring' && renderFuelAndCAN()}
            {activeTab === 'drivers' && renderDrivers()}
            {activeTab === 'tasks' && renderTasks()}
            {activeTab === 'maintenance' && renderMaintenance()}
            {activeTab === 'expenses' && renderExpenses()}
            {activeTab === 'documents' && renderDocuments()}
            {activeTab === 'sharing' && renderOverview()} {/* Placeholder */}
        </DashboardLayout>
    );
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('admin_control');

    const renderAdminControl = () => (
        <div className="space-y-6">
            <div className="mb-4">
                <p className="text-slate-500 text-lg">You are viewing the <strong className="text-brand-500">Super Admin Master Portal</strong>. From here you can control all features, fix system issues in one click, backup data easily, and access massive datatables of your fleet ecosystem.</p>
            </div>

            {/* System Health & 1-Click Fix & Daily Backup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 border-l-4 border-l-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/5 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-emerald-500/10"><CheckCircle2 size={120} /></div>
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Activity /> System Health & Auto Repairs</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm">Continuous monitoring of TCP engines, database queries, and redundant server nodes. Auto-detects memory leaks or disconnected queues.</p>

                    <div className="flex gap-4 items-center mb-6 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex-1">
                            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Current Issue Detected</div>
                            <div className="font-bold text-amber-500 flex items-center gap-1"><AlertTriangle size={14} /> Redis Queue Backlog (1,040 pkts)</div>
                        </div>
                        <button className="bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white px-6 py-3 rounded-xl font-black text-sm transition-all transform hover:scale-105">
                            Fix All Issues (1-Click)
                        </button>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold font-mono text-slate-400">
                        <span>CPU Load: 14%</span> • <span>RAM: 8.2GB/32GB</span> • <span>Latency: 4ms</span>
                    </div>
                </div>

                <div className="glass-panel p-6 border-l-4 border-l-blue-500 bg-blue-50/10 dark:bg-blue-500/5 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-blue-500/10"><Database size={120} /></div>
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400"><Database /> Automated Backups Everyday</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm">Securely take live snapshots of position data, user rules, and billing. Store to off-site cold storage completely seamlessly.</p>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Status</div>
                            <div className="font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={14} /> Ready to snap</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Last Backup</div>
                            <div className="font-bold text-slate-700 dark:text-slate-300">Today, 02:00 AM</div>
                        </div>
                    </div>
                    <button className="w-full btn-primary bg-blue-600 hover:bg-blue-500 text-white font-black text-sm py-3 justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        Take Full Backup Now
                    </button>
                </div>
            </div>

            {/* Feature Master Control & Datatables Panel */}
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Settings className="text-slate-500" /> Feature Matrix & Datatables Panel</h3>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 transition">Export CSV</button>
                        <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-bold transition">Save Master Rules</button>
                    </div>
                </div>

                <p className="text-slate-500 text-sm mb-6 max-w-3xl">Control every single feature of the 22 modules for each individual vehicle and client. If a feature is toggled off, it completely vanishes from their UI.</p>

                <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white dark:bg-slate-900/40">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-5 py-4">Client / Vehicle Entity</th>
                                <th className="px-5 py-4 text-center">Service (Start/Stop)</th>
                                <th className="px-5 py-4 font-bold text-brand-500 text-center">Live Map</th>
                                <th className="px-5 py-4 text-center">Geofence Mod.</th>
                                <th className="px-5 py-4 text-center">Alert Mod.</th>
                                <th className="px-5 py-4 text-center">Eco-Score Mod.</th>
                                <th className="px-5 py-4 text-center">Engine Block</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {[
                                { name: "Client: Acme Logistics", suspended: false, map: true, geo: true, alert: true, eco: true, block: false },
                                { name: "  └ Delivery Van A", suspended: false, map: true, geo: true, alert: true, eco: true, block: false },
                                { name: "  └ Heavy Truck B", suspended: false, map: true, geo: true, alert: true, eco: true, block: true },
                                { name: "Client: VIP Rentals", suspended: true, map: false, geo: false, alert: false, eco: false, block: true },
                                { name: "  └ Exec Car 1", suspended: true, map: false, geo: false, alert: false, eco: false, block: true },
                            ].map((row, i) => (
                                <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${row.suspended ? 'opacity-60 bg-slate-50 dark:bg-slate-900/30' : ''}`}>
                                    <td className="px-5 py-3 font-bold text-slate-700 dark:text-slate-200">{row.name}</td>
                                    <td className="px-5 py-3 text-center">
                                        <button className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all focus:outline-none ${!row.suspended ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400'}`}>
                                            {!row.suspended ? 'Active (Suspend)' : 'Suspended (Resume)'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <input type="checkbox" defaultChecked={row.map} className="w-4 h-4 accent-brand-500/80 cursor-pointer" />
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <input type="checkbox" defaultChecked={row.geo} className="w-4 h-4 accent-brand-500/80 cursor-pointer" />
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <input type="checkbox" defaultChecked={row.alert} className="w-4 h-4 accent-brand-500/80 cursor-pointer" />
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <input type="checkbox" defaultChecked={row.eco} className="w-4 h-4 accent-brand-500/80 cursor-pointer" />
                                    </td>
                                    <td className="px-5 py-3 text-center border-l border-slate-100 dark:border-slate-800 bg-red-50/30 dark:bg-red-900/10">
                                        <input type="checkbox" defaultChecked={row.block} className="w-4 h-4 accent-red-500 cursor-pointer" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderWhiteLabel = () => (
        <div className="max-w-4xl space-y-6">
            <div className="glass-panel p-8">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Box className="text-brand-500" /> Reseller White-Label Setup</h2>
                <p className="text-slate-500 mb-8 max-w-2xl">Configure custom domains, brand colors, and company logos. Every Reseller tier automatically applies these styles dynamically to their sub-clients.</p>

                <div className="space-y-8">
                    <div>
                        <h4 className="font-bold mb-4 uppercase text-xs tracking-wider text-slate-400">DNS & Connectivity</h4>
                        <label className="block font-bold mb-2 text-sm">Custom Platform Domain URL</label>
                        <input type="text" defaultValue="tracking.geosurepath.com" className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />
                        <p className="text-xs text-slate-500 mt-2">Requires CNAME record pointing to saas-origin.GeoSurePath.io</p>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-800" />

                    <div>
                        <h4 className="font-bold mb-4 uppercase text-xs tracking-wider text-slate-400">Theming Engine</h4>
                        <div className="grid grid-cols-2 max-w-md gap-4">
                            <div>
                                <label className="block font-bold mb-2 text-sm">Primary Brand Color</label>
                                <div className="flex gap-2 items-center">
                                    <span className="w-10 h-10 rounded-lg bg-orange-500 border border-slate-200 shadow-sm block"></span>
                                    <input type="text" defaultValue="#F97316" className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-bold mb-2 text-sm">Logo Image URL</label>
                                <input type="text" defaultValue="https://cdn..." className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
                            </div>
                        </div>
                    </div>

                    <button className="btn-primary text-lg px-8 py-3">Compile & Apply Stylesheet via Vite</button>
                </div>
            </div>
        </div>
    );

    const renderBilling = () => (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-500 dark:text-indigo-400"><CreditCard /> Advanced Billing & Subscription Management</h2>
                    <button className="btn-primary">+ Create Invoice</button>
                </div>
                <p className="text-slate-500 mb-8 max-w-2xl">Manage recurring payments, tier upgrades, and automated multi-tenant billing for all your resellers and direct clients globally.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Monthly Recurring Revenue</div>
                        <div className="text-3xl font-bold text-emerald-500">?24,850.00</div>
                        <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1"><TrendingDown className="rotate-180" size={14} /> +12.5% vs last month</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Active Subscriptions</div>
                        <div className="text-3xl font-bold text-blue-500">142</div>
                        <div className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1"><Users size={14} /> 8 new this week</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 border-l-4 border-l-amber-500">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Pending Invoices</div>
                        <div className="text-3xl font-bold text-amber-500">?3,240.00</div>
                        <div className="text-xs text-amber-600 font-medium mt-2 flex items-center gap-1"><AlertTriangle size={14} /> 5 clients past due</div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white dark:bg-slate-900/40">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-5 py-4">Client Name</th>
                                <th className="px-5 py-4">Plan / Tier</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Next Billing Date</th>
                                <th className="px-5 py-4">Amount</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {[
                                { name: "Acme Logistics", plan: "Enterprise Fleet", status: "Paid", date: "Oct 01, 2026", amount: "$1,250.00" },
                                { name: "VIP Rentals", plan: "Pro Tier", status: "Past Due", date: "Sep 15, 2026", amount: "$450.00", pastDue: true },
                                { name: "City Transit Corp", plan: "Custom Deployment", status: "Paid", date: "Oct 05, 2026", amount: "$3,400.00" },
                                { name: "Dave's Deliveries", plan: "Starter (5 Vehicles)", status: "Paid", date: "Sep 28, 2026", amount: "$99.00" }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">{row.name}</td>
                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.plan}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${row.pastDue ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>{row.status}</span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-500 font-mono text-xs">{row.date}</td>
                                    <td className="px-5 py-4 font-bold font-mono">{row.amount}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button className="text-brand-500 hover:text-brand-600 font-bold text-xs">View Invoice</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderDeviceInventory = () => (
        <div className="max-w-4xl space-y-6">
            <div className="glass-panel p-8 border-l-4 border-l-brand-500">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Smartphone className="text-brand-500" /> Secure Device Inventory</h2>
                <p className="text-slate-500 mb-8 max-w-2xl">Manage Master Stock. Assign devices to a specific client directly, or leave them as 'Unassigned' so the client can register them independently.</p>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <input type="text" placeholder="15-Digit IMEI" className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none" />
                    <input type="text" placeholder="13-Digit M2M SIM" className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none" />
                    <select className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-brand-500 outline-none">
                        <option>Whitelist Only (Unassigned)</option>
                        <option>Assign to: Acme Logistics</option>
                        <option>Assign to: VIP Rentals</option>
                        <option>Assign to: City Transit Corp</option>
                    </select>
                    <button className="btn-primary shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform">Register & Assign</button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr><th className="p-4 font-bold">IMEI</th><th className="p-4 font-bold">SIM / Mobile</th><th className="p-4 font-bold">Status</th><th className="p-4 font-bold">Actions (Remote Config)</th></tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="p-4 font-mono text-sm text-slate-500">863012938475102</td>
                                <td className="p-4 text-sm font-medium">8991203049581</td>
                                <td className="p-4"><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">Assigned</span></td>
                                <td className="p-4 flex gap-2">
                                    <button className="text-xs btn-secondary py-1" onClick={() => alert('Sending Reset Command via TCP Socket Server...')}>Factory Reset</button>
                                    <button className="text-xs btn-secondary py-1 text-brand-500" onClick={() => alert('Configuring Static IP: 104.25.1.55 on Port 5023 via SuperAdmin Mobile SIM...')}>Config via SMS</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderLandingEditor = () => (
        <div className="max-w-4xl space-y-6">
            <div className="glass-panel p-8 border-l-4 border-l-blue-500">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Monitor className="text-blue-500" /> Dynamic Landing Page Editor</h2>
                <p className="text-slate-500 mb-8 max-w-2xl">Modify the public-facing landing page instantaneously. Inject videos, animations, and products without running a rebuild.</p>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Hero Video / Background Animation URL</label>
                        <input type="text" defaultValue="https://assets.geosurepath.com/hero-loop.mp4" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Available Products (Comma Separated for Inquiry Forms)</label>
                        <input type="text" defaultValue="Standard GT06, Advanced AIS-140 Tracker, Immobilizer Relay" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    </div>
                </div>
                <button className="btn-primary mt-6">Save & Publish Live</button>
            </div>
        </div>
    );

    const renderIntegrations = () => (
        <div className="max-w-4xl space-y-6">
            <div className="glass-panel p-8 border-l-4 border-l-indigo-500">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Database className="text-indigo-500" /> RTO / Vahan Integration (AIS-140)</h2>
                <p className="text-slate-500 mb-8 max-w-2xl">Manage Dual-IP forwarding and compliance certificates for Indian Regional Transport Office (RTO) and government BSNL servers.</p>

                <div className="space-y-8">
                    <div>
                        <h4 className="font-bold mb-4 uppercase text-xs tracking-wider text-slate-400">Primary Server (GeoSurePath Original)</h4>
                        <div className="flex gap-4 mb-4">
                            <input type="text" disabled defaultValue="104.25.1.55" className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono" />
                            <input type="text" disabled defaultValue="8080" className="w-1/4 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono" />
                        </div>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-800" />

                    <div>
                        <h4 className="font-bold mb-4 uppercase text-xs tracking-wider text-slate-400">Secondary Forwarding (Vahan / RTO API)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold mb-2 text-sm">Forwarding IP Address</label>
                                <input type="text" placeholder="e.g. 164.100.x.x" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono" />
                            </div>
                            <div>
                                <label className="block font-bold mb-2 text-sm">Port</label>
                                <input type="text" placeholder="e.g. 5050" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <div className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1">Testing Mode Active</div>
                            <p className="text-xs text-amber-600 dark:text-amber-500">Dual-IP forwarding is ready. Ensure your device is explicitly listed in the authorized tracker whitelist before submitting to production BSNL servers to prevent penalization.</p>
                        </div>
                    </div>

                    <button className="btn-primary flex items-center gap-2 text-lg px-8 py-3"><CheckCircle2 size={20} /> Save Forwarding Configuration</button>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout role="ADMIN" activeTab={activeTab} setActiveTab={setActiveTab}>
            {activeTab === 'admin_control' && renderAdminControl()}
            {activeTab === 'devices' && renderDeviceInventory()}
            {activeTab === 'landing' && renderLandingEditor()}
            {activeTab === 'integrations' && renderIntegrations()}
            {activeTab === 'whitelabel' && renderWhiteLabel()}
            {activeTab === 'alerts' && renderAdminControl()}
            {activeTab === 'billing' && renderBilling()}
        </DashboardLayout>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/client" element={<ClientDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
