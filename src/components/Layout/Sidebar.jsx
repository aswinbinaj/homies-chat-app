import React from 'react';
import { X, Shield } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import { formatLastSeen } from '../../utils/formatters';

export const Sidebar = ({
  isOpen,
  onClose,
  allMembers = [],
  onlineUsers = [],
  currentUserId,
}) => {
  if (!isOpen) return null;

  // Build a map of online user IDs
  const onlineMap = new Set(onlineUsers.map((u) => u.user_id));

  // Separate online vs offline members
  const onlineList = allMembers.filter((m) => onlineMap.has(m.id));
  const offlineList = allMembers.filter((m) => !onlineMap.has(m.id));

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xs bg-white dark:bg-[#0c0c0e] border-l border-gray-200 dark:border-zinc-800/80 h-full flex flex-col z-50 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">
              Group Members ({allMembers.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {onlineUsers.length} online now
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Online Section */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-3 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online ({onlineList.length})
            </div>
            {onlineList.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 italic pl-3">
                No friends online right now
              </p>
            ) : (
              <ul className="space-y-1.5">
                {onlineList.map((member) => {
                  const isYou = member.id === currentUserId;
                  const avatarBg = getAvatarColor(member.username);
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#141417] border border-gray-100 dark:border-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white/10 ${avatarBg}`}>
                            {getInitials(member.username)}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c0c0e]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate">
                              {member.username}
                            </span>
                            {isYou && (
                              <span className="text-[10px] text-gray-400 font-normal">
                                (You)
                              </span>
                            )}
                            {member.is_admin && (
                              <Shield className="w-3 h-3 text-indigo-400 shrink-0" title="Admin" />
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-500 font-medium">
                            Online
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Offline Section */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3 select-none">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              Offline ({offlineList.length})
            </div>
            {offlineList.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 italic pl-3">
                Everyone is online!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {offlineList.map((member) => {
                  const isYou = member.id === currentUserId;
                  const avatarBg = getAvatarColor(member.username);
                  return (
                    <li
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#111114] border border-gray-100 dark:border-zinc-800/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold opacity-75 ring-1 ring-white/5 ${avatarBg}`}>
                            {getInitials(member.username)}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-zinc-600 ring-2 ring-white dark:ring-[#0c0c0e]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 truncate">
                              {member.username}
                            </span>
                            {isYou && (
                              <span className="text-[10px] text-gray-400 font-normal">
                                (You)
                              </span>
                            )}
                            {member.is_admin && (
                              <Shield className="w-3 h-3 text-indigo-400 shrink-0" title="Admin" />
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                            {formatLastSeen(member.last_seen)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
