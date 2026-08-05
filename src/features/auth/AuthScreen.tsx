import React, { useState } from "react";
import { User, UserRole } from "../../types";
import { apiClient } from "../../api/client";
import LoginBackground from "../../components/LoginBackground";
import MotionScene from "../../components/motion/MotionScene";
import LanguageToggle from "../../components/LanguageToggle";
import { useLanguage } from "../../i18n/LanguageContext";
import { Key, Radio, CloudLightning, ArrowLeft } from "lucide-react";

interface AuthScreenProps {
  initialMode?: "login" | "register";
  onLoginSuccess: (user: User, role: UserRole) => void;
  onBackToLanding: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = "login",
  onLoginSuccess,
  onBackToLanding,
}) => {
  const { t } = useLanguage();
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState<UserRole>("MANGAKA");
  const [authVerificationCode, setAuthVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [authStatusMsg, setAuthStatusMsg] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === "register");

  const config = apiClient.getConfig();

  const handleSendCode = async () => {
    if (!authEmail) {
      setAuthStatusMsg(`❌ ${t("Email is required to send code.")}`);
      return;
    }
    setSendingCode(true);
    setAuthStatusMsg("");
    try {
      await apiClient.auth.sendVerificationCode(authEmail);
      setAuthStatusMsg(`🎉 ${t("Verification code sent! Please check your email.")}`);
    } catch (err: any) {
      setAuthStatusMsg(`❌ ${t(err.message)}`);
    } finally {
      setSendingCode(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStatusMsg("");

    try {
      if (isRegisterMode) {
        if (!authName) {
          setAuthStatusMsg(`❌ ${t("Full name is required.")}`);
          return;
        }
        if (!authVerificationCode) {
          setAuthStatusMsg(`❌ ${t("Verification code is required.")}`);
          return;
        }
        const res = await apiClient.auth.register(
          authName,
          authEmail,
          authRole,
          authPassword,
          authVerificationCode,
        );
        onLoginSuccess(res.data, authRole);
      } else {
        const res = await apiClient.auth.login(authEmail, authPassword);
        onLoginSuccess(res.data, res.data.role);
      }
    } catch (err: any) {
      setAuthStatusMsg(`❌ ${t(err.message)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-manuscript-gray">
      {/* Universal Grid backdrop decoration dots */}
      <div
        className="ambient-grid fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#c7c6ca 0.75px, transparent 0.75px)",
          backgroundSize: "24px 24px",
        }}
      />
      <LoginBackground />
      <LanguageToggle className="absolute top-6 right-6 z-20" />
      <button 
        onClick={onBackToLanding}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-white px-4 py-2 font-mono text-xs font-bold uppercase border-2 border-ink-black shadow-[4px_4px_0px_#141414] hover:bg-[#141414] hover:text-white transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("Back to Home")}
      </button>

      <MotionScene sceneKey={isRegisterMode ? "register" : "login"} className="w-full max-w-md relative z-10">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-4 border-ink-black rounded-none p-8 shadow-[8px_8px_0px_#141414] flex flex-col transition-all duration-300">
          {/* Header Title */}
          <div className="text-center mb-8 select-none">
            <h1 className="font-syne text-4xl font-extrabold text-ink-black tracking-tighter flex items-center justify-center gap-2">
              <span className="bg-[#E63946] text-white px-2 py-0.5 rounded-none -rotate-2 shadow-sm font-black">
                Manga
              </span>
              <span className="italic font-serif text-3xl font-bold">
                Studio
              </span>
            </h1>
            <p className="font-sans text-[11px] text-neutral-500 font-extrabold uppercase tracking-widest mt-2">
              {t("Creation & Publication Workflow Admin")}
            </p>
          </div>

          {/* Error or status notifications */}
          {authStatusMsg && (
            <div className="mb-5 p-3 rounded-none bg-[#E63946]/10 border-2 border-[#E63946] text-[#E63946] text-xs font-mono font-bold select-none">
              {authStatusMsg}
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label
                  className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1"
                  htmlFor="fullName"
                >
                  {t("Full Name / Studio Group")}
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="w-full bg-manuscript-gray border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white focus:outline-none rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all"
                  placeholder={t("e.g. Studio Kaze, Yumi Art...")}
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label
                className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1"
                htmlFor="emailAddr"
              >
                {t("Registered Email Address")}
              </label>
              <div className="flex gap-2">
                <input
                  id="emailAddr"
                  type="email"
                  required
                  className="flex-1 bg-manuscript-gray border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white focus:outline-none rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all"
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
                {isRegisterMode && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode}
                    className="bg-ink-black hover:bg-neutral-800 text-white font-syne text-[10px] font-extrabold uppercase px-4 border-2 border-ink-black shadow-[2px_2px_0px_#E63946] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {sendingCode ? t("Sending...") : t("Send Code")}
                  </button>
                )}
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label
                  className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1"
                  htmlFor="verificationCode"
                >
                  {t("Verification Code")}
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  required
                  className="w-full bg-manuscript-gray border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white focus:outline-none rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all font-mono"
                  placeholder={t("Enter 6-digit code")}
                  value={authVerificationCode}
                  onChange={(e) => setAuthVerificationCode(e.target.value)}
                />
              </div>
            )}

            <div>
              <label
                className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1"
                htmlFor="password"
              >
                {t("Password")}
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full bg-manuscript-gray border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white focus:outline-none rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1">
                  {t("MangaFlow Access Role")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      "MANGAKA",
                      "ASSISTANT",
                      "EDITOR",
                      "BOARD_MEMBER",
                      "ADMIN",
                    ] as UserRole[]
                  ).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setAuthRole(role)}
                      className={`py-2 px-3 border-2 font-mono text-[10px] font-extrabold transition-all select-none cursor-pointer rounded-none uppercase ${
                        authRole === role
                          ? "bg-ink-black text-white border-ink-black shadow-[2px_2px_0px_#141414]"
                          : "bg-manuscript-gray text-neutral-600 border-ink-black hover:bg-neutral-100"
                      }`}
                    >
                      {t(role === 'BOARD_MEMBER' ? 'BOARD MEMBER' : role)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#E63946] hover:bg-red-600 text-white font-syne text-xs uppercase font-extrabold tracking-wider py-4 border-2 border-ink-black rounded-none shadow-[4px_4px_0px_#141414] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              {isRegisterMode ? `${t("Register Account")} ➔` : `${t("Sign In")} ➔`}
            </button>
          </form>

          <div className="text-center mt-6 text-xs font-sans text-on-surface-variant font-medium select-none">
            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-neutral-600 font-extrabold hover:text-[#E63946] hover:underline cursor-pointer"
            >
              {isRegisterMode
                ? t("Already have an account? Sign In")
                : t("Don't have an account? Register Profile")}
            </button>
          </div>

          {/* REST status notification details in login screen footer */}
          <div className="mt-8 pt-4 border-t border-dashed border-neutral-300 text-center select-none">
            {config.useLiveBackend ? (
              <span className="text-[9px] font-mono text-[#2ECC71] font-bold inline-flex items-center gap-1">
                <CloudLightning className="w-3" /> {t("Live Node.js MongoDB Connected")}
              </span>
            ) : (
              <span className="text-[9px] font-mono text-neutral-500 font-bold inline-flex items-center gap-1">
                <Radio className="w-3" /> {t("Fallback Client-Side Storage Active")}
              </span>
            )}
          </div>
        </div>
      </MotionScene>
    </div>
  );
};
