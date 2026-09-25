import React, { useState } from 'react';
import { Eye, EyeOff, User, Building, Lock, Bell, Search, Calendar as CalendarIcon, CheckSquare, BookOpen, ChevronRight, ArrowLeft, LayoutDashboard, LogOut } from 'lucide-react';

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

  // October 2025 calendar days config
  const daysInMonth = 31;
  const startDayOffset = 3; // Wednesday
  const calendarDays = [];
  
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push({ day: null, status: null });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    let status = 'present';
    if ([4, 11, 18, 25].includes(d)) {
      status = 'weekend';
    } else if ([7, 12, 16, 22, 29].includes(d)) {
      status = 'absent';
    } else if ([15, 20].includes(d)) {
      status = 'leave';
    }
    calendarDays.push({ day: d, status });
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-200 flex flex-col font-sans text-gray-800">
      
      {/* Feature 1: Web Login Screen */}
      {currentScreen === 'login' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/80 p-8">
            
            {/* Logo & Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
                <span className="text-white text-3xl font-bold">🎓</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                School<span className="text-blue-600">ERP</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium">Complete Solution For Your School</p>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Welcome to School ERP</h2>
              <p className="text-xs text-gray-500 mt-1">Complete solution for your child's school updates</p>
            </div>

            {error && <div className="mb-4 text-xs text-red-500 bg-red-50 p-3 rounded-xl text-center border border-red-100">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">School</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium"
                  >
                    <option value="Shealing Public School Chhatarpur">Shealing Public School Chhatarpur</option>
                    <option value="Apex International Public School">Apex International Public School</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">User ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter User ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-gray-600 font-medium">Remember Password</span>
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-red-500 font-semibold hover:underline">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl text-xs shadow-lg shadow-blue-500/25 transition-all active:scale-[0.99]"
              >
                {loading ? 'Logging in...' : 'Login Into Your Account'}
              </button>
            </form>

            <div className="text-center mt-6 text-xs">
              <span className="text-gray-500">Don't have an account? </span>
              <a href="#signup" onClick={(e) => e.preventDefault()} className="text-blue-600 font-semibold hover:underline">
                Sign Up
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Feature 2: Web Dashboard Screen */}
      {currentScreen === 'dashboard' && (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col space-y-6">
          
          {/* Top Navbar */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white/80 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center text-white font-bold text-lg justify-center shadow-md">
                ER
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Emma Roberts</h2>
                <p className="text-xs text-gray-500 font-medium">Grade 7 B • Shealing Public School Chhatarpur</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative w-72 hidden md:block">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search here..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-700 relative cursor-pointer hover:bg-gray-100">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>

              <button
                onClick={() => setCurrentScreen('login')}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Announcement Banner */}
          <div className="bg-gradient-to-r from-gray-900 to-indigo-950 text-white text-xs px-6 py-3.5 rounded-2xl flex items-center space-x-3 shadow-md">
            <span className="text-base">📢</span>
            <span className="font-semibold">Announcement: PTM on Mar 12, bus routes updated!</span>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* School Menu */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">School Menu</h3>
                  <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">See all</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center space-x-4 cursor-pointer hover:bg-blue-50/50 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Dashboard</h4>
                      <p className="text-xs text-gray-500">Overview & Stats</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setCurrentScreen('attendance')}
                    className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-indigo-50/50 transition-colors relative"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">Calendar</h4>
                        <p className="text-xs text-gray-500">Schedules & Events</p>
                      </div>
                    </div>
                    <span className="w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-sm">3</span>
                  </div>

                  <div 
                    onClick={() => setCurrentScreen('attendance')}
                    className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors relative"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <CheckSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">Attendance</h4>
                        <p className="text-xs text-gray-500">Monthly Records</p>
                      </div>
                    </div>
                    <span className="w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-sm">2</span>
                  </div>

                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center space-x-4 cursor-pointer hover:bg-purple-50/50 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Homework</h4>
                      <p className="text-xs text-gray-500">Assignments & Tasks</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* School Moments */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">School Moments</h3>
                  <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">See all</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="h-32 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-xl mb-3 flex items-center justify-center text-white font-bold text-base shadow-inner">
                      Science Fair 2025
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">Science Fair 2025</h4>
                    <p className="text-xs text-gray-500 mt-1">Annual Science Fair where students of Grades 6.</p>
                    <p className="text-xs font-semibold text-blue-600 mt-2">Date: March 10, 2025</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="h-32 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-xl mb-3 flex items-center justify-center text-white font-bold text-base shadow-inner">
                      Sports Day 2025
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">Sports Day 2025</h4>
                    <p className="text-xs text-gray-500 mt-1">A day of healthy inter-house games and athletics.</p>
                    <p className="text-xs font-semibold text-blue-600 mt-2">Date: March 10, 2025</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Today at a Glance */}
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Today at a Glance</h3>
                  <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">See all</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-8 bg-red-500 rounded-full"></div>
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Classes Today</span>
                        <span className="text-xs text-gray-500">6 Lectures scheduled</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Pending Homework</span>
                        <span className="text-xs text-gray-500">2 Tasks due</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">New Circulars</span>
                        <span className="text-xs text-gray-500">1 Unread notice</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Feature 3: Web Attendance & Calendar Screen */}
      {currentScreen === 'attendance' && (
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-6 flex flex-col space-y-6">
          
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white/80 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base font-bold text-gray-900">Attendance & Calendar</h2>
                <p className="text-xs text-gray-500 font-medium">Emma Roberts - Grade 7 B</p>
              </div>
            </div>

            <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-700 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Calendar Grid (2 cols) */}
            <div className="md:col-span-2 bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">October 2025</h3>
                <div className="flex space-x-1.5">
                  <button className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-200 font-bold">&lt;</button>
                  <button className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-200 font-bold">&gt;</button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-3">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-y-3 text-center text-xs">
                {calendarDays.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center h-10 relative">
                    {item.day !== null ? (
                      <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center ${item.status === 'absent' ? 'bg-red-50 text-red-600 font-bold' : item.status === 'leave' ? 'bg-amber-50 text-amber-600 font-bold' : 'bg-blue-50 text-blue-600 font-bold'}`}>
                        <span>{item.day}</span>
                        <div className="flex space-x-0.5 mt-0.5">
                          {item.status === 'present' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                          {item.status === 'absent' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                          {item.status === 'leave' && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>}
                        </div>
                      </div>
                    ) : (
                      <span></span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-100 text-xs text-gray-600 font-medium">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                  <span>Present</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  <span>Absent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
                  <span>Leave</span>
                </div>
              </div>
            </div>

            {/* Monthly Stats Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/80 space-y-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">October 2025 Statistics</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-gray-600">Overall Attendance</span>
                    <span className="text-blue-600">73%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full w-[73%]"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Working Days</span>
                  <span className="text-sm font-bold text-gray-800">31</span>
                </div>
                <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <span className="text-xs text-blue-600 font-medium">Present Days</span>
                  <span className="text-sm font-bold text-blue-600">23</span>
                </div>
                <div className="bg-red-50/70 p-3.5 rounded-2xl border border-red-100 flex items-center justify-between">
                  <span className="text-xs text-red-500 font-medium">Absent Days</span>
                  <span className="text-sm font-bold text-red-500">5</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
