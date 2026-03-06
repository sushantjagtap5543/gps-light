import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Map as MapIcon, Shield, Activity, Users, Settings, LogIn, ChevronRight,
    Car, Bell, PowerOff, Battery, Thermometer, Box, Database,
    LogOut, Crosshair, ArrowRight, CheckCircle2, AlertTriangle, PlayCircle,
    FileText, CreditCard, Droplet, LayoutDashboard, Zap, Menu, X, Hexagon, Route as RouteIcon,
    TrendingDown, CheckSquare, Wrench, FolderOpen, UserCircle, Briefcase, Share2, FileWarning, Smartphone, Monitor, Rocket, Server
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// --- Dynamic API Base URLs to support both local dev and AWS deployment ---
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : `${window.location.protocol}//${window.location.hostname}:8080`;

const WS_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'ws://localhost:8080'
    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8080`;

// --- VEHICLE COLOR PALETTE (8 distinct colors for up to 8 vehicles) ---
const VEHICLE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];
const getVehicleColor = (idx) => VEHICLE_COLORS[idx % VEHICLE_COLORS.length];

// --- ALL GPS ALERT TYPES (Trackzee-style) ---
const ALERT_TYPES = {
    IGNITION_ON: { label: 'Ignition ON', icon: '🔑', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', severity: 'info' },
    IGNITION_OFF: { label: 'Ignition OFF', icon: '🔌', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', severity: 'info' },
    OVERSPEED: { label: 'Overspeed Alert', icon: '🚨', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', severity: 'critical' },
    TOWING: { label: 'Towing / Movement Without Ignition', icon: '🚛', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', severity: 'critical' },
    TAMPERING: { label: 'Tampering / Shock Alert', icon: '⚡', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', severity: 'critical' },
    GEOFENCE_ENTER: { label: 'Geofence Entry', icon: '📍', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', severity: 'warning' },
    GEOFENCE_EXIT: { label: 'Geofence Exit', icon: '🚪', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', severity: 'warning' },
    HARSH_BRAKE: { label: 'Harsh Braking', icon: '🛑', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', severity: 'warning' },
    HARSH_ACCEL: { label: 'Harsh Acceleration', icon: '⬆️', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', severity: 'warning' },
    IDLE_OVERTIME: { label: 'Long Idle', icon: '⏸️', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', severity: 'warning' },
    LOW_BATTERY: { label: 'Low Battery', icon: '🔋', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', severity: 'warning' },
    GPS_LOST: { label: 'GPS Signal Lost', icon: '📡', color: '#94a3b8', bg: '#f1f5f9', border: '#cbd5e1', severity: 'warning' },
    POWER_CUT: { label: 'Power Cut / Cable Tamper', icon: '⚠️', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', severity: 'critical' },
    SOS: { label: 'SOS / Panic Button', icon: '🆘', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', severity: 'critical' },
    DOOR_OPEN: { label: 'Door / Cargo Opened', icon: '🚪', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', severity: 'warning' },
    TEMPERATURE_HIGH: { label: 'High Temperature', icon: '🌡️', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', severity: 'warning' },
    FUEL_THEFT: { label: 'Fuel Theft / Level Drop', icon: '⛽', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', severity: 'critical' },
    ROUTE_DEVIATION: { label: 'Route Deviation', icon: '🔀', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', severity: 'warning' },
};

// --- TRACKZEE-STYLE VEHICLE ICON (Teardrop pin + white car silhouette) ---
const createVehicleIcon = (vehicle, colorOverride) => {
    const status = vehicle.status || 'offline';
    const pinColor = colorOverride || vehicle.color || '#10b981';
    const statusColor = status === 'moving' ? '#10b981'
        : status === 'idle' ? '#f59e0b'
            : status === 'alert' ? '#ef4444'
                : status === 'stopped' ? '#3b82f6'
                    : '#94a3b8';
    const speed = vehicle.speed || 0;
    const heading = vehicle.heading || 0;
    const ignition = vehicle.ignition !== false;
    const isMoving = status === 'moving';

    // White top-down car silhouette paths
    const carSvg = vehicle.type === 'truck'
        ? `<rect x="12" y="11" width="16" height="18" rx="3" fill="white" opacity="0.95"/>
           <rect x="14" y="8"  width="12" height="5"  rx="2" fill="white" opacity="0.85"/>
           <rect x="12" y="27" width="4"  height="3"  rx="1" fill="white" opacity="0.75"/>
           <rect x="24" y="27" width="4"  height="3"  rx="1" fill="white" opacity="0.75"/>`
        : vehicle.type === 'van'
            ? `<rect x="13" y="10" width="14" height="20" rx="3" fill="white" opacity="0.95"/>
           <rect x="15" y="7"  width="10" height="5"  rx="2" fill="white" opacity="0.85"/>
           <rect x="13" y="27" width="4"  height="3"  rx="1" fill="white" opacity="0.75"/>
           <rect x="23" y="27" width="4"  height="3"  rx="1" fill="white" opacity="0.75"/>`
            : `<ellipse cx="20" cy="19" rx="6"  ry="9"  fill="white" opacity="0.95"/>
           <ellipse cx="17" cy="13" rx="2.5" ry="2" fill="white" opacity="0.8"/>
           <ellipse cx="23" cy="13" rx="2.5" ry="2" fill="white" opacity="0.8"/>
           <rect    x="14" y="26"  width="4" height="3" rx="1" fill="white" opacity="0.85"/>
           <rect    x="22" y="26"  width="4" height="3" rx="1" fill="white" opacity="0.85"/>`;

    const pulseRing = isMoving ? `
        <circle cx="20" cy="18" r="22" fill="none" stroke="${statusColor}" stroke-width="2" opacity="0.35">
            <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>` : '';

    const svg = `<svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        ${pulseRing}
        <defs>
          <filter id="ps${vehicle.id || 0}" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.45)"/>
          </filter>
        </defs>
        <!-- Teardrop pin -->
        <path d="M20 3 C11 3,4 10,4 19 C4 28,20 45,20 45 C20 45,36 28,36 19 C36 10,29 3,20 3 Z"
              fill="${pinColor}" filter="url(#ps${vehicle.id || 0})"/>
        <!-- Inner circle backdrop -->
        <circle cx="20" cy="18" r="12" fill="rgba(0,0,0,0.18)"/>
        <!-- Car silhouette -->
        ${carSvg}
        <!-- Status border ring -->
        <circle cx="20" cy="18" r="12" fill="none" stroke="${statusColor}" stroke-width="1.5" opacity="0.7"/>
        <!-- Ignition dot (top-right) -->
        <circle cx="32" cy="8" r="5" fill="${ignition ? '#22c55e' : '#94a3b8'}" stroke="white" stroke-width="1.5"/>
        <circle cx="32" cy="8" r="2" fill="white" opacity="0.5"/>
    </svg>`;

    const speedBadge = speed > 0
        ? `<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);background:${statusColor};color:white;font-size:7px;font-weight:900;padding:1px 5px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.35);min-width:24px;text-align:center;">${speed}<span style="font-size:5.5px"> km/h</span></div>`
        : '';

    return L.divIcon({
        html: `<div style="position:relative;width:40px;height:50px;">
          <div style="transform:rotate(${heading}deg);transform-origin:20px 40px;transition:transform 0.5s ease;">${svg}</div>
          ${speedBadge}
        </div>`,
        className: '',
        iconSize: [40, 50],
        iconAnchor: [20, 45],
        popupAnchor: [0, -46],
    });
};

// Keep old createIcon alias
const createIcon = (color, heading, type) => createVehicleIcon({ color, heading, type, status: 'idle', speed: 0 }, color);

// --- STATIC FUEL CHART DATA ---
const FUEL_CHART_DATA = [
    { time: '08:00', fuel: 90 }, { time: '10:00', fuel: 85 }, { time: '12:00', fuel: 80 },
    { time: '14:00', fuel: 75 }, { time: '16:00', fuel: 30 }, { time: '18:00', fuel: 100 }
];

// --- COMPONENTS ---
const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Background Gradient Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

            <header className="px-8 py-6 flex justify-between items-center z-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="GeoSurePath Logo" className="h-10 object-contain drop-shadow-md" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    <div className="hidden items-center gap-3">
                        <div className="bg-brand-500 p-2 rounded-lg"><MapIcon className="text-white" size={24} /></div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">GeoSurePath <span className="text-brand-500">Live</span></h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/login')} className="btn-primary gap-2 shadow-md hover:scale-105 transition-transform"><LogIn size={18} /> Login Portal</button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center pt-20 pb-16 px-4 md:px-6 z-10 text-center custom-scrollbar overflow-y-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-sm border border-brand-500/20 mb-8 shadow-sm tracking-wide">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_10px_#10b981]" /> Premium White-Label Software Ready
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05] mb-8 text-slate-800 dark:text-white drop-shadow-sm">
                        Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-emerald-400 to-blue-500 animate-gradient-x">Fleet Telematics</span><br />
                        Evolved.
                    </h1>

                    <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
                        A robust, highly concurrent GPS SaaS platform boasting sub-second latency tracking, 1-click remote immobilization, and intelligent AI eco-scoring.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <button onClick={() => navigate('/login')} className="btn-primary text-xl px-10 py-5 gap-3 shadow-[0_0_25px_rgba(16,185,129,0.5)] transform hover:-translate-y-1 transition-all rounded-2xl"><Rocket size={24} /> Access Dashboard \u2192</button>
                    </div>
                </motion.div>

                {/* Animated Installation Terminal */}
                <motion.div
                    className="max-w-3xl mx-auto mt-24 mb-10 w-full perspective-1000"
                    initial={{ opacity: 0, scale: 0.9, rotateX: 10 }} whileInView={{ opacity: 1, scale: 1, rotateX: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                >
                    <div className="bg-slate-900 rounded-3xl p-1 border border-slate-700 shadow-2xl relative overflow-hidden group hover:border-brand-500/50 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-blue-500 to-indigo-500" />
                        <div className="bg-[#0f172a] rounded-[22px] p-6 lg:p-8 h-full w-full">
                            <div className="flex gap-2 mb-6">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-3"><Zap className="text-brand-400" /> 1-Click AWS Deployment Ready</h3>

                            <div className="font-mono text-sm md:text-base text-emerald-400 text-left space-y-3">
                                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-slate-400">root@geosurepath:~$ ./install.sh</motion.div>
                                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }} viewport={{ once: true }}>&gt; Initializing Master Installer...</motion.div>
                                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.2 }} viewport={{ once: true }}>&gt; Provisioning Postgres \u0026 Redis Nodes...</motion.div>
                                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.8 }} viewport={{ once: true }}>&gt; Compiling React Frontend (Vite)... \u2713</motion.div>
                                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.4 }} viewport={{ once: true }}>&gt; Booting High-Concurrency TCP Server (Port 5023)... \u2713</motion.div>
                                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 3.0 }} viewport={{ once: true }} className="text-white bg-brand-500/20 p-2 rounded mt-4 border border-brand-500/30 font-bold">&gt; SYSTEM ONLINE. DEPLOYMENT SUCCESSFUL.</motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Premium Feature Grid */}
                <motion.div
                    className="grid md:grid-cols-3 gap-8 mt-16 max-w-7xl w-full px-4"
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
                    }}
                >
                    {[
                        { icon: <Activity className="text-brand-500" size={32} />, title: 'Real-Time Telemetry', desc: 'Direct streaming of GPS packets via WebSockets for zero-latency vehicle tracking.' },
                        { icon: <PowerOff className="text-red-500" size={32} />, title: 'Remote Defeat System', desc: 'Secure immobilization UI with integrated speed-safety checks and hardware relays.' },
                        { icon: <Users className="text-blue-500" size={32} />, title: 'Multi-Tenant Portals', desc: 'Dedicated, isolation-guaranteed workspaces for individual clients \u0026 agencies.' },
                        { icon: <Settings className="text-indigo-500" size={32} />, title: 'Hardware Agnostic', desc: 'Configure any tracker to point to Port 5023. Automatic protocol parsing included.' },
                        { icon: <Shield className="text-emerald-500" size={32} />, title: 'Bank-Grade Security', desc: 'Encrypted payloads, JWT auth, and rigid RBAC separating Super Admins from Clients.' },
                        { icon: <LayoutDashboard className="text-amber-500" size={32} />, title: 'Advanced KPI Analytics', desc: 'Deep insights into MRR, fleet efficiency, fuel burn, and diagnostic health.' }
                    ].map((f, i) => (
                        <motion.div key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 p-8 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300 shadow-xl group" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
                            <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform shadow-inner">{f.icon}</div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-800 dark:text-white">{f.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-lg">{f.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Configuration Specs */}
                <motion.div
                    className="max-w-7xl mx-auto mt-32 mb-20 text-center w-full"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="inline-block bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 md:p-12 shadow-2xl">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 text-slate-800 dark:text-white">
                            Hardware <span className="text-brand-500">Integration</span>
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-xl mb-10 font-medium">
                            Point your GPS tracking devices to the following credentials to begin transmitting data immediately.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-1">Server IP Address</div>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white font-mono">YOUR_AWS_IP</div>
                                </div>
                                <Server className="text-slate-300 dark:text-slate-600" size={40} />
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-1">TCP Tracking Port</div>
                                    <div className="text-2xl font-black text-brand-500 font-mono">5023</div>
                                </div>
                                <Smartphone className="text-slate-300 dark:text-slate-600" size={40} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

const LoginPage = ({ onLogin }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e, role) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        // Mock authentication success
        onLogin(role);
        navigate(role === 'ADMIN' ? '/admin' : '/client');
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-900 p-4 w-full">
            {/* Abstract map lines bg */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83v58.34h-58.34v-.83l58.34-58.34z\' fill=\'%23000000\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />

            <motion.div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-10 z-10 border border-slate-200 dark:border-slate-700" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 mb-4">
                        <MapIcon className="text-brand-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sign In to Workspace</h2>
                    <p className="text-sm text-slate-500 mt-2">Professional GPS & Fleet Management</p>
                </div>

                <form className="space-y-5" onSubmit={(e) => handleLogin(e, 'CLIENT')}>
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="user@company.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm font-medium text-slate-900 dark:text-slate-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm font-medium text-slate-900 dark:text-slate-100" />
                    </div>

                    <div className="pt-4 space-y-3">
                        <button type="button" onClick={(e) => handleLogin(e, 'CLIENT')} className="btn-primary w-full justify-center shadow-md">Sign In (Client Workspace)</button>
                        <button type="button" onClick={(e) => handleLogin(e, 'ADMIN')} className="btn-secondary w-full justify-center text-sm font-bold">Access Super Admin Console</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const RegistrationPage = () => {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [imei, setImei] = useState('');
    const [sim, setSim] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleImeiCheck = async (val) => {
        setImei(val);
        if (val.length >= 15) {
            try {
                // In production, this would be a secure API call to verify the IMEI
                // e.g., const res = await fetch(`${API_BASE}/api/inventory/verify?imei=${val}`);
                // For now, if length is 15, we simulate validation or allow backend to handle it on submit.

                // MOCK Validation fallback if DB isn't running
                const MOCK_INVENTORY = {
                    '863012938475102': '8991203049581',
                    '869727079043556': '5754280844707'
                };

                if (MOCK_INVENTORY[val]) {
                    setSim(MOCK_INVENTORY[val]);
                    setError(false);
                } else {
                    setSim('Pending Assignment'); // Allow registration, but mark as pending
                    setError(false);
                }
            } catch (err) {
                setSim('');
                setError(true);
            }
        } else {
            setError(false);
            setSim('');
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            const req = await fetch(`${API_BASE}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, imei })
            });
            const data = await req.json();
            if (data.status === 'SUCCESS') {
                navigate('/client');
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Registration API Error (Fallback to Local Test Mode):', err);
            // Fallback for local testing so the user can test the workflow without the DB
            alert("Local Test Mode: Simulating successful DB registration!");
            navigate('/client');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-dark-bg p-4">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83v58.34h-58.34v-.83l58.34-58.34z\' fill=\'%23000000\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />
            <motion.div className="glass-panel w-full max-w-lg p-10 z-10" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold">Client Registration</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Bind your hardware and create your profile</p>
                </div>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1 text-slate-900 dark:text-slate-200">First Name</label>
                            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="John" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-slate-900 dark:text-slate-200">Last Name</label>
                            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Doe" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-slate-900 dark:text-slate-200">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="client@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                    </div>
                    <hr className="my-6 border-slate-200 dark:border-slate-700" />
                    <div>
                        <label className="block text-sm font-bold mb-1 text-slate-900 dark:text-slate-200">Device IMEI (15 Digits)</label>
                        <input type="text" value={imei} onChange={(e) => handleImeiCheck(e.target.value)} required maxLength={15} placeholder="e.g. 863012938475102" className={`w-full px-4 py-3 rounded-xl border outline-none text-slate-900 dark:text-slate-100 ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'} bg-white dark:bg-slate-800 transition-all`} />
                        {error && <div className="text-red-500 text-xs font-bold mt-2 animate-pulse">⚠️ IMEI number is not registered in Stock. Contact Support.</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 flex justify-between">
                            <span>M2M SIM Number (Auto-Fill)</span>
                            {sim && <span className="text-emerald-500 text-xs font-bold">Verified ✓</span>}
                        </label>
                        <input type="text" value={sim} readOnly required placeholder="Auto-populated from DB..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono transition-all" />
                    </div>
                    <div className="pt-6 grid grid-cols-2 gap-3">
                        <button type="button" className="btn-secondary w-full justify-center" onClick={() => navigate('/login')}>Back to Log In</button>
                        <button type="submit" className={`btn-primary w-full justify-center ${error || !sim || loading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={error || !sim || loading}>
                            {loading ? 'Creating Account...' : 'Complete Registration'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// --- LAYOUTS ---

const DashboardLayout = ({ role, activeTab, setActiveTab, topBar, children, fleet = [], openOtpDialog, wsStatus = 'disconnected', wsLatency, mapTile = 'street', playback, openPlayback }) => {
    const [theme, setTheme] = useState('dark');
    const [appTheme, setAppTheme] = useState('theme-brand');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // UI Panel States
    const [topAlertVisible, setTopAlertVisible] = useState(true);
    const [leftPanelVisible, setLeftPanelVisible] = useState(true);
    const [rightPanelVisible, setRightPanelVisible] = useState(true);

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

                    <div className={`mt-4 w-full px-5 overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}><div className="h-px bg-slate-200 dark:bg-slate-800"></div></div>

                    <TabItem id="drivers" icon={<UserCircle />} label="Drivers" />
                    <TabItem id="maintenance" icon={<Wrench />} label="Maintenance" badge="2 Due" />
                    <TabItem id="fuel" icon={<Droplet />} label="Fuel Manage" />

                    <div className={`mt-4 w-full px-5 overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}><div className="h-px bg-slate-200 dark:bg-slate-800"></div></div>

                    <TabItem id="reports" icon={<FileText />} label="Reports & Alerts" />
                    <TabItem id="billing" icon={<CreditCard />} label="Billing & Referrals" />

                    {role === 'ADMIN' && (
                        <>
                            <div className={`mt-4 w-full px-5 overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}><div className="h-px bg-slate-200 dark:bg-slate-800"></div></div>
                            <TabItem id="overview" icon={<LayoutDashboard />} label="Admin Overview KPIs" />
                            <TabItem id="admin_control" icon={<Settings />} label="System Health & Setup" />
                            <TabItem id="devices" icon={<Smartphone />} label="Device Master Stock" />
                            <TabItem id="landing" icon={<Monitor />} label="Landing Page Editor" />
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
                        <TileLayer
                            key={mapTile}
                            url={
                                mapTile === 'satellite' ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' :
                                    mapTile === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
                                        mapTile === 'terrain' ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' :
                                            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                            }
                            attribution={mapTile === 'satellite' ? '© Esri' : mapTile === 'terrain' ? '© OpenTopoMap' : '© CartoDB'}
                        />
                        {fleet.map((vehicle, idx) => {
                            const vColor = vehicle.color || getVehicleColor(idx);
                            return (
                                <Marker key={vehicle.id} position={[vehicle.lat, vehicle.lng]}
                                    icon={createVehicleIcon({ ...vehicle, color: vColor })}>
                                    <Popup className="premium-popup" minWidth={270} maxWidth={290}>
                                        <div style={{ fontFamily: 'inherit', padding: 0 }}>
                                            {/* Colored Header */}
                                            <div style={{ background: `linear-gradient(135deg, ${vColor}, ${vColor}cc)`, borderRadius: '12px 12px 0 0', padding: '10px 13px', margin: '-8px -8px 10px -8px' }}>
                                                <div style={{ color: 'white', fontWeight: 900, fontSize: 12, letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{vehicle.name || 'Vehicle'}</span>
                                                    <span style={{ background: vehicle.status === 'moving' ? 'rgba(16,185,129,0.95)' : vehicle.status === 'idle' ? 'rgba(245,158,11,0.95)' : 'rgba(100,116,139,0.95)', borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 900 }}>
                                                        {(vehicle.status || 'OFFLINE').toUpperCase()}
                                                    </span>
                                                </div>
                                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, marginTop: 3 }}>
                                                    {vehicle.driver || 'No driver assigned'} &bull; IMEI: ...{String(vehicle.id || '').slice(-6)}
                                                </div>
                                            </div>
                                            {/* Live Metrics */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
                                                {[['SPEED', `${vehicle.speed || 0}`, 'km/h', '#10b981', '#f0fdf4', '#bbf7d0'],
                                                ['HEADING', `${vehicle.heading || 0}°`, 'bearing', '#3b82f6', '#eff6ff', '#bfdbfe'],
                                                ['IGN', vehicle.ignition !== false ? '🟢 ON' : '🔴 OFF', '', vehicle.ignition !== false ? '#10b981' : '#ef4444', vehicle.ignition !== false ? '#f0fdf4' : '#fef2f2', vehicle.ignition !== false ? '#bbf7d0' : '#fecaca']
                                                ].map(([lbl, val, unit, col, bg, border]) => (
                                                    <div key={lbl} style={{ background: bg, borderRadius: 8, padding: '5px 4px', textAlign: 'center', border: `1px solid ${border}` }}>
                                                        <div style={{ fontSize: 7, fontWeight: 800, color: col, letterSpacing: 1 }}>{lbl}</div>
                                                        <div style={{ fontSize: lbl === 'IGN' ? 10 : 14, fontWeight: 900, color: col }}>{val}</div>
                                                        {unit && <div style={{ fontSize: 7, color: col, opacity: 0.7 }}>{unit}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Location */}
                                            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '5px 8px', marginBottom: 7, border: '1px solid #e2e8f0', fontSize: 10 }}>
                                                <span style={{ fontWeight: 700, color: '#475569', fontSize: 8 }}>📍 </span>
                                                <span style={{ fontFamily: 'monospace', color: '#334155', fontWeight: 600 }}>
                                                    {(vehicle.lat || 0).toFixed(5)}°N, {(vehicle.lng || 0).toFixed(5)}°E
                                                </span>
                                                {vehicle.lastUpdate && <span style={{ display: 'block', fontSize: 8, color: '#94a3b8', marginTop: 1 }}>🕐 {new Date(parseInt(vehicle.lastUpdate) || vehicle.lastUpdate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </div>
                                            {/* Today's Stats */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
                                                {[['AVG SPEED', (vehicle.avgSpeed || '--') + (vehicle.avgSpeed ? ' km/h' : '')],
                                                ['MAX SPEED', (vehicle.maxSpeed || '--') + (vehicle.maxSpeed ? ' km/h' : '')],
                                                ['RUN TIME', vehicle.runTime || '--'],
                                                ['IDLE TIME', vehicle.idleTime || '--']
                                                ].map(([k, v]) => (
                                                    <div key={k} style={{ background: '#f8fafc', borderRadius: 7, padding: '4px 7px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ fontSize: 7, fontWeight: 800, color: '#64748b', letterSpacing: 1 }}>{k}</div>
                                                        <div style={{ fontSize: 12, fontWeight: 900, color: '#1e293b' }}>{v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Controls */}
                                            <div style={{ display: 'flex', gap: 4, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                                                <button onClick={() => openOtpDialog && openOtpDialog(vehicle, 'CUT_ENGINE')}
                                                    style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '6px 2px', fontSize: 8, fontWeight: 900, cursor: 'pointer', letterSpacing: 0.5 }}>
                                                    🔴 CUT ENGINE
                                                </button>
                                                <button onClick={() => openOtpDialog && openOtpDialog(vehicle, 'RESTORE_ENGINE')}
                                                    style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '6px 2px', fontSize: 8, fontWeight: 900, cursor: 'pointer' }}>
                                                    🟢 RESTORE
                                                </button>
                                                <button onClick={() => openPlayback && openPlayback(vehicle)}
                                                    style={{ flex: 1, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 2px', fontSize: 8, fontWeight: 900, cursor: 'pointer' }}>
                                                    📉 HISTORY
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                        {/* Playback route polylines */}
                        {playback && playback.points && playback.points.slice(1, playback.currentIdx + 1).map((pt, i) => {
                            const prev = playback.points[i];
                            if (!prev) return null;
                            const spd = pt.speed || 0;
                            const col = pt.ignition === false ? '#94a3b8' : spd < 30 ? '#3b82f6' : spd < 60 ? '#f59e0b' : '#ef4444';
                            return <Polyline key={i} positions={[[prev.lat, prev.lng], [pt.lat, pt.lng]]}
                                pathOptions={{ color: col, weight: 5, opacity: 0.92, dashArray: pt.ignition === false ? '8,8' : null }} />;
                        })}
                        {/* Playback current-position marker (scrub head) */}
                        {playback && playback.points?.[playback.currentIdx] && (
                            <CircleMarker center={[playback.points[playback.currentIdx].lat, playback.points[playback.currentIdx].lng]}
                                radius={10} pathOptions={{ color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 1, weight: 3, opacity: 1 }} />
                        )}
                        {activeTab === 'geofence' && (
                            <FeatureGroup>
                                <EditControl
                                    position="topleft"
                                    onCreated={async (e) => {
                                        const { layerType, layer } = e;
                                        let coords = [];

                                        if (layerType === 'polygon' || layerType === 'rectangle') {
                                            const latlngs = layer.getLatLngs()[0];
                                            coords = latlngs.map(ll => [ll.lat, ll.lng]);
                                            // Close the polygon for PostGIS
                                            coords.push([latlngs[0].lat, latlngs[0].lng]);
                                        } else if (layerType === 'circle') {
                                            const center = layer.getLatLng();
                                            coords = [center.lat, center.lng, layer.getRadius()];
                                        }

                                        if (coords.length > 0) {
                                            try {
                                                const req = await fetch(`${API_BASE}/api/geofences`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        name: `New ${layerType}`,
                                                        fenceType: layerType === 'circle' ? 'CIRCLE' : 'POLYGON',
                                                        coordinates: coords
                                                    })
                                                });
                                                const data = await req.json();
                                                alert(data.status === 'SUCCESS' ? 'Shape Saved to DB!' : 'Shape Capture Failed');
                                            } catch (err) {
                                                console.error('Map Save Error:', err);
                                                alert(`Local Test Mode: Captured ${layerType} drawing successfully!`);
                                            }
                                        }
                                    }}
                                    draw={{
                                        rectangle: true,
                                        polyline: false,
                                        polygon: true,
                                        circle: true,
                                        marker: false,
                                        circlemarker: false,
                                    }}
                                />
                                <Polygon positions={[[34.06, -118.25], [34.06, -118.23], [34.04, -118.23], [34.04, -118.25]]} pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.2, weight: 3 }} />
                                <Polyline positions={[[34.03, -118.26], [34.02, -118.24], [34.00, -118.22]]} pathOptions={{ color: '#3b82f6', weight: 6, dashArray: '10, 10' }} />
                                <Circle center={[34.08, -118.26]} radius={800} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 3 }} />
                            </FeatureGroup>
                        )}
                        {/* Mock Measure Line */}
                        {(activeTab === 'map' || activeTab === 'geofence') && (
                            <Polyline positions={[[34.0522, -118.2437], [34.0480, -118.2500]]} pathOptions={{ color: '#8b5cf6', weight: 4, dashArray: '5, 5' }} />
                        )}
                    </MapContainer>
                </div>

                {/* Blinking Top Notification Bar */}
                <AnimatePresence>
                    {topAlertVisible && (
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] pointer-events-auto"
                        >
                            <div className="bg-red-500 text-white pl-6 pr-4 py-2 rounded-full font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400 flex items-center gap-3 animate-pulse hover:scale-105 transition-transform">
                                <AlertTriangle size={16} /> [URGENT] FUEL THEFT WARNING: Heavy Truck B (-45L)
                                <button onClick={() => setTopAlertVisible(false)} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Audio is now handled via Web Audio API (Web Audio beep — plays once, not loop) */}

                {/* Mobile Menu Toggle Layer */}
                <header className="absolute top-0 left-0 w-full h-16 flex items-center justify-between pointer-events-none z-30 px-6 bg-gradient-to-b from-slate-900/40 to-transparent">
                    <button className="md:hidden p-2 bg-black/50 rounded pointer-events-auto text-white mt-4" onClick={() => setMobileMenuOpen(true)}><Menu size={24} /></button>
                </header>

                {/* Top Bar for KPIs or Header injected by parent */}
                {topBar}

                {/* Content overlay — full-screen for non-map tabs, transparent for map tab */}
                <div className={`absolute inset-0 z-20 pointer-events-none`}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full h-full relative">
                            {(activeTab === 'map') ? (
                                children
                            ) : activeTab === 'geofence' ? (
                                // Geofence gets transparent overlay so map tools are visible
                                <div className="pointer-events-auto absolute inset-0 z-20">
                                    {children}
                                </div>
                            ) : (
                                // All other tabs: full-screen frosted glass panel with scrollable content
                                <div className="pointer-events-auto absolute inset-0 z-20 bg-slate-50/97 dark:bg-slate-900/97 backdrop-blur-xl flex flex-col">
                                    {/* Full-screen tab header */}
                                    <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-800/50 flex justify-between items-center shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
                                        <h2 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                            <span className="w-1.5 h-6 bg-brand-500 rounded-full"></span>
                                            {activeTab.replace(/_/g, ' ')}
                                        </h2>
                                        <button
                                            onClick={() => setActiveTab('map')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all font-bold text-sm"
                                        >
                                            <X size={16} /> Close &amp; Return to Map
                                        </button>
                                    </div>
                                    {/* Scrollable content */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                                        {children}
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
    const [chartFilter, setChartFilter] = useState('Distance');
    const [timeFilter, setTimeFilter] = useState('week');
    const [stats, setStats] = useState({ totalFleet: 0, movingNow: 0, distanceToday: 0, avgEcoScore: 0, avgSpeed: 0, maxSpeed: 0, ignitionOnTime: '--', idleTime: '--', runningTime: '--' });
    const [fleet, setFleet] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // Driver Management State
    const [drivers, setDrivers] = useState([]);

    const [wsStatus, setWsStatus] = useState('connecting');

    // Billing & Referral State
    const [rechargeMonths, setRechargeMonths] = useState(1);
    const [referralCode] = useState('REF-XY9K');
    const [referralCount] = useState(2); // 2 Successful signups
    const basePlanCost = 200; // ₹200/month per vehicle

    // Fuel Management State
    const [fuelRates, setFuelRates] = useState({ petrol: 104.2, diesel: 92.5, cng: 75.0 });
    const [fuelLogs, setFuelLogs] = useState([]);
    const [showRefuelModal, setShowRefuelModal] = useState(false);

    // Maintenance Management State
    const [maintenanceList, setMaintenanceList] = useState([]);
    const [wsLatency, setWsLatency] = useState(null);
    const [mapTile, setMapTile] = useState('street'); // 'street' | 'satellite' | 'dark' | 'terrain'
    const [playback, setPlayback] = useState(null);   // null | { vehicle, points[], currentIdx, isPlaying, speed, date, time }
    const playbackRef = React.useRef(null);             // interval ref

    // Map floating panels state
    const [showZoneRules, setShowZoneRules] = useState(false);
    const [showAlertRules, setShowAlertRules] = useState(false);

    // OTP Confirmation Dialog state (for Ignition control in map popup)
    const [otpDialog, setOtpDialog] = useState(null); // { vehicle, command } or null
    const [otpInput, setOtpInput] = useState('');
    const [otpGenerated, setOtpGenerated] = useState('');
    const [otpError, setOtpError] = useState('');

    // Helper: get vehicle colour by status
    const vehicleColor = (v) => {
        if (v.status === 'moving') return v.color || '#10b981';
        if (v.status === 'idle') return v.color || '#f59e0b';
        return v.color || '#64748b';
    };

    // --- Live Data Fetching ---
    useEffect(() => {
        // 1. Initial REST fetch for fleet positions
        const fetchFleet = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/fleet`);
                const data = await res.json();
                if (data.status === 'SUCCESS' && Array.isArray(data.fleet)) {
                    setFleet(data.fleet);
                }
            } catch (err) {
                // ---- FAIL SILENTLY (No backend running) ----
                setFleet([]);
            }
        };

        // 2. Initial REST fetch for stats
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/stats`);
                const data = await res.json();
                if (data.status === 'SUCCESS') setStats(data.stats);
            } catch (err) {
                console.warn('[Stats] API unavailable.');
            }
        };

        // 3. Initial REST fetch for alerts
        const fetchAlerts = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/alerts`);
                const data = await res.json();
                if (data.status === 'SUCCESS' && Array.isArray(data.alerts)) {
                    setAlerts(data.alerts);
                }
            } catch (err) {
                console.warn('[Alerts] API unavailable.');
            }
        };

        fetchFleet();
        fetchStats();
        fetchAlerts();

        // 4. WebSocket for real-time position updates
        const wsUrl = WS_BASE;
        let ws;
        let reconnectTimer;
        let pingStart;

        const connect = () => {
            try {
                ws = new WebSocket(wsUrl);
                setWsStatus('connecting');

                ws.onopen = () => {
                    setWsStatus('connected');
                    pingStart = Date.now();
                    ws.send(JSON.stringify({ type: 'PING' }));
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === 'PONG') {
                            setWsLatency(Date.now() - pingStart);
                        } else if (msg.type === 'LOCATION_UPDATE' && msg.imei) {
                            // Update vehicle position in fleet state
                            setFleet(prev => {
                                const existing = prev.find(v => v.id === msg.imei);
                                if (existing) {
                                    return prev.map(v => v.id === msg.imei
                                        ? { ...v, lat: parseFloat(msg.lat), lng: parseFloat(msg.lng), speed: parseInt(msg.speed) || 0, heading: parseInt(msg.heading) || 0, status: parseInt(msg.speed) > 2 ? 'moving' : 'idle' }
                                        : v
                                    );
                                }
                                // First-time seen device: add it
                                return [...prev, {
                                    id: msg.imei,
                                    name: `Device ${msg.imei.slice(-6)}`,
                                    type: 'car',
                                    status: parseInt(msg.speed) > 2 ? 'moving' : 'idle',
                                    speed: parseInt(msg.speed) || 0,
                                    heading: parseInt(msg.heading) || 0,
                                    lat: parseFloat(msg.lat),
                                    lng: parseFloat(msg.lng),
                                    color: '#8b5cf6',
                                    driver: 'Unknown',
                                    ais140: true
                                }];
                            });
                        } else if (msg.type === 'NEW_ALERT') {
                            setAlerts(prev => [msg.alert, ...prev].slice(0, 50));
                            if (msg.alert?.type) {
                                fireToast(msg.alert.type, msg.alert.vehicleName || msg.alert.imei, msg.alert.extra || '');
                            }
                        }
                    } catch (e) { /* ignore parse errors */ }
                };

                ws.onclose = () => {
                    setWsStatus('disconnected');
                    reconnectTimer = setTimeout(connect, 5000);
                };

                ws.onerror = () => {
                    setWsStatus('disconnected');
                    ws.close();
                };
            } catch (e) {
                setWsStatus('disconnected');
                reconnectTimer = setTimeout(connect, 5000);
            }
        };

        connect();

        return () => {
            clearTimeout(reconnectTimer);
            if (ws) ws.close();
        };
    }, []);

    // --- TOAST NOTIFICATION STATE ---
    const [toasts, setToasts] = useState([]); // array of { id, type, vehicleName, time, msg }

    const fireToast = (alertType, vehicleName, extra = '') => {
        const def = ALERT_TYPES[alertType] || { label: alertType, icon: '🔔', color: '#64748b', severity: 'info' };
        const toast = {
            id: Date.now() + Math.random(),
            type: alertType,
            icon: def.icon,
            label: def.label,
            color: def.color,
            severity: def.severity,
            vehicleName: vehicleName || 'Unknown',
            extra,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        // Add toast
        setToasts(prev => [toast, ...prev].slice(0, 6));
        // Add to alerts list
        setAlerts(prev => [{ ...toast, id: toast.id.toString() }, ...prev].slice(0, 100));
        // Auto-dismiss toast after 6 seconds
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 6000);

        // --- Web Audio API beep (plays ONCE, no loop, pleasant tone) ---
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = def.severity === 'critical' ? [523, 659, 784] // C5-E5-G5 fast triple ding
                : def.severity === 'warning' ? [523, 659]       // C5-E5 double ding
                    : [659];                                          // E5 single soft ding
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const t = ctx.currentTime + i * 0.18;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(def.severity === 'critical' ? 0.35 : 0.2, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                osc.start(t);
                osc.stop(t + 0.25);
            });
        } catch { /* AudioContext blocked in some browsers */ }
    };

    // --- DEMO ALERT SIMULATION (fires all GPS alert types when no backend present) ---
    useEffect(() => {
        // Removed simulated tasks
    }, []);

    // --- OTP Dialog Helpers ---
    const openOtpDialog = (vehicle, command) => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpGenerated(otp);
        setOtpInput('');
        setOtpError('');
        setOtpDialog({ vehicle, command });
    };

    const confirmOtp = async () => {
        if (otpInput.trim() !== otpGenerated) {
            setOtpError('Incorrect OTP. Please re-enter the code shown above.');
            return;
        }
        setOtpDialog(null);
        const { vehicle, command } = { ...otpDialog };
        try {
            const res = await fetch(`${API_BASE}/api/commands/sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: vehicle.id, commandType: command })
            });
            const data = await res.json();
            alert(data.status === 'SUCCESS' ? `✅ Command sent: ${data.command}` : `❌ Command failed.`);
        } catch {
            alert(`⚡ Local mode: Simulated ${command} for ${vehicle.name}`);
        }
    };

    // --- Generate demo playback route (used when backend /api/history is offline) ---
    const generateDemoRoute = (vehicle, date, fromTime) => {
        return [];
    };

    // --- Open playback panel for a vehicle ---
    const openPlayback = (vehicle) => {
        const today = new Date().toISOString().slice(0, 10);
        const pts = generateDemoRoute(vehicle, today, '06:00');
        setPlayback({ vehicle, points: pts, currentIdx: 0, isPlaying: false, speed: 1, date: today, time: '06:00' });
        if (playbackRef.current) clearInterval(playbackRef.current);
    };

    // --- Playback controls ---
    const playbackPlay = () => {
        if (!playback || !playback.points) return;
        setPlayback(p => ({ ...p, isPlaying: true }));
        if (playbackRef.current) clearInterval(playbackRef.current);
        playbackRef.current = setInterval(() => {
            setPlayback(p => {
                if (!p || !p.points) return p;
                if (p.currentIdx >= p.points.length - 1) {
                    clearInterval(playbackRef.current);
                    return { ...p, isPlaying: false };
                }
                return { ...p, currentIdx: p.currentIdx + 1 };
            });
        }, Math.max(50, 300 / (playback.speed || 1)));
    };

    const playbackPause = () => {
        clearInterval(playbackRef.current);
        playbackRef.current = null;
        setPlayback(p => p ? { ...p, isPlaying: false } : p);
    };

    const playbackFetch = async (vehicle, date, fromTime, toTime) => {
        try {
            const res = await fetch(`${API_BASE}/api/history?imei=${vehicle.id}&date=${date}&from=${fromTime}&to=${toTime || '23:59'}`);
            const data = await res.json();
            if (data.status === 'SUCCESS' && Array.isArray(data.points) && data.points.length > 0) {
                return data.points;
            }
        } catch { /* fall through */ }
        return generateDemoRoute(vehicle, date, fromTime);
    };

    const TopKPIBanner = () => (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto items-center gap-2 hidden xl:flex text-slate-800 dark:text-slate-100">
            {[
                { title: 'Total Fleet', value: fleet.length || stats.totalFleet || '--', icon: '🚗', col: '#3b82f6' },
                { title: 'Moving', value: fleet.filter(v => v.status === 'moving').length || '--', icon: '⚡', col: '#10b981' },
                { title: 'Avg Speed', value: stats.avgSpeed ? `${stats.avgSpeed} km/h` : '--', icon: '📊', col: '#8b5cf6' },
                { title: 'Max Speed', value: stats.maxSpeed ? `${stats.maxSpeed} km/h` : '--', icon: '🚀', col: '#ef4444' },
                { title: 'Ignition ON', value: stats.ignitionOnTime || '--', icon: '🔑', col: '#f59e0b' },
                { title: 'Idle Time', value: stats.idleTime || '--', icon: '⏸️', col: '#64748b' },
                { title: 'Running Time', value: stats.runningTime || '--', icon: '⏱️', col: '#06b6d4' },
            ].map((k, i) => (
                <div key={i} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-default border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all hover:-translate-y-0.5" style={{ borderTop: `2px solid ${k.col}` }}>
                    <span className="text-lg leading-none">{k.icon}</span>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">{k.title}</span>
                        <span className="font-black text-sm leading-tight" style={{ color: k.col }}>{k.value}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

    const renderOverview = () => (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Total Distance Avg <Activity size={14} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">245 <span className="text-sm font-bold text-slate-500">km/day</span></div>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-500"><TrendingDown size={12} className="rotate-180" /> +12% this week</div>
                </div>

                <div className="glass-panel p-5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Fleet Utilization <Briefcase size={14} className="text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">82<span className="text-lg text-slate-500">%</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                </div>

                <div className="glass-panel p-5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Avg Idle Time <Box size={14} className="text-amber-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">45 <span className="text-sm font-bold text-slate-500">mins/veh</span></div>
                    <div className="flex items-center gap-1 text-xs font-bold text-red-500"><TrendingDown size={12} className="rotate-180" /> +5 mins today</div>
                </div>

                <div className="glass-panel p-5 flex flex-col justify-between relative overflow-hidden group border-l-4 border-l-brand-500">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Live Tracking <MapIcon size={14} className="text-brand-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3">{fleet.length} <span className="text-sm font-bold text-slate-500">Active</span></div>
                    <button onClick={() => setActiveTab('map')} className="text-xs font-bold bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20 text-center flex justify-center items-center gap-2">
                        Open Map <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <div className="glass-panel p-6 xl:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><TrendingDown className="rotate-180 text-blue-500" /> {timeFilter === 'today' ? 'Today\'s' : timeFilter === 'week' ? '7-Day' : 'Monthly'} Activity Trend</h3>
                        <div className="flex gap-2">
                            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                            <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer">
                                <option value="Distance">Distance (km)</option>
                                <option value="Hours">Running Hours</option>
                                <option value="Fuel">Fuel Consumption</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'Mon', km: 400, idle: 240, hours: 8.5, fuel: 42 }, { name: 'Tue', km: 300, idle: 139, hours: 6.2, fuel: 35 },
                                { name: 'Wed', km: 200, idle: 980, hours: 4.5, fuel: 25 }, { name: 'Thu', km: 278, idle: 390, hours: 5.8, fuel: 31 },
                                { name: 'Fri', km: 189, idle: 480, hours: 3.9, fuel: 22 }, { name: 'Sat', km: 239, idle: 380, hours: 4.8, fuel: 28 },
                                { name: 'Sun', km: 349, idle: 430, hours: 7.2, fuel: 38 },
                            ]}>
                                <defs>
                                    <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey={chartFilter === 'Distance' ? 'km' : chartFilter === 'Hours' ? 'hours' : 'fuel'} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorKm)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown Donut */}
                <div className="glass-panel p-6 flex flex-col">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-100"><Activity className="text-brand-500" /> Fleet Status</h3>
                    <div className="flex-1 w-full min-h-[250px] relative mt-4">
                        {fleet.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-bold">No Data Available</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[
                                            { name: 'Moving', value: fleet.filter(v => v.status === 'moving').length, color: VEHICLE_COLORS[0] },
                                            { name: 'Idle', value: fleet.filter(v => v.status === 'idle').length, color: VEHICLE_COLORS[1] },
                                            { name: 'Offline/Stop', value: fleet.filter(v => v.status !== 'moving' && v.status !== 'idle').length, color: VEHICLE_COLORS[2] }
                                        ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {[
                                                { name: 'Moving', value: fleet.filter(v => v.status === 'moving').length, color: VEHICLE_COLORS[0] },
                                                { name: 'Idle', value: fleet.filter(v => v.status === 'idle').length, color: VEHICLE_COLORS[1] },
                                                { name: 'Offline/Stop', value: fleet.filter(v => v.status !== 'moving' && v.status !== 'idle').length, color: VEHICLE_COLORS[2] }
                                            ].filter(d => d.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-3xl font-black">{fleet.length}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><div className="text-emerald-500 font-bold text-sm">{fleet.filter(v => v.status === 'moving').length}</div><div className="text-[9px] font-bold text-emerald-600 uppercase">Moving</div></div>
                        <div className="text-center p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg"><div className="text-amber-500 font-bold text-sm">{fleet.filter(v => v.status === 'idle').length}</div><div className="text-[9px] font-bold text-amber-600 uppercase">Idle</div></div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"><div className="text-slate-500 font-bold text-sm">{fleet.filter(v => v.status !== 'moving' && v.status !== 'idle').length}</div><div className="text-[9px] font-bold text-slate-600 uppercase">Stopped</div></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                {/* Recent Alerts Feed */}
                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Bell className="text-amber-500" /> Recent Alerts</h3>
                        <button onClick={() => setActiveTab('alerts')} className="text-brand-500 text-sm font-bold hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {alerts.length === 0 && (
                            <div className="text-center text-slate-400 dark:text-slate-600 py-8 text-sm">No alerts — all systems nominal</div>
                        )}
                        {alerts.slice(0, 4).map((a, idx) => (
                            <div key={a.id || idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex gap-4 items-start transition-all hover:shadow-md">
                                <div className={`p-2 rounded-full mt-1 shrink-0 ${a.type === 'critical' ? 'bg-red-500/20 text-red-500' : a.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                    {a.type === 'critical' ? <AlertTriangle size={16} /> : a.type === 'warning' ? <Activity size={16} /> : <Box size={16} />}
                                </div>
                                <div>
                                    <div className="font-bold text-sm mb-1 text-slate-800 dark:text-slate-100">{a.message}</div>
                                    <div className="flex gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1"><Car size={10} /> {a.vehicle}</span>
                                        <span className="flex items-center gap-1"><Bell size={10} /> {a.time || a.timestamp}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fleet Health Quick View */}
                <div className="glass-panel p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><CheckCircle2 className="text-emerald-500" /> System Health Rules</h3>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="p-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500"><Shield size={18} /></div>
                                <div>
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Immobilizer Integrity</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">All Relays Online</div>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold">100%</div>
                        </div>
                        <div className="p-4 border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-500"><Database size={18} /></div>
                                <div>
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Data Connectivity</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Latency {wsLatency || 45}ms</div>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold">EXCELLENT</div>
                        </div>
                        <div className="p-4 border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-500"><Wrench size={18} /></div>
                                <div>
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Upcoming Maintenance</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">3 Vehicles Due</div>
                                </div>
                            </div>
                            <button onClick={() => setActiveTab('maintenance')} className="px-3 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-xs font-bold transition-colors">REVIEW</button>
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
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Live Clock</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{fleet.length} Vehicle{fleet.length !== 1 ? 's' : ''} Tracked</span>
                    </div>
                </div>
            </div>

            {/* TCP Socket / WebSocket Status Floating Widget */}
            <div className="absolute top-4 right-4 md:right-8 z-[1000] glass-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl flex gap-4 pointer-events-auto border items-center hover:border-brand-500 transition-all scale-90 origin-top-right"
                style={{ borderColor: wsStatus === 'connected' ? 'rgba(20,184,166,0.4)' : wsStatus === 'connecting' ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)' }}>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">WebSocket</span>
                    <span className={`font-bold text-sm flex items-center gap-2 ${wsStatus === 'connected' ? 'text-emerald-500' :
                        wsStatus === 'connecting' ? 'text-amber-500' : 'text-red-500'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                            wsStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                            }`} />
                        {wsStatus === 'connected' ? `LIVE${wsLatency ? ` (${wsLatency}ms)` : ''}` :
                            wsStatus === 'connecting' ? 'CONNECTING...' : 'RECONNECTING'}
                    </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
                    <Zap size={16} />
                </div>
            </div>

            {/* Map Layer Controls (Tile Switcher) */}
            <div className="absolute bottom-6 left-4 md:left-24 z-[1000] pointer-events-auto">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">Map Layer</div>
                    <div className="flex gap-0">
                        {[
                            { key: 'street', label: 'Street', bg: '#e8f0fe', icon: '🗺️' },
                            { key: 'satellite', label: 'Satellite', bg: '#1a2744', icon: '🛰️' },
                            { key: 'dark', label: 'Dark', bg: '#0f172a', icon: '🌙' },
                            { key: 'terrain', label: 'Terrain', bg: '#c7e5c7', icon: '⛰️' },
                        ].map(t => (
                            <button key={t.key} onClick={() => setTileMode && setTileMode(t.key)}
                                title={`${t.label} View`}
                                className={`flex flex-col items-center gap-1 px-3 py-2 transition-all ${mapTile === t.key ? 'bg-brand-500/15 border-t-2 border-brand-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-t-2 border-transparent'
                                    }`}>
                                <div className="w-8 h-6 rounded-md flex items-center justify-center text-base" style={{ background: t.bg }}>{t.icon}</div>
                                <span className={`text-[8px] font-bold uppercase tracking-wide ${mapTile === t.key ? 'text-brand-500' : 'text-slate-500'}`}>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Geographic Tool Kit Overlay */}
            <div className="absolute bottom-6 left-20 md:left-40 z-[1000] pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-700">
                    <button className="flex flex-col items-center justify-center text-slate-500 hover:text-brand-500 group">
                        <div className="p-2 rounded-lg group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 transition-colors"><Crosshair size={18} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Measure</span>
                    </button>
                    <button onClick={() => { setShowAlertRules(!showAlertRules); setShowZoneRules(false); }} className={`flex flex-col items-center justify-center transition-colors group ${showAlertRules ? 'text-blue-500' : 'text-slate-500 hover:text-blue-500'}`}>
                        <div className={`p-2 rounded-lg transition-colors ${showAlertRules ? 'bg-blue-50 dark:bg-blue-500/10' : 'group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10'}`}><Bell size={18} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Alerts</span>
                    </button>
                    <button onClick={() => { setShowZoneRules(!showZoneRules); setShowAlertRules(false); }} className={`flex flex-col items-center justify-center transition-colors group ${showZoneRules ? 'text-emerald-500' : 'text-slate-500 hover:text-emerald-500'}`}>
                        <div className={`p-2 rounded-lg transition-colors ${showZoneRules ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10'}`}><Hexagon size={18} /></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Zones</span>
                    </button>
                </div>
                <div className="flex flex-col min-w-[120px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Tool</span>
                    <span className="text-sm font-bold text-brand-500">{showAlertRules ? 'Alert Config' : showZoneRules ? 'Zone Editor' : 'Distance Measure'}</span>
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mt-0.5">Ready</span>
                </div>
            </div>

            {/* Floating Overlays for Zones and Alerts directly on Map */}
            <AnimatePresence>
                {showZoneRules && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-6 md:right-[340px] top-24 bottom-6 w-80 lg:w-[380px] z-[1500] glass-panel p-0 flex flex-col overflow-hidden pointer-events-auto border border-slate-200 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 font-bold flex justify-between items-center text-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="flex items-center gap-2"><Hexagon className="text-emerald-500" size={20} /> Zone Rules</span>
                            <button onClick={() => setShowZoneRules(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex gap-2">
                            <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20">
                                + Draw Polygon Zone
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                            <div>
                                <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-3 ml-1">Active Geofences</h4>
                                <div className="space-y-3">
                                    <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-800/60 shadow-sm cursor-pointer hover:border-emerald-500 transition-all hover:shadow-md">
                                        <div className="font-bold mb-2 flex justify-between items-center text-slate-800 dark:text-slate-100">
                                            Main Warehouse
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md tracking-wider">ACTIVE</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                            <span className="block mb-1 text-slate-700 dark:text-slate-300"><strong className="text-emerald-500">Alerts:</strong> Entry & Exit Notifications</span>
                                            <span className="block"><strong className="text-slate-600 dark:text-slate-400">Applies to:</strong> All Vehicles</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {showAlertRules && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-6 md:right-[340px] top-24 bottom-6 w-80 lg:w-[380px] z-[1500] glass-panel p-0 flex flex-col overflow-hidden pointer-events-auto border border-slate-200 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 font-bold flex justify-between items-center text-lg bg-slate-50/50 dark:bg-slate-800/50">
                            <span className="flex items-center gap-2"><Bell className="text-blue-500" size={20} /> Map Alert Config</span>
                            <button onClick={() => setShowAlertRules(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-3 ml-1 mt-2">Active Event Rules</h4>
                            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-slate-800/60 shadow-sm cursor-pointer hover:border-blue-500 transition-all">
                                <div className="font-bold mb-2 flex justify-between items-center text-slate-800 dark:text-slate-100">
                                    Ignition Tamper Alarm
                                    <span className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md tracking-wider">CRITICAL</span>
                                </div>
                                <div className="text-xs text-slate-500 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    Triggers when ignition is hotwired or disconnected.
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-slate-800/60 shadow-sm cursor-pointer hover:border-blue-500 transition-all">
                                <div className="font-bold mb-2 flex justify-between items-center text-slate-800 dark:text-slate-100">
                                    Overspeed Notification (&gt;80kph)
                                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md tracking-wider">WARN</span>
                                </div>
                                <div className="text-xs text-slate-500 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    Beeps client portal when threshold exceeded.
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Today's Statistics (Left Panel) */}
            <AnimatePresence>
                {leftPanelVisible && (
                    <motion.div
                        initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}
                        className="absolute top-20 left-4 md:left-24 z-[1000] glass-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl pointer-events-auto border border-brand-500/20 max-w-[280px]"
                    >
                        <button onClick={() => setLeftPanelVisible(false)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <X size={14} />
                        </button>
                        <div className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2 text-sm pr-6">
                            <Activity className="text-brand-500" size={16} /> Today's Statistics
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Active</div>
                                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">8 / 12</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-500/10 p-2.5 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Revenue</div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white mt-2">₹142,500 <span className="text-sm text-slate-500 font-medium">/ month</span></div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-100 dark:border-amber-500/20 col-span-2 flex justify-between items-center">
                                <div>
                                    <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Alerts Tripped</div>
                                    <div className="text-base font-black text-amber-700 dark:text-amber-300">3 Warnings</div>
                                </div>
                                <button className="text-[9px] font-bold bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-lg">View All</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!leftPanelVisible && (
                <button
                    onClick={() => setLeftPanelVisible(true)}
                    className="absolute top-20 left-4 md:left-24 z-[1000] p-2 glass-panel bg-white/95 dark:bg-slate-900/95 text-brand-500 rounded-full shadow-lg pointer-events-auto hover:bg-brand-50 dark:hover:bg-brand-500/20 transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            {/* Floating Live Fleet Drawer (Right Side) */}
            <AnimatePresence>
                {rightPanelVisible && (
                    <motion.div
                        initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
                        className="absolute right-4 md:right-8 top-20 bottom-6 w-64 glass-panel p-0 flex flex-col overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl pointer-events-auto"
                    >
                        <div className="p-3 border-b border-slate-200 dark:border-slate-800/50 font-bold flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2">Live Tracking</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-500 uppercase tracking-widest shadow-inner">Client View</span>
                                <button onClick={() => setRightPanelVisible(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 relative custom-scrollbar">
                            {fleet.length === 0 && (
                                <div className="text-center text-slate-400 py-10 text-xs">No devices online.<br />Waiting for GPS data...</div>
                            )}
                            {fleet.map(v => (
                                <div key={v.id} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm hover:shadow-md group relative overflow-hidden backdrop-blur-md">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${v.status === 'moving' ? 'bg-emerald-500' : v.status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                                    <div className="flex justify-between items-start mb-1.5 ml-1">
                                        <div className="font-bold flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-100 flex-wrap">
                                            {v.name}
                                            {v.status === 'moving' && <span className="animate-pulse w-1 h-1 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                                        </div>
                                        <span className={`text-[9px] px-1 py-0.5 rounded-md font-mono font-bold shadow-sm ${v.status === 'moving' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{v.speed || 0} km/h</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 ml-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded border border-slate-100 dark:border-slate-800/50">
                                        <span className="flex items-center gap-1"><Battery size={10} className={v.fuel && v.fuel < 20 ? 'text-red-500' : 'text-blue-500'} /> {v.fuel ? `${v.fuel}L` : 'N/A'}</span>
                                        <span className="flex items-center gap-1"><Thermometer size={10} className={v.temp ? 'text-rose-500' : 'text-slate-400'} /> {v.temp ? `${v.temp}°C` : 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!rightPanelVisible && (
                <button
                    onClick={() => setRightPanelVisible(true)}
                    className="absolute top-20 right-4 md:right-8 z-[1000] p-2 glass-panel bg-white/95 dark:bg-slate-900/95 text-brand-500 rounded-full shadow-lg pointer-events-auto hover:bg-brand-50 dark:hover:bg-brand-500/20 transition-colors"
                >
                    <ChevronRight size={20} className="rotate-180" />
                </button>
            )}

            {/* === VEHICLE PLAYBACK SLIDE-UP PANEL === */}
            <AnimatePresence>
                {playback && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute bottom-0 left-0 right-0 z-[2000] pointer-events-auto"
                    >
                        <div className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border-t-2 border-brand-500 shadow-[0_-20px_60px_rgba(0,0,0,0.3)] p-4">
                            {/* Panel Header */}
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">📹</span>
                                    <div>
                                        <div className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">Route Playback</div>
                                        <div className="text-xs text-brand-500 font-bold">{playback.vehicle?.name || 'Vehicle'}</div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        {[['🔵', '< 30 km/h'], ['🟡', '30-60 km/h'], ['🔴', '> 60 km/h'], ['⚪', 'Ignition OFF']].map(([c, l]) => (
                                            <span key={l} className="text-[9px] font-bold text-slate-500 flex items-center gap-1">{c} {l}</span>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => { playbackPause(); setPlayback(null); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* LEFT: Date/Time Picker + Fetch */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">📅 Select Date &amp; Time Range</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <div className="text-[8px] font-bold text-slate-400 mb-0.5">DATE</div>
                                            <input type="date" value={playback.date || new Date().toISOString().slice(0, 10)}
                                                onChange={e => setPlayback(p => ({ ...p, date: e.target.value }))}
                                                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-bold text-slate-400 mb-0.5">FROM TIME</div>
                                            <input type="time" value={playback.time || '06:00'}
                                                onChange={e => setPlayback(p => ({ ...p, time: e.target.value }))}
                                                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-bold text-slate-400 mb-0.5">TO TIME</div>
                                            <input type="time" value={playback.timeTo || '23:59'}
                                                onChange={e => setPlayback(p => ({ ...p, timeTo: e.target.value }))}
                                                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-bold text-slate-400 mb-0.5">SPEED</div>
                                            <select value={playback.speed || 1}
                                                onChange={e => setPlayback(p => ({ ...p, speed: parseFloat(e.target.value) }))}
                                                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none">
                                                {[0.5, 1, 2, 5, 10].map(s => <option key={s} value={s}>{s}×</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={async () => {
                                        const pts = await playbackFetch(playback.vehicle, playback.date, playback.time, playback.timeTo);
                                        playbackPause();
                                        setPlayback(p => ({ ...p, points: pts, currentIdx: 0, isPlaying: false }));
                                    }} className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2">
                                        🔍 Fetch History
                                    </button>
                                </div>

                                {/* CENTER: Playback Controls + Scrubber */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-center gap-2">
                                        {/* Rewind */}
                                        <button onClick={() => { playbackPause(); setPlayback(p => ({ ...p, currentIdx: 0 })); }}
                                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all font-black text-xs" title="Rewind">⏮</button>
                                        {/* -10 */}
                                        <button onClick={() => setPlayback(p => ({ ...p, currentIdx: Math.max(0, p.currentIdx - 10) }))}
                                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all font-black text-xs" title="Back 10">◄◄</button>
                                        {/* Play / Pause */}
                                        {playback.isPlaying ? (
                                            <button onClick={playbackPause} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-lg shadow-amber-500/30 transition-all">⏸ PAUSE</button>
                                        ) : (
                                            <button onClick={playbackPlay} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-500/30 transition-all">▶ PLAY</button>
                                        )}
                                        {/* +10 */}
                                        <button onClick={() => setPlayback(p => ({ ...p, currentIdx: Math.min((p.points?.length || 1) - 1, p.currentIdx + 10) }))}
                                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all font-black text-xs" title="Forward 10">►►</button>
                                        {/* Jump to end */}
                                        <button onClick={() => { playbackPause(); setPlayback(p => ({ ...p, currentIdx: (p.points?.length || 1) - 1 })); }}
                                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all font-black text-xs" title="Jump to End">⏭</button>
                                    </div>

                                    {/* Scrub Slider */}
                                    <div className="space-y-1">
                                        <input type="range" min={0} max={(playback.points?.length || 1) - 1} value={playback.currentIdx}
                                            onChange={e => { playbackPause(); setPlayback(p => ({ ...p, currentIdx: parseInt(e.target.value) })); }}
                                            className="w-full h-2 rounded-full outline-none cursor-pointer" style={{ accentColor: '#14b8a6' }} />
                                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                            <span>{playback.points?.[0]?.time ? new Date(playback.points[0].time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                            <span className="text-brand-500 font-black">
                                                {playback.points?.[playback.currentIdx]?.time ? new Date(playback.points[playback.currentIdx].time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--'}
                                            </span>
                                            <span>{playback.points?.[playback.points.length - 1]?.time ? new Date(playback.points[playback.points.length - 1].time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                        </div>
                                    </div>
                                    <div className="text-center text-[9px] text-slate-400 font-medium">
                                        Point {playback.currentIdx + 1} / {playback.points?.length || 0}
                                    </div>
                                </div>

                                {/* RIGHT: Current Point Info */}
                                {playback.points?.[playback.currentIdx] && (() => {
                                    const pt = playback.points[playback.currentIdx];
                                    return (
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">📌 Exact Location at this Point</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-200 dark:border-slate-700">
                                                    <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Speed</div>
                                                    <div className="text-lg font-black" style={{ color: pt.speed < 30 ? '#3b82f6' : pt.speed < 60 ? '#f59e0b' : '#ef4444' }}>{pt.speed || 0}</div>
                                                    <div className="text-[7px] text-slate-400">km/h</div>
                                                </div>
                                                <div className={`rounded-xl p-2 border ${pt.ignition !== false ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30' : 'bg-red-50 border-red-200 dark:bg-red-900/30'}`}>
                                                    <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Ignition</div>
                                                    <div className="text-sm font-black" style={{ color: pt.ignition !== false ? '#10b981' : '#ef4444' }}>{pt.ignition !== false ? '🟢 ON' : '🔴 OFF'}</div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-200 dark:border-slate-700 col-span-2">
                                                    <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Coordinates</div>
                                                    <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                                                        {pt.lat?.toFixed(6)}°N, {pt.lng?.toFixed(6)}°E
                                                    </div>
                                                    <div className="text-[8px] text-slate-500 mt-0.5">Heading: {pt.heading || 0}°</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderDrivers = () => (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top KPI row for Drivers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Total Drivers <Users size={14} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">{drivers.length} <span className="text-sm font-bold text-slate-500">Registered</span></div>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">{drivers.filter(d => d.status === 'Active').length} Currently Active (On Duty)</div>
                </div>

                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Avg Eco-Score <Shield size={14} className="text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">{Math.round(drivers.reduce((acc, d) => acc + d.ecoScore, 0) / drivers.length)}<span className="text-lg text-slate-500">/100</span></div>
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-500">Fleet insurance premium optimized!</div>
                </div>

                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Est. Monthly Payout <CreditCard size={14} className="text-amber-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">₹{drivers.reduce((acc, d) => acc + (d.hoursWorked * d.costPerHour), 0).toLocaleString('en-IN')}</div>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-500">Calculated actively from run hours.</div>
                </div>
            </div>

            {/* Driver Management Table */}
            <div className="glass-panel overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <UserCircle className="text-brand-500" /> Complete Driver Roster
                    </h3>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold shadow-sm hover:border-brand-500 transition-colors">
                            Set Default Rates
                        </button>
                        <button className="px-4 py-2 text-sm font-bold bg-brand-500 text-white rounded-lg shadow-md hover:bg-brand-600 transition-colors flex items-center gap-2">
                            + Add Driver
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 font-black">Driver Info</th>
                                <th className="p-4 font-black">Current Vehicle</th>
                                <th className="p-4 font-black">Performance</th>
                                <th className="p-4 font-black">Pay Rates</th>
                                <th className="p-4 font-black">Period Hours</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {drivers.map(drv => (
                                <tr key={drv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            {drv.name}
                                            {drv.status === 'Active' ? <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active"></span> : <span className="w-2 h-2 rounded-full bg-slate-400" title="On Leave"></span>}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{drv.id} &bull; {drv.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="relative group">
                                            <select
                                                className="w-full bg-transparent border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 rounded-lg -ml-2 px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                                defaultValue={drv.assignedVehicle}
                                            >
                                                <option value="Unassigned">-- Unassigned --</option>
                                                {fleet.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                                {/* Fallback to show current if it's not in live fleet mock */}
                                                {!fleet.find(v => v.name === drv.assignedVehicle) && drv.assignedVehicle !== 'Unassigned' && (
                                                    <option value={drv.assignedVehicle}>{drv.assignedVehicle}</option>
                                                )}
                                            </select>
                                            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">
                                                <TrendingDown size={14} className="rotate-180" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`text-sm font-black ${drv.ecoScore > 90 ? 'text-emerald-500' : drv.ecoScore > 75 ? 'text-amber-500' : 'text-red-500'}`}>
                                                {drv.ecoScore}
                                            </div>
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${drv.ecoScore > 90 ? 'bg-emerald-500' : drv.ecoScore > 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${drv.ecoScore}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">₹{drv.costPerHour}/hr</div>
                                        <div className="text-[10px] text-slate-500">₹{drv.costPerKm}/km</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{drv.hoursWorked}h</div>
                                        <div className="text-[10px] text-brand-500 font-bold">₹{(drv.hoursWorked * drv.costPerHour).toLocaleString('en-IN')} pending</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-xs font-bold text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors mr-2">Edit</button>
                                        <button className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">Del</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );

    const renderMaintenance = () => (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top KPI row for Maintenance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group border-l-4 border-l-red-500">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Critical Action Needed <AlertTriangle size={14} className="text-red-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">{maintenanceList.filter(m => m.status === 'Critical').length} <span className="text-sm font-bold text-slate-500">Tasks</span></div>
                    <div className="flex items-center gap-1 text-xs font-bold text-red-500">Schedule immediate service!</div>
                </div>

                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group border-l-4 border-l-amber-500">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Upcoming Tasks <Wrench size={14} className="text-amber-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">{maintenanceList.filter(m => m.status === 'Warning').length} <span className="text-sm font-bold text-slate-500">Tasks</span></div>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">Plan downtime within 1-2 weeks.</div>
                </div>

                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group border-l-4 border-l-emerald-500">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center justify-between">
                        Systems Optimal <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">{maintenanceList.filter(m => m.status === 'Good').length} <span className="text-sm font-bold text-slate-500">Parts</span></div>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">Operating within safe limits.</div>
                </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl glass-panel">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Wrench className="text-brand-500" /> Component Lifespans
                </h3>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold shadow-sm hover:border-brand-500 transition-colors">
                        Add New Part Type
                    </button>
                </div>
            </div>

            {/* Vehicle Grid for Maintenance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from(new Set(maintenanceList.map(m => m.vehicle))).map(vehicleName => (
                    <div key={vehicleName} className="glass-panel overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                            <h4 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <Car className="text-slate-400" /> {vehicleName}
                            </h4>
                            <button className="text-xs font-bold text-brand-500 hover:underline">+ Assign Part Config</button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50 p-4">
                            {maintenanceList.filter(m => m.vehicle === vehicleName).map(item => {
                                const percentage = Math.min(100, (item.currentKm / item.limitKm) * 100);
                                const isCritical = percentage > 90;
                                const isWarning = percentage > 75 && !isCritical;
                                const colorClass = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
                                const textClass = isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500';

                                return (
                                    <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${isCritical ? 'bg-red-50 text-red-500' : isWarning ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                    <Settings size={14} />
                                                </div>
                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.part}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-sm font-black ${textClass}`}>
                                                    {item.currentKm.toLocaleString()} <span className="text-[10px] text-slate-400">/ {item.limitKm.toLocaleString()} km</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-1 h-2 bg-slate-100 dark:bg-slate-800 justify-start rounded-full overflow-hidden">
                                                <div className={`absolute top-0 left-0 h-full ${colorClass} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setMaintenanceList(prev => prev.map(m => m.id === item.id ? { ...m, currentKm: 0, status: 'Good', lastReplacedDate: new Date().toISOString().split('T')[0] } : m));
                                                    setToastMsg(`${item.part} for ${item.vehicle} marked as replaced!`);
                                                }}
                                                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex-shrink-0"
                                            >
                                                Mark Replaced
                                            </button>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 ml-8">
                                            Last replaced: {item.lastReplacedDate}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBilling = () => {
        const totalVehicles = fleet.length || 1;
        const subtotal = totalVehicles * basePlanCost * rechargeMonths;
        const discount = referralCount * 300;
        const finalTotal = Math.max(0, subtotal - discount);
        const gst = finalTotal * 0.18;
        const grandTotal = finalTotal + gst;

        return (
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Active Plan Overview */}
                <div className="flex bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                    <div className="flex-1 p-8 flex flex-col justify-center border-r border-slate-700/50">
                        <h2 className="text-3xl font-black mb-1">Professional Plan</h2>
                        <div className="flex items-center gap-2 text-brand-400 font-bold tracking-widest uppercase text-xs">
                            <CheckCircle2 size={14} /> Active Subscription
                        </div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col items-center justify-center border-r border-slate-700/50">
                        <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Tracked Assets</div>
                        <div className="text-4xl font-black">{totalVehicles} <Car className="inline text-slate-500 mb-2" size={24} /></div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col items-center justify-center">
                        <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Next Renewal Date</div>
                        <div className="text-xl font-bold text-emerald-400">Oct 15, 2026</div>
                        <div className="text-xs text-slate-500 mt-1">14 days remaining</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recharge Calculator */}
                    <div className="glass-panel p-8 flex flex-col border-t-4 border-t-brand-500">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-100"><Zap className="text-brand-500" /> Subscription Recharge</h3>

                        <div className="space-y-8 flex-1">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Recharge Duration</label>
                                    <span className="font-black text-brand-500">{rechargeMonths} Month{rechargeMonths > 1 ? 's' : ''}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="12" step="1"
                                    value={rechargeMonths}
                                    onChange={e => setRechargeMonths(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                />
                                <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                                    <span>1 Mo</span>
                                    <span>6 Mo (5% Off)</span>
                                    <span>12 Mo (15% Off)</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 cursor-default">Invoice Estimate</h4>
                                <div className="space-y-2 text-sm font-medium border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
                                    <div className="flex justify-between"><span className="text-slate-500">{totalVehicles} Vehicles × {rechargeMonths} Months</span> <span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between"><span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Referral Credits Applied</span> <span className="text-emerald-500">-(₹{Math.min(subtotal, discount).toLocaleString('en-IN')})</span></div>
                                </div>
                                <div className="space-y-2 text-sm font-medium border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
                                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span> <span>₹{finalTotal.toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span> <span>₹{gst.toLocaleString('en-IN')}</span></div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">Total Payable</span>
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">₹{grandTotal.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-4 rounded-xl font-bold tracking-wide text-white bg-slate-900 hover:bg-black dark:bg-brand-500 dark:hover:bg-brand-600 shadow-xl transition-all flex items-center justify-center gap-2">
                            <CreditCard size={18} /> Proceed to Secure Checkout
                        </button>
                    </div>

                    {/* Referral System */}
                    <div className="glass-panel p-8 flex flex-col border-t-4 border-t-blue-500">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-100"><Share2 className="text-blue-500" /> Share & Earn Free Months</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Give your network ₹300 off their first month's invoice, and get ₹300 credited to your account for every successful signup! Credits automatically apply to your next renewal.
                        </p>

                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-6 text-center mb-6">
                            <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">Your Unique Referral Code</div>
                            <div className="flex justify-center items-center gap-4">
                                <div className="text-4xl font-black tracking-[0.2em] text-blue-600 dark:text-blue-400 font-mono">{referralCode}</div>
                                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md transition-colors uppercase tracking-widest">Copy</button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Your Successful Referrals</h4>
                                <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">{referralCount} Credits Earned (₹600)</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">RJ</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Rajesh Logistics</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Joined: Aug 12, 2026</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-emerald-500">+ ₹300</div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">SA</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">SA Transport Co</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Joined: Sep 05, 2026</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-emerald-500">+ ₹300</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFuel = () => (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top KPI row for Fuel */}
            <div className="flex bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl">
                <div className="flex-1 p-6 border-r border-slate-700/50 flex flex-col justify-center">
                    <h3 className="text-brand-400 font-bold mb-1 flex items-center gap-2"><Droplet size={18} /> Live India Fuel Rates</h3>
                    <p className="text-xs text-slate-400">Updated daily. Used for automated expense calculation.</p>
                </div>
                <div className="flex-1 p-6 bg-slate-800/50 text-center border-r border-slate-700/50">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Diesel</div>
                    <div className="text-3xl font-black text-emerald-400">₹{fuelRates.diesel.toFixed(1)}</div>
                </div>
                <div className="flex-1 p-6 bg-slate-800/50 text-center border-r border-slate-700/50">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Petrol</div>
                    <div className="text-3xl font-black text-blue-400">₹{fuelRates.petrol.toFixed(1)}</div>
                </div>
                <div className="flex-1 p-6 bg-slate-800/50 text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">CNG</div>
                    <div className="text-3xl font-black text-amber-400">₹{fuelRates.cng.toFixed(1)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Vehicles WITH Fuel Sensors */}
                <div className="glass-panel p-6 flex flex-col border-t-4 border-t-emerald-500">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><Activity className="text-emerald-500" /> Active Fuel Sensors</h3>
                            <p className="text-xs text-slate-500 mt-1">Real-time hardware telemetry</p>
                        </div>
                        <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer">
                            <option>Heavy Truck B</option>
                        </select>
                    </div>

                    <div className="flex-1 min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={FUEL_CHART_DATA}>
                                <defs>
                                    <linearGradient id="colorFuel2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Area type="stepAfter" dataKey="fuel" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFuel2)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <div className="text-xs font-bold text-red-700 dark:text-red-400">
                            Auto-Theft Detection Active. Sudden drops &gt;5L/min will trigger critical alarms and immobilize the vehicle if parked.
                        </div>
                    </div>
                </div>

                {/* Vehicles WITHOUT Fuel Sensors (Manual Logs) */}
                <div className="glass-panel p-6 flex flex-col border-t-4 border-t-amber-500">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><CheckSquare className="text-amber-500" /> Manual Refill Logs</h3>
                            <p className="text-xs text-slate-500 mt-1">For vehicles without hardware sensors</p>
                        </div>
                        <button onClick={() => setShowRefuelModal(true)} className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md transition-colors flex items-center gap-2">
                            + Log Refill
                        </button>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                    <th className="p-3 font-black">Date & Vehicle</th>
                                    <th className="p-3 font-black">Quantity</th>
                                    <th className="p-3 font-black text-right">Total Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {fuelLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-3">
                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{log.vehicle}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.date}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{log.liters} L</div>
                                            <div className="text-[10px] text-slate-500">@{log.rate}/L ({log.type})</div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="font-black text-brand-500">₹{log.total.toLocaleString('en-IN')}</div>
                                            <button className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest mt-1">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Manual Refuel Modal Overlay */}
            <AnimatePresence>
                {showRefuelModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowRefuelModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700"
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <Droplet className="text-brand-500" /> Add Fuel Entry
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Vehicle</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500">
                                        {fleet.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Liters Filled</label>
                                        <input type="number" placeholder="0.0" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Total Bill (₹)</label>
                                        <input type="number" placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                                    <input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowRefuelModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={() => { setShowRefuelModal(false); setToastMsg('Fuel log saved successfully.'); }} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-brand-500 hover:bg-brand-600 shadow-md transition-all">
                                        Save Log
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );



    const [alertFilter, setAlertFilter] = React.useState('all');

    const renderAlerts = () => {
        const filtered = alertFilter === 'all' ? alerts
            : alerts.filter(a => (a.severity || 'info') === alertFilter);
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="glass-panel p-6">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="text-brand-500" /> Alerts &amp; Notifications
                            {alerts.length > 0 && <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">{alerts.length}</span>}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setAlerts([])} className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">🗑 Clear All</button>
                            <button onClick={() => { const types = Object.keys(ALERT_TYPES); const t = types[Math.floor(Math.random() * types.length)]; fireToast(t, fleet[0]?.name || 'Demo Vehicle', 'Manual test'); }} className="btn-primary text-sm px-4 py-2">🔔 Test Alert</button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-5 flex-wrap">
                        {[['all', 'All', '#64748b'], ['critical', '🚨 Critical', '#ef4444'], ['warning', '⚠️ Warning', '#f59e0b'], ['info', 'ℹ️ Info', '#3b82f6']].map(([key, label, col]) => (
                            <button key={key} onClick={() => setAlertFilter(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all ${alertFilter === key ? 'text-white shadow-md' : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-current'}`}
                                style={alertFilter === key ? { background: col, borderColor: col } : { borderColor: 'transparent' }}>
                                {label} {key !== 'all' && <span className="ml-1 opacity-80">({alerts.filter(a => (a.severity || 'info') === key).length})</span>}
                            </button>
                        ))}
                    </div>

                    {/* Alert List */}
                    <div className="space-y-2.5">
                        {filtered.length === 0 && (
                            <div className="text-center py-14">
                                <div style={{ fontSize: 48 }} className="mb-3">🔕</div>
                                <p className="font-bold text-slate-500">No {alertFilter !== 'all' ? alertFilter : ''} alerts</p>
                                <p className="text-xs text-slate-400 mt-1">Demo alerts will appear automatically — or click "Test Alert"</p>
                            </div>
                        )}
                        <AnimatePresence mode="popLayout">
                            {filtered.slice(0, 50).map((a, idx) => {
                                const def = ALERT_TYPES[a.type] || { label: a.type || 'Alert', icon: '🔔', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', severity: 'info' };
                                return (
                                    <motion.div key={a.id || idx}
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                                        className="flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm"
                                        style={{ background: def.bg, borderColor: def.border, borderLeft: `4px solid ${def.color}` }}>
                                        {/* Icon */}
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: def.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                            {def.icon}
                                        </div>
                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-black text-sm" style={{ color: def.color }}>{def.label}</span>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${def.severity === 'critical' ? 'bg-red-100 text-red-600' : def.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'}`}>{def.severity}</span>
                                            </div>
                                            <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2">
                                                🚗 {a.vehicleName || a.vehicle || 'Unknown'}
                                                {a.extra && <span className="text-slate-500">— {a.extra}</span>}
                                            </div>
                                        </div>
                                        {/* Time & Actions */}
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className="text-[9px] font-bold text-slate-400 font-mono">{a.time || '--:--'}</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => setAlerts(p => p.filter((x, i) => i !== idx))}
                                                    className="text-[9px] px-2 py-1 rounded-lg font-bold border border-slate-200 hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-all">✓ ACK</button>
                                                <button onClick={() => { fireToast(a.type || 'IGNITION_ON', a.vehicleName || 'Vehicle', a.extra || ''); }}
                                                    className="text-[9px] px-2 py-1 rounded-lg font-bold border border-current text-brand-500 border-opacity-20 hover:bg-brand-50 transition-all">🔔</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Alert Rule Toggles */}
                <div className="glass-panel p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={18} className="text-brand-500" /> Alert Rule Configuration</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(ALERT_TYPES).map(([key, def]) => (
                            <div key={key} className="p-3 rounded-xl border flex items-center gap-3 transition-all hover:shadow-sm" style={{ borderColor: def.border, background: def.bg }}>
                                <span className="text-xl">{def.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: def.color }}>{def.label}</div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">{def.severity === 'critical' ? 'SMS + Push' : 'Push only'}</div>
                                </div>
                                <button onClick={() => fireToast(key, fleet[0]?.name || 'Demo', 'Test')} title="Test this alert"
                                    className="w-6 h-6 rounded-full text-xs flex items-center justify-center transition-all hover:scale-110" style={{ background: def.color, color: 'white' }}>▶</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };




    const renderTasks = () => (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><CheckSquare className="text-emerald-500" /> Dispatch & Jobs</h2>
                    <button className="btn-primary">+ Dispatch New Task</button>
                </div>

                <div className="space-y-4">
                    {[].length === 0 ? (
                        <div className="text-center py-8 text-slate-500 font-bold dark:text-slate-400">No active dispatch tasks</div>
                    ) : [].map((t, i) => (
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

    const renderReports = () => (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><FileText className="text-brand-500" /> Consolidated Reports & Alerts</h2>
                    <p className="text-slate-500 text-sm mt-1">Review historical events across all modules and export data.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary gap-2 text-sm px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" onClick={() => { setToastMsg('Downloading PDF Report...'); setTimeout(() => setToastMsg(''), 3000); }}>Export PDF <ArrowRight size={14} /></button>
                    <button className="btn-primary gap-2 text-sm px-4 py-2 shadow-md" onClick={() => { setToastMsg('Downloading CSV...'); setTimeout(() => setToastMsg(''), 3000); }}>Export CSV <ArrowRight size={14} /></button>
                </div>
            </div>

            <div className="glass-panel p-6 border-t-4 border-t-brand-500">
                <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Date Range</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200">
                            <option>Today</option>
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                            <option>Custom Range...</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Vehicle Filter</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200">
                            <option>All Vehicles</option>
                            {fleet.map(v => <option key={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Event Category</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200">
                            <option>All Categories</option>
                            <option>GPS & Movement</option>
                            <option>Driver Behavior (Eco)</option>
                            <option>Fuel Drops & Theft</option>
                            <option>Maintenance & Engine</option>
                            <option>Geofence Logs</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 rounded-tl-xl w-48">Timestamp</th>
                                <th className="p-4 w-40">Asset</th>
                                <th className="p-4 w-32">Module</th>
                                <th className="p-4">Event Details</th>
                                <th className="p-4 rounded-tr-xl text-right w-24">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                            {/* Empty Data Placeholder */}
                            {[].length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 font-bold">No historical reports generated</td>
                                </tr>
                            ) : [].map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-slate-500 font-medium text-xs">{row.time}</td>
                                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200 text-xs">{row.asset}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 bg-${row.modColor}-100 text-${row.modColor}-700 dark:bg-${row.modColor}-500/20 dark:text-${row.modColor}-400 rounded-md text-[10px] font-bold uppercase tracking-widest`}>{row.mod}</span>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{row.desc}</td>
                                    <td className="p-4 text-right">
                                        <span className={`px-2.5 py-1 bg-${row.sevColor}-100 text-${row.sevColor}-700 dark:bg-${row.sevColor}-500/20 dark:text-${row.sevColor}-400 rounded-full text-[10px] font-black uppercase tracking-widest`}>{row.sev}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* === TOAST NOTIFICATION STACK (top-right, Trackzee-style) === */}
            <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <motion.div key={t.id}
                            initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ background: 'rgba(255,255,255,0.98)', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', borderLeft: `4px solid ${t.color}`, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, backdropFilter: 'blur(16px)', minWidth: 280, cursor: 'pointer' }}
                            onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
                        >
                            {/* Icon Circle */}
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: `2px solid ${t.color}30` }}>
                                {t.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                    <span style={{ fontWeight: 900, fontSize: 11, color: t.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.label}</span>
                                    <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{t.time}</span>
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🚗 {t.vehicleName}</div>
                                {t.extra && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{t.extra}</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                    <div style={{ flex: 1, height: 3, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                        <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 6, ease: 'linear' }} style={{ height: '100%', background: t.color, borderRadius: 2 }} />
                                    </div>
                                    <span style={{ fontSize: 8, color: '#94a3b8' }}>tap to dismiss</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* OTP Confirmation Modal Overlay */}
            <AnimatePresence>
                {otpDialog && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setOtpDialog(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 dark:border-slate-700"
                        >
                            <div className="text-center mb-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${otpDialog.command === 'CUT_ENGINE' ? 'bg-red-100' : 'bg-emerald-100'
                                    }`}>
                                    <PowerOff size={28} className={otpDialog.command === 'CUT_ENGINE' ? 'text-red-500' : 'text-emerald-500'} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                                    {otpDialog.command === 'CUT_ENGINE' ? '⚠️ Cut Engine Confirmation' : '✅ Restore Engine Confirmation'}
                                </h3>
                                <p className="text-sm text-slate-500">Vehicle: <strong className="text-slate-800 dark:text-slate-200">{otpDialog.vehicle.name}</strong></p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-4 text-center border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 mb-2 font-medium">Enter this confirmation code to proceed:</p>
                                <p className="text-3xl font-black tracking-[0.3em] text-slate-900 dark:text-white font-mono">{otpGenerated}</p>
                                <p className="text-xs text-slate-400 mt-2">This code expires in 60 seconds</p>
                            </div>

                            <input
                                type="text"
                                value={otpInput}
                                onChange={e => { setOtpInput(e.target.value); setOtpError(''); }}
                                placeholder="Type the code above..."
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center font-mono text-xl font-bold outline-none focus:ring-2 focus:ring-brand-500 mb-2"
                            />
                            {otpError && <p className="text-red-500 text-xs text-center mb-3 font-medium">{otpError}</p>}

                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setOtpDialog(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmOtp}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all ${otpDialog.command === 'CUT_ENGINE'
                                        ? 'bg-red-500 hover:bg-red-600 shadow-[0_4px_15px_rgba(239,68,68,0.4)]'
                                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_15px_rgba(16,185,129,0.4)]'
                                        }`}
                                >
                                    {otpDialog.command === 'CUT_ENGINE' ? 'Confirm Cut Engine' : 'Confirm Restore'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DashboardLayout role="CLIENT" activeTab={activeTab} setActiveTab={setActiveTab} topBar={<TopKPIBanner />} fleet={fleet} openOtpDialog={openOtpDialog} wsStatus={wsStatus} wsLatency={wsLatency} mapTile={mapTile} setTileMode={setMapTile} playback={playback} openPlayback={openPlayback}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'map' && renderMap()}
                {/* Geofence and Alerts tools are now unified into the Map view, but we keep rendering map to avoid crash if state lags */}
                {activeTab === 'alerts' && renderMap()}
                {activeTab === 'geofence' && renderMap()}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'fuel' && renderFuel()}
                {activeTab === 'drivers' && renderDrivers()}
                {activeTab === 'maintenance' && renderMaintenance()}
                {activeTab === 'billing' && renderBilling()}
            </DashboardLayout>
        </>
    );
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('admin_control');
    const [inventoryList, setInventoryList] = useState([]);
    const [newImei, setNewImei] = useState('');
    const [newSim, setNewSim] = useState('');
    const [assignee, setAssignee] = useState('Whitelist Only (Unassigned)');
    const [toastMsg, setToastMsg] = useState('');

    const handleAddDevice = async () => {
        if (newImei.length < 15) {
            setToastMsg('Error: IMEI must be 15 digits.');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }
        const status = assignee.includes('Unassigned') ? 'Unassigned' : 'Assigned';

        try {
            const req = await fetch(`${API_BASE}/api/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imei: newImei, sim: newSim || 'N/A', status })
            });
            const data = await req.json();

            if (data.status === 'SUCCESS') {
                setInventoryList([{ imei: newImei, sim: newSim || 'N/A', status }, ...inventoryList]);
                setNewImei('');
                setNewSim('');
                setToastMsg('Device successfully added to DB Master Stock!');
                setTimeout(() => setToastMsg(''), 3000);
            } else {
                setToastMsg('API Error: Failed to add to DB.');
                setTimeout(() => setToastMsg(''), 3000);
            }
        } catch (err) {
            console.error('Add Device API Error (Fallback to Local Test Mode):', err);
            setInventoryList([{ imei: newImei, sim: newSim || 'N/A', status }, ...inventoryList]);
            setNewImei('');
            setNewSim('');
            setToastMsg('Local Test Mode: Device added to Master Stock UI!');
            setTimeout(() => setToastMsg(''), 3000);
        }
    };

    const handleActionToast = (action) => {
        setToastMsg(action);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const handleEngineBlock = async (clientName, isChecked) => {
        const commandType = isChecked ? 'CUT_ENGINE' : 'RESTORE_ENGINE';
        const actionText = isChecked ? 'Engaging Engine Cut-off' : 'Restoring Engine Ignition';

        // Optimistic UI Toast
        setToastMsg(`${actionText} for ${clientName}...`);

        try {
            const req = await fetch(`${API_BASE}/api/commands/sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: clientName, commandType })
            });
            const data = await req.json();

            if (data.status === 'SUCCESS') {
                setToastMsg(`SMS Command Sent to ${clientName}: ${data.command}`);
                setTimeout(() => setToastMsg(''), 4000);
            } else {
                setToastMsg(`Failed to send SMS to ${clientName}.`);
                setTimeout(() => setToastMsg(''), 3000);
            }
        } catch (err) {
            console.error('SMS Engine Block Error:', err);
            setToastMsg(`Local Test Mode: Simulating ${commandType} SMS to ${clientName}`);
            setTimeout(() => setToastMsg(''), 3000);
        }
    };

    const renderAdminControl = () => (
        <div className="space-y-6">
            <div className="mb-4">
                <p className="text-slate-500 text-lg">You are viewing the <strong className="text-brand-500">Super Admin Master Portal</strong>. From here you can control all features, fix system issues in one click, backup data easily, and access massive datatables of your fleet ecosystem.</p>
            </div>

            {/* System Health & 1-Click Fix & Daily Backup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-panel p-6 border-l-4 border-l-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/5 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-emerald-500/10"><CheckCircle2 size={120} /></div>
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Activity /> System Health & Auto Repairs</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm">Continuous monitoring of TCP engines, database queries, and redundant server nodes. Auto-detects memory leaks or disconnected queues.</p>

                    <div className="flex gap-4 items-center mb-6 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex-1">
                            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Current Issue Detected</div>
                            <div className="font-bold text-amber-500 flex items-center gap-1"><AlertTriangle size={14} /> Redis Queue Backlog (1,040 pkts)</div>
                        </div>
                        <button onClick={() => handleActionToast('System Repairs Executed Successfully')} className="bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white px-6 py-3 rounded-xl font-black text-sm transition-all transform hover:scale-105">
                            Fix All Issues (1-Click)
                        </button>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold font-mono text-slate-400">
                        <span>CPU Load: 14%</span> • <span>RAM: 8.2GB/32GB</span> • <span>Latency: 4ms</span>
                    </div>
                </div>

                <div className="glass-panel p-6 border-l-4 border-l-blue-500 bg-blue-50/10 dark:bg-blue-500/5 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-blue-500/10"><Database size={120} /></div>
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400"><Database /> Automated Multi-Node Backups</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm">Securely snapshot position data, user rules, and billing. Set an automated cloud export destination via Google Drive Path.</p>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Google Drive Backup Path</label>
                        <input type="text" defaultValue="gdrive://geosurepath-prod-backups" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 font-mono text-sm" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Status</div>
                            <div className="font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={14} /> Synced</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">Last Backup</div>
                            <div className="font-bold text-slate-700 dark:text-slate-300">Today, 02:00 AM</div>
                        </div>
                    </div>
                    <button className="w-full btn-primary bg-blue-600 hover:bg-blue-500 text-white font-black text-sm py-3 justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        Run Manual Backup (Cloud Push)
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
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-5">Client / Vehicle Entity</th>
                                <th className="px-6 py-5 text-center">Service (Start/Stop)</th>
                                <th className="px-6 py-5 font-bold text-brand-500 text-center">Live Map</th>
                                <th className="px-6 py-5 text-center">Geofence Mod.</th>
                                <th className="px-6 py-5 text-center">Alert Mod.</th>
                                <th className="px-6 py-5 text-center">Eco-Score Mod.</th>
                                <th className="px-6 py-5 text-center">Engine Block</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {[].length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-8 text-center text-slate-500 font-bold">No clients or vehicles registered</td>
                                </tr>
                            ) : [].map((row, i) => (
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
                                        <input
                                            type="checkbox"
                                            defaultChecked={row.block}
                                            onChange={(e) => handleEngineBlock(row.name, e.target.checked)}
                                            className="w-4 h-4 accent-red-500 cursor-pointer"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );



    const renderAdminOverview = () => (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="glass-panel p-6 border-l-[6px] border-indigo-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-500 dark:text-indigo-400"><LayoutDashboard /> Super Admin KPIs</h2>
                    <button className="btn-primary" onClick={() => handleActionToast('Exporting Platform Report...')}>Export Monthly Report</button>
                </div>
                <p className="text-slate-500 mb-8 max-w-2xl">High-level telemetry of platform adoption, recurring revenue, and subscription health across all global tenants.</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Platform MRR</div>
                        <div className="text-3xl font-black text-indigo-500">₹84,250.00</div>
                        <div className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><TrendingDown className="rotate-180" size={14} /> +18.2% vs last month</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Active Subscribers</div>
                        <div className="text-3xl font-black text-emerald-500">1,248</div>
                        <div className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><Users size={14} /> +142 New Registrations</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 shadow-sm border-l-4 border-l-amber-500">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Churn Rate</div>
                        <div className="text-3xl font-black text-amber-500">1.2%</div>
                        <div className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1"><TrendingDown size={14} /> Improved by 0.4%</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 shadow-sm">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Connected Devices</div>
                        <div className="text-3xl font-black text-blue-500 text-center">8,409 <MapIcon size={24} className="inline mb-1 opacity-20" /></div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white dark:bg-slate-900/40">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-5">Tenant / Client Name</th>
                                <th className="px-6 py-5">Total Fleet</th>
                                <th className="px-6 py-5">Subscription Status</th>
                                <th className="px-6 py-5 flex items-center justify-end">Monthly Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {[].length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-5 py-8 text-center text-slate-500 font-bold">No tenant billing data available</td>
                                </tr>
                            ) : [].map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Briefcase size={16} className="text-brand-500" /> {row.name}</td>
                                    <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">{row.fleet} <span className="font-normal text-xs text-slate-500">Asset(s)</span></td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${row.pastDue ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'}`}>{row.status}</span>
                                    </td>
                                    <td className="px-5 py-4 font-bold font-mono text-slate-800 dark:text-slate-100 text-right">{row.amount}</td>
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
            {toastMsg && (
                <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-center shadow-lg mb-4 animate-pulse">
                    {toastMsg}
                </div>
            )}
            <div className="glass-panel p-8 border-l-4 border-l-brand-500">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Smartphone className="text-brand-500" /> Secure Device Inventory</h2>
                <p className="text-slate-500 mb-8 max-w-2xl">Manage Master Stock. Assign devices to a specific client directly, or leave them as 'Unassigned' so the client can register them independently.</p>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <input type="text" value={newImei} onChange={(e) => setNewImei(e.target.value)} maxLength={15} placeholder="15-Digit IMEI" className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200" />
                    <input type="text" value={newSim} onChange={(e) => setNewSim(e.target.value)} placeholder="13-Digit M2M SIM" className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200" />
                    <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200">
                        <option>Whitelist Only (Unassigned)</option>
                        <option>Assign to: Acme Logistics</option>
                        <option>Assign to: VIP Rentals</option>
                        <option>Assign to: City Transit Corp</option>
                    </select>
                    <button onClick={handleAddDevice} className="btn-primary shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform">Register & Assign</button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr><th className="p-4 font-bold text-slate-700 dark:text-slate-300">IMEI</th><th className="p-4 font-bold text-slate-700 dark:text-slate-300">SIM / Mobile</th><th className="p-4 font-bold text-slate-700 dark:text-slate-300">Status</th><th className="p-4 font-bold text-slate-700 dark:text-slate-300">Actions (Remote Config)</th></tr>
                        </thead>
                        <tbody>
                            {inventoryList.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="p-4 font-mono text-sm text-slate-500 dark:text-slate-400">{item.imei}</td>
                                    <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200">{item.sim}</td>
                                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md ${item.status === 'Assigned' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'} `}>{item.status}</span></td>
                                    <td className="p-4 flex gap-2">
                                        <button className="text-xs btn-secondary py-1" onClick={() => handleActionToast(`Sent Factory Reset to ${item.imei}`)}>Factory Reset</button>
                                        <button className="text-xs btn-secondary py-1 text-brand-500" onClick={() => handleActionToast(`Configured Static IP for ${item.imei} via SMS`)}>Config via SMS</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderLandingEditor = () => (
        <div className="max-w-4xl space-y-6">
            <div className="glass-panel p-8 border-l-4 border-l-blue-500">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Monitor className="text-blue-500" /> Dynamic Landing Page Editor (CMS System)</h2>
                <p className="text-slate-500 mb-8 max-w-2xl">Modify the public-facing landing page instantaneously. Inject videos, modify titles, and alter feature bullet points natively without recompiling code.</p>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">Hero Section Title</label>
                            <textarea rows={2} defaultValue="The ultimate Fleet Management GPS Platform" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Top Banner Pulse Status</label>
                            <input type="text" defaultValue="Platform Operational" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Hero Subtitle Text</label>
                        <textarea rows={3} defaultValue="Enterprise-grade telematic solutions. Features 1-click engine control, advanced reporting, AI eco-scoring, and immediate deployment readiness." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Main Features Markdown List</label>
                        <textarea rows={5} defaultValue="- Live Dashboards: Direct streaming of telemetry&#10;- Remote Engine Block: Secure immobilization via UI&#10;- Client Portals: Dedicated workspaces" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm" />
                    </div>
                </div>
                <button onClick={() => handleActionToast('Landing Page Content Synchronized to Frontend!')} className="btn-primary mt-6 shadow-[0_0_15px_rgba(20,184,166,0.5)]">Sync to Live Site</button>
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
            {activeTab === 'overview' && renderAdminOverview()}
            {activeTab === 'admin_control' && renderAdminControl()}
            {activeTab === 'devices' && renderDeviceInventory()}
            {activeTab === 'landing' && renderLandingEditor()}
        </DashboardLayout>
    );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children, authRole, requiredRole }) => {
    if (!authRole) return <Navigate to="/login" replace />;
    if (requiredRole && authRole !== requiredRole && authRole !== 'ADMIN') return <Navigate to="/client" replace />;
    return children;
};

function App() {
    const [authRole, setAuthRole] = useState(null);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage onLogin={(role) => setAuthRole(role)} />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/client" element={
                    <ProtectedRoute authRole={authRole}>
                        <ClientDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute authRole={authRole} requiredRole="ADMIN">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;
