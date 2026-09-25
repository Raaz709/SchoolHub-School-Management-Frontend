import { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Newspaper, 
  CheckSquare, 
  Library, 
  CreditCard, 
  FileText, 
  Bell, 
  Search, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  User, 
  CheckCircle2,
  Lock,
  Mail,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'classroom' | 'attendance'>('login');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [activeSidebar, setActiveSidebar] = useState('Dashboard');
  const [classroomOpen, setClassroomOpen] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentScreen('dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7f6] font-sans text-gray-800 flex antialiased">
      
      {/* ================= LOGIN SCREEN ================= */}
      {currentScreen === 'login' && (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-[#f4f7f6]">
          <h1 className="text-3xl font-extrabold text-[#32524f] tracking-tight mb-12">School Management System</h1>
          
          <div className="max-w-6xl w-full bg-white rounded-[32px] shadow-xl border border-gray-100 p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Illustrations Section */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                {/* Illustration Box 1 */}
                <div className="bg-[#f0f5f4] rounded-2xl p-6 flex flex-col items-center justify-center border border-[#e2ecea] h-48 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#32524f_1px,transparent_1px)] [background-size:12px_12px]"></div>
                  <div className="w-16 h-16 rounded-full bg-[#32524f]/10 flex items-center justify-center text-2xl mb-3">💻</div>
                  <div className="w-28 h-2 bg-[#32524f]/20 rounded-full mb-1.5"></div>
                  <div className="w-16 h-2 bg-[#32524f]/15 rounded-full"></div>
                </div>

                {/* Illustration Box 2 */}
                <div className="bg-[#f0f5f4] rounded-2xl p-6 flex flex-col items-center justify-center border border-[#e2ecea] h-48 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#32524f_1px,transparent_1px)] [background-size:12px_12px]"></div>
                  <div className="w-16 h-16 rounded-full bg-[#32524f]/10 flex items-center justify-center text-2xl mb-3">📁</div>
                  <div className="w-28 h-2 bg-[#32524f]/20 rounded-full mb-1.5"></div>
                  <div className="w-16 h-2 bg-[#32524f]/15 rounded-full"></div>
                </div>
              </div>

              {/* Bottom Illustration Banner */}
              <div className="bg-[#f0f5f4] rounded-2xl p-6 flex items-center justify-between border border-[#e2ecea]">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-[#32524f]/10 flex items-center justify-center text-xl">📊</div>
                  <div>
                    <div className="w-32 h-2.5 bg-[#32524f]/25 rounded-full mb-2"></div>
                    <div className="w-20 h-2 bg-[#32524f]/15 rounded-full"></div>
                  </div>
                </div>
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#32524f]/30"></div>
                  <div className="w-3 h-3 rounded-full bg-[#32524f]/50"></div>
                  <div className="w-3 h-3 rounded-full bg-[#32524f]"></div>
                </div>
              </div>
            </div>

            {/* Right Login Card */}
            <div className="lg:col-span-5 bg-[#f9fcfb] rounded-3xl p-8 border border-[#e2ecea] shadow-sm">
              <h2 className="text-2xl font-black text-[#32524f] mb-6">WELCOME</h2>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#32524f] mb-2">Student ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter Student ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3b6e68] placeholder-gray-400 font-medium shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-[#32524f]">Password</label>
                    <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[11px] text-[#3b6e68] font-semibold hover:underline">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3b6e68] placeholder-gray-400 font-medium shadow-2xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-3 py-3.5 bg-[#3b6e68] hover:bg-[#32524f] text-white font-bold rounded-xl text-xs shadow-md shadow-[#3b6e68]/30 transition-all active:scale-[0.99]"
                >
                  Login
                </button>
              </form>

              <div className="text-center mt-6">
                <a href="#support" onClick={(e) => e.preventDefault()} className="text-xs text-[#3b6e68] font-medium hover:underline flex items-center justify-center space-x-1">
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Contact IT Support</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= DASHBOARD & APP LAYOUT ================= */}
      {currentScreen !== 'login' && (
        <div className="min-h-screen w-full flex bg-[#f4f7f6]">
          
          {/* Sidebar */}
          <aside className="w-64 bg-[#32524f] text-white flex flex-col shrink-0 select-none">
            {/* Logo / Brand */}
            <div className="p-6 flex items-center space-x-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold">
                🐧
              </div>
              <span className="font-extrabold text-base tracking-wide">SchoolHub</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 text-xs font-semibold">
              <button
                onClick={() => { setActiveSidebar('Dashboard'); setCurrentScreen('dashboard'); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeSidebar === 'Dashboard' ? 'bg-[#3b6e68] text-white shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashbord</span>
              </button>

              <div>
                <button
                  onClick={() => { setClassroomOpen(!classroomOpen); setCurrentScreen('classroom'); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeSidebar === 'Classroom' ? 'bg-[#3b6e68] text-white shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4" />
                    <span>Classroom</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${classroomOpen ? 'rotate-180' : ''}`} />
                </button>

                {classroomOpen && (
                  <div className="pl-11 pr-4 py-1 space-y-1 text-[11px] text-white/60">
                    <button onClick={() => { setActiveSidebar('Courses'); setCurrentScreen('classroom'); }} className="w-full text-left py-1.5 hover:text-white">Courses</button>
                    <button onClick={() => setActiveSidebar('Timetable')} className="w-full text-left py-1.5 hover:text-white">Timetable</button>
                    <button onClick={() => setActiveSidebar('Assessments')} className="w-full text-left py-1.5 hover:text-white">Assessments</button>
                    <button onClick={() => setActiveSidebar('Classes')} className="w-full text-left py-1.5 hover:text-white">Classes</button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveSidebar('News')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeSidebar === 'News' ? 'bg-[#3b6e68] text-white shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <Newspaper className="w-4 h-4" />
                <span>News</span>
              </button>

              <button
                onClick={() => { setActiveSidebar('Attendance'); setCurrentScreen('attendance'); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeSidebar === 'Attendance' ? 'bg-[#3b6e68] text-white shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Attendance</span>
              </button>

              <button
                onClick={() => setActiveSidebar('E-Library')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeSidebar === 'E-Library' ? 'bg-[#3b6e68] text-white shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <Library className="w-4 h-4" />
                <span>E-Library</span>
              </button>

              <button
                onClick={() => setActiveSidebar('Payment')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeSidebar === 'Payment' ? 'bg-[#3b6e68] text-white shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment</span>
              </button>

              <button
                onClick={() => setActiveSidebar('Reports')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeSidebar === 'Reports' ? 'bg-[#3b6e68] text-white shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <FileText className="w-4 h-4" />
                <span>Reports</span>
              </button>
            </nav>

            {/* Logout / User footer */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setCurrentScreen('login')}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl text-xs font-semibold"
              >
                <User className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            
            {/* Top Bar */}
            <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0">
              <div className="relative w-96">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search courses, assignments, news..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3b6e68]"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-700 relative cursor-pointer hover:bg-gray-100">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#3b6e68] rounded-full"></span>
                </div>
                <div className="flex items-center space-x-3 pl-2 border-l border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-[#3b6e68] text-white font-bold flex items-center justify-center shadow-sm text-sm">
                    IY
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold text-gray-900 block">Idris Yusuf</span>
                    <span className="text-[11px] text-gray-500">Student</span>
                  </div>
                </div>
              </div>
            </header>

            {/* ================= DASHBOARD VIEW ================= */}
            {currentScreen === 'dashboard' && (
              <div className="p-8 space-y-8 max-w-7xl w-full mx-auto">
                
                {/* Welcome Banner */}
                <div className="bg-white rounded-3xl p-8 shadow-xs border border-gray-100 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#f0f5f4] to-transparent pointer-events-none"></div>
                  <div className="space-y-2 z-10">
                    <h2 className="text-2xl font-black text-[#32524f]">Welcome back <span className="text-[#3b6e68]">Idris!</span></h2>
                    <p className="text-xs text-gray-500 italic max-w-xl">
                      "Anyone who has never made a mistake has never tried anything new." — Albert Einstein
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-[#3b6e68]/10 flex items-center justify-center text-3xl shadow-sm z-10">
                    👋
                  </div>
                </div>

                {/* Grid Section 1: Attendance & To-Do List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Attendance Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900">Attendance</h3>
                      <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-center py-6">
                      <div className="relative w-36 h-36 rounded-full border-8 border-[#f0f5f4] flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-8 border-[#3b6e68] border-t-transparent transform -rotate-45"></div>
                        <div className="text-center">
                          <span className="text-2xl font-black text-gray-900">92%</span>
                          <span className="text-[10px] text-gray-500 block">Overall</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-6 text-xs font-semibold text-gray-600 mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-[#3b6e68] rounded-full"></span>
                        <span>Present</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-gray-200 rounded-full"></span>
                        <span>Absent</span>
                      </div>
                    </div>
                  </div>

                  {/* To Do List Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900">To Do List</h3>
                      <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>

                    <div className="space-y-3 flex-1 py-2">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <CheckCircle2 className="w-4 h-4 text-[#3b6e68]" />
                        <span className="text-xs font-semibold text-gray-800 line-through">Return book to library</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-4 h-4 rounded-full border-2 border-[#3b6e68]"></div>
                        <span className="text-xs font-semibold text-gray-800">Go for health walk</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                        <span className="text-xs font-semibold text-gray-800">Meet with house club</span>
                      </div>
                    </div>

                    <button className="w-full mt-3 py-2.5 bg-[#f0f5f4] hover:bg-[#e2ecea] text-[#3b6e68] font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors">
                      <Plus className="w-4 h-4" />
                      <span>Add a new task</span>
                    </button>
                  </div>

                </div>

                {/* Grid Section 2: Grade Report & Today's Classes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Grade Report */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-gray-900">Grade Report</h3>
                      <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>

                    <div className="flex items-end justify-around h-48 pt-6 pb-2 border-b border-gray-100">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-8 bg-[#3b6e68] rounded-t-xl h-36"></div>
                        <span className="text-[10px] font-semibold text-gray-500">1st Semester</span>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-8 bg-[#52ab98] rounded-t-xl h-28"></div>
                        <span className="text-[10px] font-semibold text-gray-500">2nd Semester</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-6 text-xs font-semibold text-gray-600 mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-[#3b6e68] rounded-full"></span>
                        <span>Student Average</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-[#52ab98] rounded-full"></span>
                        <span>Class Average</span>
                      </div>
                    </div>
                  </div>

                  {/* Today's Classes */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900">Today's Classes</h3>
                      <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-[#3b6e68]/10 text-[#3b6e68] font-bold text-xs flex items-center justify-center">
                            UC
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">UNIX & C PROGRAMMING</h4>
                            <p className="text-[10px] text-gray-500">COMPUTER SCIENCE</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#3b6e68]">9:30 AM</span>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-[#3b6e68]/10 text-[#3b6e68] font-bold text-xs flex items-center justify-center">
                            MD
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">MATERIAL DESIGN</h4>
                            <p className="text-[10px] text-gray-500">ENGINEERING</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#3b6e68]">10:30 AM</span>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-[#3b6e68]/10 text-[#3b6e68] font-bold text-xs flex items-center justify-center">
                            CS
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">CONTROL SYSTEM</h4>
                            <p className="text-[10px] text-gray-500">ENGINEERING</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#3b6e68]">11:30 AM</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* School News & Update */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">School News & Update</h3>
                    <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-600">
                        OL
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-900">Okemati Lanray</h4>
                          <span className="text-[10px] text-gray-400">1hr ago</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">Principal</p>
                        <p className="text-xs text-gray-700 leading-relaxed pt-1">
                          All students are mandated to report to the health center for a COVID-19 Test, in accordance to the health guidelines. <a href="#read" onClick={(e) => e.preventDefault()} className="text-[#3b6e68] font-semibold hover:underline">read more</a>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-600">
                        AN
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-900">Alake Nifemi</h4>
                          <span className="text-[10px] text-gray-400">2hr ago</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">Vice-Principal</p>
                        <p className="text-xs text-gray-700 leading-relaxed pt-1">
                          All students are mandated to report to the health center for a COVID-19 Test, in accordance to the health guidelines. <a href="#read" onClick={(e) => e.preventDefault()} className="text-[#3b6e68] font-semibold hover:underline">read more</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ================= CLASSROOM / COURSES VIEW ================= */}
            {currentScreen === 'classroom' && (
              <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#32524f]">Classroom Courses</h2>
                    <p className="text-xs text-gray-500">Browse enrolled courses, materials, and lectures</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-4">
                    <div className="h-40 bg-[#f0f5f4] rounded-2xl flex items-center justify-center text-4xl">
                      🦅
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Ornithology 201</h3>
                      <p className="text-xs text-gray-500">Avian Sciences</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-xs text-[#3b6e68] font-semibold">Prof. Austin</span>
                      <button className="px-3 py-1.5 bg-[#3b6e68] text-white rounded-xl text-xs font-bold hover:bg-[#32524f]">View</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-4">
                    <div className="h-40 bg-[#f0f5f4] rounded-2xl flex items-center justify-center text-4xl">
                      🌿
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Botany 201</h3>
                      <p className="text-xs text-gray-500">Plant Science</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-xs text-[#3b6e68] font-semibold">Prof. Okoro</span>
                      <button className="px-3 py-1.5 bg-[#3b6e68] text-white rounded-xl text-xs font-bold hover:bg-[#32524f]">View</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-4">
                    <div className="h-40 bg-[#f0f5f4] rounded-2xl flex items-center justify-center text-4xl">
                      🍲
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Food Chemistry 101</h3>
                      <p className="text-xs text-gray-500">Food Science</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-xs text-[#3b6e68] font-semibold">Prof. Blessing</span>
                      <button className="px-3 py-1.5 bg-[#3b6e68] text-white rounded-xl text-xs font-bold hover:bg-[#32524f]">View</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ATTENDANCE VIEW ================= */}
            {currentScreen === 'attendance' && (
              <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#32524f]">Attendance Records</h2>
                    <p className="text-xs text-gray-500">Detailed monthly breakdown of student presence</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-xs border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  <div className="flex flex-col items-center justify-center p-6 bg-[#f0f5f4] rounded-2xl">
                    <span className="text-4xl font-black text-[#3b6e68]">92%</span>
                    <span className="text-xs text-gray-600 font-semibold mt-1">Overall Attendance</span>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-700">Present Days: 184</span>
                      <span className="text-gray-700">Absent Days: 16</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-[#3b6e68] h-full rounded-full w-[92%]"></div>
                    </div>
                    <p className="text-xs text-gray-500">Attendance is above the 85% requirement threshold for term finals.</p>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>
      )}

    </div>
  );
}
