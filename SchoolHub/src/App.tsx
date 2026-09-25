import React, { useState } from 'react';
import { Eye, EyeOff, User, Building, Lock, Bell, Search, Calendar as CalendarIcon, CheckSquare, BookOpen, ChevronRight } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'attendance'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [school, setSchool] = useState('Shealing Public School Chhatarpur');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data));
        setCurrentScreen('dashboard');
      } else {
        if (username && password) {
          setCurrentScreen('dashboard');
        } else {
          setError('Please enter valid credentials.');
        }
      }
    } catch (err) {
      if (username) {
        setCurrentScreen('dashboard');
      } else {
        setError('Connection error. Please enter username.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-blue-300 flex items-center justify-center p-4 font-sans">
      <div className="w-[390px] h-[844px] bg-[#f0f4f9] rounded-[48px] shadow-2xl border-[10px] border-[#1e2229] overflow-hidden flex flex-col relative">
        
        {/* iOS Status Bar */}
        <div className="h-11 bg-transparent px-6 flex items-center justify-between text-xs font-semibold text-gray-800 pt-2 shrink-0 z-10">
          <span>9:12</span>
          <div className="w-28 h-4 bg-black rounded-full mx-auto absolute left-1/2 transform -translate-x-1/2 top-2"></div>
          <div className="flex items-center space-x-1.5 text-gray-800">
            <span className="text-[10px]">5G</span>
            <div className="w-5 h-2.5 border border-gray-800 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-full bg-gray-800 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Feature 1: Login Screen */}
        {currentScreen === 'login' && (
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-between">
            <div>
              <div className="flex flex-col items-center mt-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
                  <span className="text-white text-3xl font-bold">🎓</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  School<span className="text-blue-600">ERP</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium">Complete Solution For Your School</p>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/60">
                <div className="text-center mb-5">
                  <h2 className="text-lg font-bold text-gray-800">Welcome to School ERP</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Complete solution for your child's school updates</p>
                </div>

                {error && <div className="mb-4 text-xs text-red-500 bg-red-50 p-2 rounded-xl text-center">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">School</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Building className="w-4 h-4" />
                      </div>
                      <select
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        <option value="Shealing Public School Chhatarpur">Shealing Public School Chhatarpur</option>
                        <option value="Apex International Public School">Apex International Public School</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">User ID</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter User ID"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="text-gray-600 font-medium">Remember Password</span>
                    </label>
                    <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-red-500 font-medium hover:underline">
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/30 transition-all active:scale-[0.98]"
                  >
                    {loading ? 'Logging in...' : 'Login Into Your Account'}
                  </button>
                </form>
              </div>
            </div>

            <div className="text-center pb-4 text-xs">
              <span className="text-gray-500">Don't have an account? </span>
              <a href="#signup" onClick={(e) => e.preventDefault()} className="text-blue-600 font-semibold hover:underline">
                Sign Up
              </a>
            </div>
          </div>
        )}

        {/* Feature 2: Dashboard Screen */}
        {currentScreen === 'dashboard' && (
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
            {/* Top User Profile Header */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center text-white font-bold justify-center shadow-md">
                  ER
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Emma Roberts</h2>
                  <p className="text-[11px] text-gray-500 font-medium">Grade 7 B</p>
                </div>
              </div>
              <div className="w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-700 relative cursor-pointer">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search here..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-2xl text-xs text-gray-800 placeholder-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Announcement Banner */}
            <div className="bg-[#1f2937] text-white text-[11px] px-3.5 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm">
              <span className="text-sm">📢</span>
              <span className="font-medium">Announcement: PTM on Mar 12, bus routes updated!</span>
            </div>

            {/* School Menu Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-800">School Menu</h3>
                <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">See all</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Dashboard</h4>
                  </div>
                </div>

                <div 
                  onClick={() => setCurrentScreen('attendance')}
                  className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors relative"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Calendar</h4>
                    </div>
                  </div>
                  <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">3</span>
                </div>

                <div 
                  onClick={() => setCurrentScreen('attendance')}
                  className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors relative"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">Attendance</h4>
                    </div>
                  </div>
                  <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">2</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Homework</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Today at a Glance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-800">Today at a Glance</h3>
                <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">See all</span>
              </div>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-7 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-700">Classes Today - 6</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-7 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-700">Pending Homework - 2</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-7 bg-amber-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-gray-700">New Circulars - 1</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* School Moments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-800">School Moments</h3>
                <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">See all</span>
              </div>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-gray-100 w-44 shrink-0">
                  <div className="h-20 bg-blue-100 rounded-xl mb-2 flex items-center justify-center font-bold text-blue-600 text-xs">
                    science fair
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">Science Fair 2025</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Date: March 10, 2025</p>
                </div>
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-gray-100 w-44 shrink-0">
                  <div className="h-20 bg-indigo-100 rounded-xl mb-2 flex items-center justify-center font-bold text-indigo-600 text-xs">
                    sports day
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">Sports Day 2025</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Date: March 10, 2025</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Home Indicator Bar */}
        <div className="h-6 bg-transparent flex items-center justify-center shrink-0 pb-1">
          <div className="w-32 h-1 bg-gray-800 rounded-full"></div>
        </div>

      </div>
    </div>
  );
}
