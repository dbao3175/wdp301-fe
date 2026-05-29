/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Wifi, 
  WifiOff, 
  Settings, 
  User as UserIcon, 
  Server, 
  Sparkles, 
  Database,
  Lock,
  LogOut,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { User } from "../types";
import { MOCK_USERS, getRoleBadgeColor } from "../data";

interface HeaderProps {
  connectionMode: "sandbox" | "backend";
  backendUrl: string;
  isBackendConnected: boolean;
  currentUser: User | null;
  isLoadingAuth: boolean;
  onConnectionModeChange: (mode: "sandbox" | "backend") => void;
  onBackendUrlChange: (url: string) => void;
  onUserSwitch: (user: User) => void;
  onLogout: () => void;
  onManualLogin: (email: string, password: string) => Promise<void>;
  onManualRegister: (name: string, email: string, password: string, role: "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD_MEMBER") => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  connectionMode,
  backendUrl,
  isBackendConnected,
  currentUser,
  isLoadingAuth,
  onConnectionModeChange,
  onBackendUrlChange,
  onUserSwitch,
  onLogout,
  onManualLogin,
  onManualRegister,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(backendUrl);

  // Manual Auth Modal States
  const [showManualAuth, setShowManualAuth] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState<"MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD_MEMBER">("MANGAKA");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        if (!authName || !authEmail || !authPassword) {
          throw new Error("Vui lòng nhập đầy đủ Name, Email và Password.");
        }
        await onManualRegister(authName, authEmail, authPassword, authRole);
        setAuthSuccess("Đăng ký & đăng nhập thành công!");
        setShowManualAuth(false);
        // Clear forms
        setAuthName("");
        setAuthEmail("");
        setAuthPassword("");
      } else {
        if (!authEmail || !authPassword) {
          throw new Error("Vui lòng nhập đầy đủ Email và Password.");
        }
        await onManualLogin(authEmail, authPassword);
        setAuthSuccess("Đăng nhập thành công!");
        setShowManualAuth(false);
        // Clear forms
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err: any) {
      setAuthError(err.message || "Gặp sự cố khi xác thực, vui lòng kiểm tra lại backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onBackendUrlChange(tempUrl);
    setShowConfig(false);
  };

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-xs" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center font-bold text-white text-lg tracking-wider border border-zinc-800">
              M
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-bold text-zinc-900 tracking-tight text-base sm:text-lg">
                  WDP301 Manga Board
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  REALTIME
                </span>
              </div>
              <p className="text-xs text-zinc-500 hidden sm:block">Manga Workspace & Workflow Dashboard</p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Connection Mode Status */}
            <div className="hidden md:flex items-center gap-2">
              {connectionMode === "sandbox" ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cát Lún (Sandbox Sim)</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5"></span>
                </div>
              ) : (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  isBackendConnected 
                    ? "bg-indigo-50 text-indigo-800 border-indigo-100" 
                    : "bg-rose-50 text-rose-800 border-rose-100"
                }`}>
                  <Server className="w-3.5 h-3.5" />
                  <span>Real Backend: {isBackendConnected ? "Thông suốt" : "Ngoại tuyến"}</span>
                  <span className={`inline-block w-2 h-2 rounded-full ml-0.5 ${
                    isBackendConnected ? "bg-indigo-500 animate-pulse" : "bg-rose-500"
                  }`}></span>
                </div>
              )}
            </div>

            {/* User Profile Selector (Simulate JWT Login dynamically) */}
            <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-xl border border-zinc-200/80">
              <span className="text-[11px] font-semibold text-zinc-500 pl-2 hidden lg:inline">Đăng nhập vai trò:</span>
              <select
                id="role-switch-select"
                value={currentUser?._id || ""}
                onChange={(e) => {
                  const targetUsr = MOCK_USERS.find(u => u._id === e.target.value);
                  if (targetUsr) onUserSwitch(targetUsr);
                }}
                disabled={isLoadingAuth}
                className="text-xs font-semibold bg-transparent border-0 focus:ring-0 text-zinc-800 cursor-pointer outline-none py-1 pr-8 disabled:opacity-50"
              >
                {!currentUser && <option value="">Chọn TK để Test...</option>}
                {MOCK_USERS.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>

              {/* Loader or role badge */}
              {isLoadingAuth ? (
                <div className="w-6 h-6 rounded-lg bg-zinc-200 flex items-center justify-center animate-spin">
                  <RefreshCw className="w-3 h-3 text-zinc-600" />
                </div>
              ) : currentUser ? (
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ring-2 ring-zinc-200 shrink-0 ${
                  currentUser.role === "MANGAKA" ? "bg-amber-600 text-white" :
                  currentUser.role === "EDITOR" ? "bg-blue-600 text-white" :
                  currentUser.role === "BOARD_MEMBER" ? "bg-purple-600 text-white" :
                  "bg-teal-600 text-white"
                }`} title={`JWT Token: ${currentUser.token ? "Có sẵn" : "Không có"}`}>
                  {currentUser.avatar}
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-zinc-300 text-zinc-600 flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Manual Auth Active lock */}
            <button
              id="manual-auth-trigger-btn"
              onClick={() => {
                setShowManualAuth(true);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="p-2 px-3 rounded-xl border border-zinc-200 text-zinc-650 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-xs"
              title="Đăng ký hoặc Đăng nhập Tài khoản thực tế của bạn"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Auth Thực tế</span>
            </button>

            {/* Quick config triggering gear */}
            <button
              id="settings-trigger-btn"
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl border text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-all cursor-pointer ${
                showConfig ? "bg-zinc-100 border-zinc-300 ring-2 ring-zinc-200" : "border-zinc-200"
              }`}
              title="Định cấu hình Server Cổng 3000 / 5000"
            >
              <Settings className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Configurations Dropdown Panel */}
        {showConfig && (
          <div className="border-t border-zinc-200 py-4 animate-in fade-in slide-in-from-top-2 duration-150" id="config-panel">
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-700" />
                Thiết lập liên kết hệ thống WDP301
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Connection Mode Selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Cách thức hoạt động</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="opt-sandbox-mode"
                      onClick={() => onConnectionModeChange("sandbox")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        connectionMode === "sandbox"
                          ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Mầm Cát (Sandbox Sim)
                    </button>
                    <button
                      type="button"
                      id="opt-backend-mode"
                      onClick={() => onConnectionModeChange("backend")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        connectionMode === "backend"
                          ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <Server className="w-3.5 h-3.5" />
                      Localhost API / Socket
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    {connectionMode === "sandbox" 
                      ? "Môi trường Sandbox không cần backend. Trạng thái series, chapter, task và socket.io được giả lập hoàn hảo." 
                      : "Sử dụng khi bạn chạy dự án NodeJS / MongoDB cục bộ. FE sẽ tự động gửi kèm JWT Token trong tiêu đề Bearer!"}
                  </p>
                </div>

                {/* API & websocket URL */}
                <div>
                  <form onSubmit={handleSaveUrl}>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                      URL Backend đang chạy (Cổng BE quy định, thường là 3000 hoặc 5000)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="form-backend-url"
                        type="text"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        disabled={connectionMode === "sandbox"}
                        placeholder="http://localhost:3000"
                        className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-zinc-900 outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                      />
                      <button
                        type="submit"
                        disabled={connectionMode === "sandbox"}
                        className="py-1.5 px-3 rounded-lg text-xs bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-300 font-bold transition-colors cursor-pointer"
                      >
                        Lưu URL
                      </button>
                    </div>
                  </form>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      🔑 Bearer JWT Token: <span className="font-mono text-[10px] text-zinc-700 bg-zinc-200/60 px-1 py-0.5 rounded truncate max-w-[200px]" title={currentUser?.token || "Không có"}>
                        {currentUser?.token ? `${currentUser.token.substring(0, 15)}...` : "Chưa đăng nhập"}
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5 ml-0 sm:ml-auto">
                      Đồng bộ Sockets: <span className="text-indigo-600 font-bold">Lắng nghe sự kiện thực tế</span>
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Manual Authenticate Modal overlay */}
        {showManualAuth && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-zinc-200 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 relative">
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-zinc-700" />
                    {isRegistering ? "ĐĂNG KÝ USER MỚI" : "ĐĂNG NHẬP THỰC TẾ"}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {isRegistering 
                      ? "Tạo một tài khoản Mongo và tự động đăng nhập." 
                      : "Sử dụng email & mật khẩu đã đăng ký trên Backend."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualAuth(false)}
                  className="text-zinc-400 hover:text-zinc-650 text-xs font-bold cursor-pointer hover:text-zinc-900"
                >
                  ✕
                </button>
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-150 text-[11px] text-rose-800 font-bold leading-normal">
                  ⚠️ {authError}
                </div>
              )}

              {authSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-150 text-[11px] text-emerald-800 font-bold leading-normal">
                  ✔ {authSuccess}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {isRegistering && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">Tên Hiển Thị (Name)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Eiichiro Oda"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-1">Địa Chỉ Email</label>
                  <input
                    type="email"
                    required
                    placeholder="vidu@test.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-1">Mật Khẩu</label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập tối thiểu 6 ký tự..."
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none"
                  />
                </div>

                {isRegistering && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">Phân quyền Vai trò (Role)</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as any)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-zinc-950 outline-none pr-8"
                    >
                      <option value="MANGAKA">MANGAKA (Tác giả)</option>
                      <option value="ASSISTANT">ASSISTANT (Trợ lý)</option>
                      <option value="EDITOR">EDITOR (Biên tập viên)</option>
                      <option value="BOARD_MEMBER">BOARD_MEMBER (Hội đồng duyệt)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 rounded-lg text-xs bg-zinc-950 text-white font-bold hover:bg-zinc-850 transition-colors cursor-pointer disabled:bg-zinc-300 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : isRegistering ? "Gửi Yêu Cầu Đăng Ký" : "Đăng Nhập Hoạt Động"}
                </button>
              </form>

              <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] font-sans">
                <span className="text-zinc-500">
                  {isRegistering ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {isRegistering ? "Đổi sang Đăng nhập" : "Tạo tài khoản mới"}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </header>
  );
};
