/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  User, 
  Save, 
  RotateCcw, 
  ArrowLeft, 
  Check, 
  Settings, 
  Info,
  BookOpen,
  FileText,
  CheckSquare,
  Award,
  Users
} from "lucide-react";
import { User as UserType, UserRole } from "../types";
import { 
  RolePermissions, 
  ROLE_PERMISSIONS, 
  getPermissions, 
  savePermissions, 
  resetPermissionsToDefault 
} from "../auth/permissions";

interface RolePermissionManagerProps {
  currentUser: UserType | null;
  users: UserType[];
  onUpdateUsers: (updatedUsers: UserType[]) => void;
  onPermissionsChanged: () => void;
  onBackToDashboard: () => void;
}

const ALL_ROLES: UserRole[] = ["MANGAKA", "ASSISTANT", "EDITOR", "BOARD_MEMBER"];

const PERMISSION_KEYS: { key: keyof RolePermissions; label: string; desc: string; category: string }[] = [
  // Series
  { key: "canProposeSeries", label: "Đề xuất Series", desc: "Cho phép tạo đề án truyện mới và nộp bản nháp", category: "Series" },
  { key: "canReviewSeriesAsEditor", label: "Editor duyệt Đề xuất", desc: "Xem xét, yêu cầu sửa đổi hoặc gửi Board phê duyệt", category: "Series" },
  { key: "canVoteSeries", label: "Bỏ phiếu Hội đồng", desc: "Hội đồng biểu quyết đồng thuận xuất bản hoặc huỷ", category: "Series" },
  { key: "canCancelSeries", label: "Hủy/dừng Series", desc: "Quyết định xoá bỏ hoặc ngừng sản xuất tác phẩm", category: "Series" },
  
  // Chapters
  { key: "canCreateChapter", label: "Khai báo Chapter", desc: "Tạo các chapter mới gắn liền với đầu sách", category: "Chapters" },
  { key: "canManageChapters", label: "Quản lý Chapter", desc: "Chỉnh sửa thông tin, đặt deadline do Editor điều khiển", category: "Chapters" },
  { key: "canPublishChapter", label: "Xuất bản Chapter", desc: "Chốt hoàn thành và phát hành chapter tới công chúng", category: "Chapters" },
  { key: "canChangePubSchedule", label: "Đổi Tần suất phát hành", desc: "Điều phối chế độ phát hành hàng tuần/hàng tháng", category: "Chapters" },
  
  // Tasks & Manuscripts
  { key: "canAssignTask", label: "Giao việc cho Assistant", desc: "Mangaka phân công các task vẽ tranh cho trợ lý", category: "Tasks & Manuscripts" },
  { key: "canSubmitTask", label: "Nộp thành phẩm Task", desc: "Assistant nộp kết quả công việc hoàn thành", category: "Tasks & Manuscripts" },
  { key: "canReviewManuscript", label: "Duyệt bản thảo Trợ lý", desc: "Mangaka phê chuẩn hoặc bắt sửa bài làm của trợ lý", category: "Tasks & Manuscripts" },
  { key: "canRequestDraftEdits", label: "Yêu cầu sửa bản nháp", desc: "Editor yêu cầu Mangaka viết lại phác thảo", category: "Tasks & Manuscripts" },
  
  // Ratings & Progress
  { key: "canViewOwnRankings", label: "Xem Xếp hạng cá nhân", desc: "Chỉ xem các thứ hạng của series do mình sáng tác", category: "Ratings & Progress" },
  { key: "canViewAllRankings", label: "Xem toàn bộ Xếp hạng", desc: "Xem leaderboard đầy đủ của toàn bộ 20 bộ truyện", category: "Ratings & Progress" },
  { key: "canSubmitRatings", label: "Nhập liệu Survey & Vote", desc: "Hội đồng nhập phiếu khảo sát độc giả để tính rank", category: "Ratings & Progress" },
  { key: "canViewStudioProgress", label: "Xem tiến độ Studio", desc: "Theo dõi % hoàn thành của các series trong sản xuất", category: "Ratings & Progress" },
];

const TAB_OPTIONS: { value: string; label: string }[] = [
  { value: "kanban", label: "Quy trình Task & Trợ lý" },
  { value: "reviews", label: "Duyệt Series & Trạng thái" },
  { value: "ratings", label: "Bảng xếp hạng & Rating" },
  { value: "chapters", label: "Quản lý Chapter" }
];

const FORM_OPTIONS: { value: string; label: string }[] = [
  { value: "proposal", label: "Đề xuất Manga Mới" },
  { value: "chapter", label: "Khai báo Chapter" },
  { value: "task", label: "Giao việc Assistant" }
];

export const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({
  currentUser,
  users,
  onUpdateUsers,
  onPermissionsChanged,
  onBackToDashboard
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("MANGAKA");
  const [permissionsState, setPermissionsState] = useState<Record<UserRole, RolePermissions>>(() => {
    const state: any = {};
    ALL_ROLES.forEach(r => {
      state[r] = { ...getPermissions(r) };
    });
    return state;
  });

  const [usersState, setUsersState] = useState<UserType[]>(users);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync users state with props
  useEffect(() => {
    setUsersState(users);
  }, [users]);

  const handlePermissionToggle = (role: UserRole, key: keyof RolePermissions) => {
    setPermissionsState(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key]
      }
    }));
  };

  const handleTabToggle = (role: UserRole, tab: string) => {
    const currentTabs = permissionsState[role].taskBoardTabs;
    let newTabs: any[];
    if (currentTabs.includes(tab as any)) {
      newTabs = currentTabs.filter(t => t !== tab);
    } else {
      newTabs = [...currentTabs, tab];
    }
    
    setPermissionsState(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        taskBoardTabs: newTabs,
        defaultTaskBoardTab: newTabs.includes(prev[role].defaultTaskBoardTab) 
          ? prev[role].defaultTaskBoardTab 
          : (newTabs[0] || "kanban")
      }
    }));
  };

  const handleFormToggle = (role: UserRole, formTab: string) => {
    const currentForms = permissionsState[role].createFormTabs;
    let newForms: any[];
    if (currentForms.includes(formTab as any)) {
      newForms = currentForms.filter(f => f !== formTab);
    } else {
      newForms = [...currentForms, formTab];
    }

    setPermissionsState(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        createFormTabs: newForms,
        defaultCreateTab: newForms.includes(prev[role].defaultCreateTab)
          ? prev[role].defaultCreateTab
          : (newForms[0] || "proposal")
      }
    }));
  };

  const handleUserRoleChange = (userId: string, newRole: UserRole) => {
    const updated = usersState.map(u => {
      if (u._id === userId) {
        let avatar = u.avatar || u.name.substring(0,2).toUpperCase();
        return { ...u, role: newRole, avatar };
      }
      return u;
    });
    setUsersState(updated);
    onUpdateUsers(updated);
    
    showToast("Đã cập nhật vai trò thành viên thành công!");
  };

  const handleSave = () => {
    savePermissions(permissionsState);
    onPermissionsChanged();
    showToast("Đã lưu cấu hình phân quyền động thành công!");
  };

  const handleReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục toàn bộ phân quyền về cài đặt mặc định ban đầu không?")) {
      resetPermissionsToDefault();
      const defaultState: any = {};
      ALL_ROLES.forEach(r => {
        defaultState[r] = { ...ROLE_PERMISSIONS[r] };
      });
      setPermissionsState(defaultState);
      onPermissionsChanged();
      showToast("Đã khôi phục cài đặt phân quyền mặc định!");
    }
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const activePermissions = permissionsState[selectedRole];

  return (
    <div className="bg-zinc-50 min-h-screen p-6" id="permission-manager-container">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg border border-zinc-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Title Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors mb-2 cursor-pointer outline-none"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
          </button>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-zinc-800" />
            Quản trị & Phân quyền Vai trò Động (RBAC Manager)
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Điều chỉnh trực quan quyền năng của các vai trò và gán vai trò trực tiếp cho thành viên. Dữ liệu tự động đồng bộ hóa.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Reset Mặc Định
          </button>
          <button
            onClick={handleSave}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" /> Lưu Cấu Hình
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Role Selector & Mock Users (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Role selector panel */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-zinc-650" /> Chọn Vai Trò Điều Chỉnh
            </h3>
            
            <div className="space-y-2">
              {ALL_ROLES.map((role) => {
                const isSelected = selectedRole === role;
                const rolePerms = permissionsState[role];
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${
                      isSelected 
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-xs" 
                        : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{rolePerms.label}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 rounded uppercase ${
                          isSelected ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-650"
                        }`}>
                          {role}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                        {rolePerms.description}
                      </p>
                    </div>
                    <Check className={`w-4 h-4 shrink-0 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Role Assignment panel */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-zinc-650" /> Phân Vai Trò Cho Thành Viên
            </h3>

            <div className="space-y-3.5">
              {usersState.map((user) => (
                <div key={user._id} className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      user.role === "MANGAKA" ? "bg-orange-100 text-orange-850" :
                      user.role === "EDITOR" ? "bg-blue-100 text-blue-850" :
                      user.role === "BOARD_MEMBER" ? "bg-purple-100 text-purple-855" :
                      "bg-teal-100 text-teal-850"
                    }`}>
                      {user.avatar || user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <select
                    value={user.role}
                    onChange={(e) => handleUserRoleChange(user._id, e.target.value as UserRole)}
                    className="text-[10px] font-bold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg py-1 px-2 pr-6 cursor-pointer focus:ring-1 focus:ring-zinc-950 outline-none shrink-0"
                  >
                    <option value="MANGAKA">Mangaka</option>
                    <option value="ASSISTANT">Trợ lý (Assistant)</option>
                    <option value="EDITOR">Editor</option>
                    <option value="BOARD_MEMBER">Hội đồng (Board)</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-150 text-[10px] text-zinc-500 leading-normal flex gap-2">
              <Info className="w-4 h-4 text-zinc-450 shrink-0 mt-0.5" />
              <span>
                Thay đổi vai trò của thành viên ở đây sẽ lập tức đồng bộ với danh sách tài khoản ở thanh Header. Thử đổi Lan Chi thành <strong>Mangaka</strong> để mở khoá dashboard tác giả!
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Permissions Matrix Config (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Permission list card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
            <div className="border-b border-zinc-25 mb-4 pb-3 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Quyền hạn cho vai trò: <span className="text-zinc-700 underline underline-offset-4">{activePermissions.label}</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">Bật/tắt các hành động cụ thể mà vai trò này được phép thực thi.</p>
              </div>
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded border border-zinc-200/60 font-mono">
                {selectedRole}
              </span>
            </div>

            {/* Categorized Permissions */}
            <div className="space-y-6">
              {["Series", "Chapters", "Tasks & Manuscripts", "Ratings & Progress"].map((category) => {
                const categoryPermissions = PERMISSION_KEYS.filter(p => p.category === category);
                return (
                  <div key={category} className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">{category}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map((item) => {
                        const isChecked = activePermissions[item.key] as boolean;
                        return (
                          <div 
                            key={item.key} 
                            onClick={() => handlePermissionToggle(selectedRole, item.key)}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked 
                                ? "border-zinc-300 bg-zinc-50/50" 
                                : "border-zinc-100 bg-white hover:border-zinc-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 rounded border-zinc-350 text-zinc-950 focus:ring-zinc-900 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <p className="text-xs font-bold text-zinc-900">{item.label}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Task Board Tabs Selectors */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Các Tab Bảng Công Việc được phép xem</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TAB_OPTIONS.map((tab) => {
                    const isChecked = activePermissions.taskBoardTabs.includes(tab.value as any);
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => handleTabToggle(selectedRole, tab.value)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isChecked
                            ? "bg-zinc-900 border-zinc-900 text-white shadow-2xs"
                            : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Create Form Tabs Selectors */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Các Tab Biểu Mẫu Tạo Mới (Create Form)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {FORM_OPTIONS.map((form) => {
                    const isChecked = activePermissions.createFormTabs.includes(form.value as any);
                    return (
                      <button
                        key={form.value}
                        type="button"
                        onClick={() => handleFormToggle(selectedRole, form.value)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isChecked
                            ? "bg-zinc-900 border-zinc-900 text-white shadow-2xs"
                            : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                        {form.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
