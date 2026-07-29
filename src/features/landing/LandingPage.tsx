import React, { useState, useEffect } from "react";
import MotionScene from "../../components/motion/MotionScene";
import { ScrollReveal } from "../../components/motion/ScrollReveal";
import { 
  ArrowRight, PenTool, CheckSquare, BarChart3, 
  Users, Briefcase, FileSignature, LayoutDashboard,
  Check, Menu, X, Star, Zap
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "motion/react";

interface LandingPageProps {
  onNavigateToAuth: (mode: "login" | "register") => void;
}

// ----------------------------------------------------------------------
// Premium Component: Spotlight Card
// ----------------------------------------------------------------------
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className={`relative overflow-hidden cursor-interact ${className}`}
      data-cursor-text="VIEW"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Spotlight Gradient */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none mix-blend-screen"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(230, 57, 70, 0.15), transparent 40%)`
          )
        }}
      />
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Parallax background
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -200]);
  
  // High performance mouse tracking for 3D hero parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    // Fix ugly URL when returning to landing page from editor router
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, '', '/');
    }
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    // Calculate mouse position relative to center of screen (-1 to 1)
    const x = (clientX / window.innerWidth - 0.5) * 40;
    const y = (clientY / window.innerHeight - 0.5) * 40;
    mouseX.set(x);
    mouseY.set(y);
  };

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <MotionScene sceneKey="landing">
      <div 
        className="min-h-screen bg-manuscript-gray text-ink-black font-sans selection:bg-[#E63946] selection:text-white relative overflow-x-hidden"
        onMouseMove={handleMouseMove}
      >
        
        {/* Ambient Halftone Grid with Parallax */}
        <motion.div
          className="ambient-grid fixed inset-0 pointer-events-none z-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(#141414 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
            y: yParallax
          }}
        />

        {/* Section 1: Sticky Header */}
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? "bg-manuscript-gray/95 backdrop-blur-md border-b-2 border-ink-black shadow-[0_4px_0px_#141414]" : "bg-transparent py-2"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 select-none cursor-interact group" data-cursor-text="TOP" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="bg-[#E63946] text-white px-2 py-0.5 rounded-none -rotate-2 shadow-sm font-syne font-black text-xl group-hover:rotate-0 transition-transform">
                Manga
              </span>
              <span className="italic font-serif font-bold text-xl group-hover:text-[#E63946] transition-colors">Studio</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 font-mono text-xs font-bold uppercase">
              {['overview', 'workflow', 'roles', 'series'].map(id => (
                <button key={id} onClick={() => scrollTo(id)} className="relative group cursor-interact" data-cursor-text="GO">
                  <span className="group-hover:text-[#E63946] transition-colors">{id === 'overview' ? 'Tổng quan' : id}</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E63946] group-hover:w-full transition-all duration-300"></span>
                </button>
              ))}
            </nav>

            {/* Auth Actions Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => onNavigateToAuth("login")}
                className="cursor-interact px-4 py-2 bg-white border-2 border-ink-black font-syne text-xs font-bold shadow-[2px_2px_0px_#141414] hover:shadow-[4px_4px_0px_#E63946] hover:-translate-y-0.5 transition-all uppercase tracking-wider"
              >
                Sign In
              </button>
              <button 
                onClick={() => onNavigateToAuth("register")}
                className="cursor-interact px-4 py-2 bg-[#E63946] text-white border-2 border-ink-black font-syne text-xs font-bold shadow-[2px_2px_0px_#141414] hover:bg-red-600 hover:shadow-[4px_4px_0px_#141414] hover:-translate-y-0.5 transition-all uppercase tracking-wider relative overflow-hidden group"
              >
                <span className="relative z-10">Create Account</span>
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></span>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 border-2 border-ink-black bg-white cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <motion.div animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}>
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </button>
          </div>
        </motion.header>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
              animate={{ opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
              exit={{ opacity: 0, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 z-40 bg-white pt-24 px-4 flex flex-col md:hidden border-b-4 border-ink-black"
            >
              <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(#141414 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
              <nav className="flex flex-col gap-8 font-syne text-3xl font-extrabold uppercase items-center relative z-10 mt-8">
                {['overview', 'workflow', 'roles', 'series'].map((id, i) => (
                  <motion.button 
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    onClick={() => scrollTo(id)}
                    className="hover:text-[#E63946] transition-colors"
                  >
                    {id === 'overview' ? 'Tổng quan' : id}
                  </motion.button>
                ))}
              </nav>
              <div className="flex flex-col gap-4 mt-auto mb-12 px-4 relative z-10">
                <button 
                  onClick={() => onNavigateToAuth("login")}
                  className="w-full py-4 bg-white border-2 border-ink-black font-syne font-bold uppercase shadow-[4px_4px_0px_#141414] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#141414] transition-all"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => onNavigateToAuth("register")}
                  className="w-full py-4 bg-[#E63946] text-white border-2 border-ink-black font-syne font-bold uppercase shadow-[4px_4px_0px_#141414] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#141414] transition-all"
                >
                  Create Account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative z-10 pt-24 pb-20">
          {/* Section 2: Hero */}
          <section id="overview" className="max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-24 flex flex-col lg:flex-row items-center gap-12 relative">
            <div className="flex-1 space-y-6 relative z-10">
              <ScrollReveal>
                <motion.div 
                  initial={{ rotate: -2, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="inline-block bg-ink-black text-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-ink-black shadow-[4px_4px_0px_#E63946] relative overflow-hidden group"
                >
                  <span className="relative z-10">MANGA PRODUCTION WORKFLOW SYSTEM</span>
                  <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:animate-[manga-ink-sweep_0.5s_ease-in-out]"></div>
                </motion.div>
              </ScrollReveal>
              <h2 className="font-syne text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight flex flex-wrap gap-x-3 gap-y-2">
                {["Nơi", "một", "ý", "tưởng", "manga", "trở", "thành", "một"].map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 30, filter: "blur(12px)", rotateX: 90 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.08, type: "spring", bounce: 0.4 }}
                    style={{ transformOrigin: "bottom" }}
                  >
                    {word}
                  </motion.span>
                ))}
                <motion.span
                  initial={{ opacity: 0, scale: 0.2, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.9, type: "spring", bounce: 0.6 }}
                  className="italic font-serif text-[#E63946] inline-block relative"
                >
                  series
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-6 -top-4 opacity-50"
                  >
                    <Zap className="w-6 h-6 text-[#F39C12]" />
                  </motion.div>
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.8, delay: 1.0, type: "spring" }}
                >
                  được xuất bản.
                </motion.span>
              </h2>
              <ScrollReveal delay={0.6}>
                <p className="font-sans text-lg md:text-xl text-neutral-700 max-w-xl font-medium relative border-l-4 border-ink-black pl-4 ml-2">
                  Kết nối Mangaka, Assistant, Editor và Editorial Board trong một quy trình sáng tác, kiểm duyệt và xuất bản minh bạch.
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} 
                    transition={{ duration: 3, repeat: Infinity }} 
                    className="absolute -left-10 -top-2 text-[#E63946] opacity-40"
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </motion.span>
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.8} className="flex flex-wrap gap-4 pt-4 pl-2">
                <button 
                  onClick={() => onNavigateToAuth("register")}
                  className="cursor-interact px-8 py-5 bg-[#E63946] text-white border-4 border-ink-black font-syne text-sm font-black shadow-[6px_6px_0px_#141414] hover:bg-red-600 hover:shadow-[2px_2px_0px_#141414] hover:translate-y-1 hover:translate-x-1 transition-all flex items-center gap-2 uppercase tracking-widest group"
                  data-cursor-text="JOIN"
                >
                  Bắt đầu sáng tác 
                  <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </button>
                <button 
                  onClick={() => scrollTo("workflow")}
                  className="cursor-interact px-8 py-5 bg-white text-ink-black border-4 border-ink-black font-syne text-sm font-black shadow-[6px_6px_0px_#141414] hover:bg-neutral-50 hover:shadow-[2px_2px_0px_#E63946] hover:translate-y-1 hover:translate-x-1 transition-all uppercase tracking-widest"
                  data-cursor-text="READ"
                >
                  Xem quy trình
                </button>
              </ScrollReveal>
            </div>
            
            <div className="flex-1 w-full relative perspective-[1200px]">
              <ScrollReveal delay={0.4} yOffset={60}>
                {/* Hero Visual - Premium 3D Glitch Panel */}
                <motion.div 
                  className="relative w-full aspect-square md:aspect-[4/3] bg-ink-black border-4 border-ink-black shadow-[20px_20px_0px_#141414] p-2 overflow-hidden group cursor-interact"
                  data-cursor-text="DRAG"
                  style={{
                    rotateX: useTransform(smoothMouseY, y => y * -0.4),
                    rotateY: useTransform(smoothMouseX, x => x * 0.4),
                  }}
                >
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-2">
                    <motion.div 
                      className="border-2 border-white overflow-hidden relative shadow-[4px_4px_0px_rgba(255,255,255,0.2)]"
                      style={{ x: useTransform(smoothMouseX, x => x * -0.8), y: useTransform(smoothMouseY, y => y * -0.8) }}
                    >
                      <img src="/manga/one-piece/chapter-1/page-004.jpg" alt="Idea" className="w-full h-full object-cover grayscale opacity-70 mix-blend-screen group-hover:scale-125 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000 ease-out" />
                      <div className="absolute bottom-2 right-2 bg-[#E63946] text-white px-2 py-1 font-mono text-[9px] border-2 border-white font-bold uppercase transform group-hover:-translate-y-2 transition-transform">1. Idea</div>
                    </motion.div>
                    <motion.div 
                      className="border-2 border-white overflow-hidden relative row-span-2 shadow-[8px_8px_0px_rgba(255,255,255,0.2)] z-10 bg-white"
                      style={{ x: useTransform(smoothMouseX, x => x * 0.5), y: useTransform(smoothMouseY, y => y * 0.5) }}
                    >
                      <img src="/manga/one-piece/cover.jpg" alt="Production" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 delay-100" />
                      <div className="absolute top-2 right-2 bg-white text-ink-black px-2 py-1 font-mono text-[9px] border-2 border-ink-black font-bold uppercase transform group-hover:translate-y-2 transition-transform shadow-[2px_2px_0px_#141414]">2. Production</div>
                    </motion.div>
                    <motion.div 
                      className="border-2 border-white overflow-hidden relative shadow-[4px_4px_0px_rgba(255,255,255,0.2)]"
                      style={{ x: useTransform(smoothMouseX, x => x * -0.4), y: useTransform(smoothMouseY, y => y * -0.4) }}
                    >
                      <img src="/manga/one-piece/chapter-1/page-021.jpg" alt="Review" className="w-full h-full object-cover grayscale opacity-70 mix-blend-screen group-hover:scale-125 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000 ease-out delay-200" />
                      <div className="absolute bottom-2 right-2 bg-[#E63946] text-white px-2 py-1 font-mono text-[9px] border-2 border-white font-bold uppercase transform group-hover:-translate-y-2 transition-transform">3. Review</div>
                    </motion.div>
                  </div>
                  {/* Floating Status Indicator */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: [0, -15, 0], opacity: 1 }}
                    transition={{ delay: 1, duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-6 -left-6 bg-white border-4 border-ink-black p-4 shadow-[12px_12px_0px_#E63946] flex items-center gap-4 z-20"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#2ECC71] animate-pulse"></div>
                    <div>
                      <div className="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Live Studio</div>
                      <div className="font-syne font-black text-sm">Editorial Review Active</div>
                    </div>
                  </motion.div>
                </motion.div>
              </ScrollReveal>
            </div>
          </section>

          {/* Marquee Divider */}
          <div className="w-full bg-[#E63946] border-y-4 border-ink-black py-4 overflow-hidden flex whitespace-nowrap shadow-[0_12px_0px_rgba(0,0,0,0.1)] relative z-20">
            <motion.div 
              className="flex font-syne font-black text-2xl md:text-4xl uppercase text-white tracking-widest gap-8 items-center"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 15, ease: "linear", repeat: Infinity }}
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-8">
                  <span>Manga Studio OS</span>
                  <span className="text-ink-black"><Star className="w-6 h-6 fill-current" /></span>
                  <span className="italic text-transparent" style={{ WebkitTextStroke: "1px white" }}>Production Workflow</span>
                  <span className="text-ink-black"><Zap className="w-6 h-6 fill-current" /></span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Section 3: Project Value */}
          <section className="bg-ink-black text-white py-32 px-4 md:px-8 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none z-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="max-w-7xl mx-auto relative z-10">
              <ScrollReveal>
                <h3 className="font-syne text-4xl md:text-6xl font-black mb-20 text-center max-w-4xl mx-auto leading-tight">
                  Một Studio. Một Workflow.<br/>
                  <span className="text-[#E63946] italic font-serif">Mọi vai trò</span> cùng phối hợp.
                </h3>
              </ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { icon: LayoutDashboard, title: "Quản lý xuyên suốt", desc: "Theo dõi series, chapter, page và task từ một màn hình duy nhất." },
                  { icon: PenTool, title: "Phân công rõ ràng", desc: "Editor giao việc và Assistant cập nhật tiến độ công việc real-time." },
                  { icon: CheckSquare, title: "Kiểm duyệt minh bạch", desc: "Mọi proposal và chapter đều trải qua quy trình review nghiêm ngặt." },
                  { icon: BarChart3, title: "Quyết định từ dữ liệu", desc: "Voting, reader metrics và rankings định hình tương lai series." }
                ].map((item, idx) => (
                  <ScrollReveal key={idx} delay={0.1 * idx}>
                    <SpotlightCard className="bg-[#141414] border-4 border-neutral-800 p-8 h-full hover:border-neutral-500 hover:shadow-[12px_12px_0px_#E63946] transition-all rounded-none">
                      <item.icon className="w-12 h-12 text-[#E63946] mb-8" strokeWidth={1.5} />
                      <h4 className="font-syne font-black text-2xl mb-4">{item.title}</h4>
                      <p className="font-sans text-neutral-400 leading-relaxed text-base">{item.desc}</p>
                    </SpotlightCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: End-to-End Workflow */}
          <section id="workflow" className="py-32 px-4 md:px-8 max-w-7xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-24">
                <h3 className="font-syne text-5xl lg:text-6xl font-black mb-6 tracking-tight">Từ bản thảo đầu tiên<br/>đến quyết định xuất bản</h3>
                <p className="font-sans text-xl text-neutral-600 max-w-2xl mx-auto font-medium border-l-4 border-[#E63946] pl-4">
                  Mọi bước, vai trò và trạng thái đều được tự động hóa và theo dõi trong cùng một Studio.
                </p>
              </div>
            </ScrollReveal>
            
            <div className="relative">
              {/* Animated Connection Line */}
              <div className="hidden lg:block absolute top-[50px] left-[10%] right-[10%] h-2 bg-neutral-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#E63946]"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true, margin: "-200px" }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-4 relative z-10">
                {[
                  { step: "01", name: "Proposal", role: "Mangaka", desc: "Gửi ý tưởng & Storyboard" },
                  { step: "02", name: "Editor Review", role: "Editor", desc: "Kiểm duyệt đề xuất" },
                  { step: "03", name: "Board Voting", role: "Editorial Board", desc: "Bỏ phiếu duyệt series" },
                  { step: "04", name: "Production", role: "Assistant", desc: "Thực hiện task trên page" },
                  { step: "05", name: "Publication", role: "Board / Admin", desc: "Xuất bản & Thống kê" }
                ].map((item, idx) => (
                  <ScrollReveal key={idx} delay={0.2 * idx} className="flex flex-col items-center text-center group cursor-interact" data-cursor-text="STEP">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      className="w-20 h-20 bg-white border-4 border-ink-black rounded-full flex items-center justify-center font-mono font-black text-2xl mb-6 shadow-[6px_6px_0px_#141414] group-hover:bg-[#E63946] group-hover:text-white group-hover:shadow-[6px_6px_0px_#F39C12] transition-colors z-10 relative"
                    >
                      {item.step}
                    </motion.div>
                    <h4 className="font-syne font-black text-2xl mb-2">{item.name}</h4>
                    <span className="font-mono text-[11px] bg-neutral-200 px-3 py-1 rounded-sm uppercase font-black text-neutral-700 mb-4 group-hover:bg-ink-black group-hover:text-white transition-colors">
                      {item.role}
                    </span>
                    <p className="font-sans text-base text-neutral-600 max-w-[180px] leading-relaxed">{item.desc}</p>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5: Role Ecosystem */}
          <section id="roles" className="bg-white py-32 border-y-4 border-ink-black relative overflow-hidden">
            {/* Animated Background Line Pattern */}
            <motion.div 
              className="absolute inset-0 opacity-5 pointer-events-none" 
              style={{ backgroundImage: "repeating-linear-gradient(45deg, #141414 0, #141414 2px, transparent 0, transparent 40px)", backgroundSize: "60px 60px" }}
              animate={{ backgroundPosition: ["0px 0px", "60px 60px"] }}
              transition={{ duration: 5, ease: "linear", repeat: Infinity }}
            />
            
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
              <ScrollReveal>
                <div className="mb-20 flex items-center gap-6">
                  <div className="h-2 flex-1 bg-ink-black shadow-[0_4px_0px_#E63946]"></div>
                  <h3 className="font-serif italic font-bold text-4xl md:text-6xl text-center px-4 tracking-tight">Hệ sinh thái vai trò</h3>
                  <div className="h-2 flex-1 bg-ink-black shadow-[0_4px_0px_#E63946]"></div>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {[
                  { role: "Mangaka", icon: FileSignature, desc: "Đề xuất series mới, theo dõi tiến độ chapter và workflow sáng tác." },
                  { role: "Assistant", icon: PenTool, desc: "Nhận task được giao, tải lên bản vẽ hoàn thiện và theo dõi thu nhập." },
                  { role: "Editor", icon: CheckSquare, desc: "Kiểm duyệt proposal, quản lý production pipeline và review manuscript." },
                  { role: "Editorial Board", icon: Users, desc: "Hội đồng bỏ phiếu, duyệt xuất bản chapter và đưa ra directive cho series." }
                ].map((role, idx) => (
                  <ScrollReveal key={idx} delay={0.15 * idx}>
                    <motion.div 
                      whileHover={{ scale: 1.02, rotateZ: idx % 2 === 0 ? 1 : -1 }}
                      className="bg-manuscript-gray border-4 border-ink-black p-8 md:p-10 motion-surface shadow-[12px_12px_0px_#141414] hover:shadow-[16px_16px_0px_#E63946] flex flex-col sm:flex-row gap-6 items-start h-full group cursor-interact transition-all"
                      data-cursor-text="PLAY"
                    >
                      <div className="bg-white p-5 border-4 border-ink-black shadow-[6px_6px_0px_#141414] group-hover:bg-ink-black group-hover:text-white transition-colors transform group-hover:-translate-y-2 group-hover:-rotate-6">
                        <role.icon className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="font-syne font-black text-3xl md:text-4xl mb-4 tracking-tight group-hover:text-[#E63946] transition-colors">{role.role}</h4>
                        <p className="font-sans text-neutral-700 leading-relaxed text-lg">{role.desc}</p>
                      </div>
                    </motion.div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Series Showcase */}
          <section id="series" className="py-32 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
            <ScrollReveal>
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div>
                  <h3 className="font-syne text-5xl lg:text-6xl font-black mb-4 tracking-tight">Series trong Studio</h3>
                  <p className="font-sans text-xl text-neutral-600 font-medium border-l-4 border-[#F39C12] pl-4">Catalogue manga đang được quản lý và sản xuất.</p>
                </div>
                <button 
                  onClick={() => onNavigateToAuth("login")}
                  className="cursor-interact font-mono text-sm font-black uppercase hover:text-[#E63946] flex items-center gap-2 transition-colors group bg-white border-4 border-ink-black px-6 py-4 shadow-[6px_6px_0px_#141414] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#141414]"
                  data-cursor-text="VIEW ALL"
                >
                  Khám phá Studio <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><ArrowRight className="w-5 h-5" /></motion.div>
                </button>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
              {[
                { title: "One Piece", author: "Eiichiro Oda", cover: "/manga/one-piece/cover.jpg", status: "PUBLISHED" },
                { title: "Doraemon Đại Tuyển Tập", author: "Fujiko F. Fujio", cover: "/manga/doraemon/cover.jpg", status: "PRODUCTION" },
                { title: "Naruto", author: "Masashi Kishimoto", cover: "/manga/naruto/cover.jpg", status: "REVIEW" },
                { title: "JoJo's Bizarre Adventure – Cuộc Phiêu Lưu Bí Ẩn", author: "Hirohiko Araki", cover: "/manga/jojos-bizarre-adventure/cover.jpg", status: "PROPOSAL" },
              ].map((series, idx) => (
                <ScrollReveal key={idx} delay={0.15 * idx}>
                  <motion.div 
                    whileHover={{ y: -12, scale: 1.02 }}
                    className="bg-white border-4 border-ink-black shadow-[12px_12px_0px_#141414] hover:shadow-[16px_16px_0px_#F39C12] transition-all group flex flex-col h-full cursor-interact overflow-hidden"
                    data-cursor-text="READ"
                  >
                    <div className="aspect-[3/4] border-b-4 border-ink-black relative overflow-hidden bg-neutral-200">
                      {series.cover ? (
                        <img src={series.cover} alt={series.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-neutral-400 font-bold bg-neutral-100">NO COVER</div>
                      )}
                      <div className="absolute top-3 left-3 px-3 py-1 bg-white border-2 border-ink-black font-mono text-[10px] font-black uppercase shadow-[4px_4px_0px_#141414] transform group-hover:-rotate-3 transition-transform">
                        {series.status}
                      </div>
                    </div>
                    <div className="p-5 md:p-6 flex flex-col flex-1 bg-white group-hover:bg-neutral-50 transition-colors">
                      <h4 className="font-syne font-black text-xl md:text-2xl leading-tight mb-2 line-clamp-2">{series.title}</h4>
                      <p className="font-sans text-base text-neutral-500 mt-auto font-medium">{series.author}</p>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* Section 7: Feature Highlights & Section 8: Final CTA */}
          <section className="border-t-4 border-ink-black bg-[#E63946] text-white overflow-hidden relative">
            {/* Animated halftone background */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-0 opacity-30 mix-blend-multiply"
              animate={{ backgroundPosition: ["0px 0px", "48px 48px"] }}
              transition={{ duration: 5, ease: "linear", repeat: Infinity }}
              style={{
                backgroundImage: "radial-gradient(#000000 3px, transparent 3px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="max-w-4xl mx-auto px-4 py-40 text-center relative z-10">
              <ScrollReveal>
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Briefcase className="w-20 h-20 mx-auto mb-10 opacity-90 drop-shadow-md" />
                </motion.div>
                <h2 className="font-syne text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight shadow-black drop-shadow-lg" style={{ WebkitTextStroke: "1px #141414" }}>
                  Sẵn sàng bước vào Studio?
                </h2>
                <p className="font-sans text-xl md:text-3xl opacity-90 mb-14 max-w-3xl mx-auto font-bold leading-relaxed">
                  Tham gia quy trình sáng tác manga có tổ chức, minh bạch và chuyên nghiệp ngay hôm nay.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigateToAuth("register")}
                    className="cursor-interact px-12 py-6 bg-white text-ink-black border-4 border-ink-black font-syne text-lg font-black shadow-[10px_10px_0px_#141414] hover:shadow-[4px_4px_0px_#141414] transition-all uppercase tracking-widest"
                    data-cursor-text="JOIN"
                  >
                    Tạo tài khoản
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigateToAuth("login")}
                    className="cursor-interact px-12 py-6 bg-transparent text-white border-4 border-white font-syne text-lg font-black hover:bg-white hover:text-[#E63946] transition-all uppercase tracking-widest"
                    data-cursor-text="LOGIN"
                  >
                    Tôi đã có tài khoản
                  </motion.button>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </main>

        {/* Section 9: Footer */}
        <footer className="bg-ink-black text-neutral-400 py-16 px-4 border-t-2 border-neutral-800 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 select-none grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-interact" data-cursor-text="UP" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="bg-[#E63946] text-white px-2 py-0.5 rounded-none shadow-sm font-syne font-black text-xl">
                Manga
              </span>
              <span className="italic font-serif font-bold text-white text-xl">Studio</span>
            </div>
            <div className="font-mono text-sm text-center md:text-right">
              <p>Manga Creation Workflow and Publishing Management System</p>
              <p className="mt-2 opacity-50">&copy; {new Date().getFullYear()} SE1820_G05. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div>
    </MotionScene>
  );
};
