"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  RelationshipLevel,
  useRelationship,
} from "@/contexts/relationship-context";
import { Flame, Beer, Snowflake } from "lucide-react";
import { useState } from "react";

interface RelationshipButtonProps {
  userId: string;
  compact?: boolean;
}

export function RelationshipButton({
  userId,
  compact = false,
}: RelationshipButtonProps) {
  const { getRelationship, setRelationship } = useRelationship();
  const [showMenu, setShowMenu] = useState(false);
  const currentLevel = getRelationship(userId);

  const levels: {
    level: RelationshipLevel;
    icon: typeof Flame;
    label: string;
    color: string;
    bgColor: string;
  }[] = [
    {
      level: "HOT",
      icon: Flame,
      label: "HOT",
      color: "text-red-600",
      bgColor: "bg-red-100 hover:bg-red-200",
    },
    {
      level: "NORMAL",
      icon: Beer,
      label: "NORMAL",
      color: "text-blue-600",
      bgColor: "bg-blue-100 hover:bg-blue-200",
    },
    {
      level: "BLOCK",
      icon: Snowflake,
      label: "BLOCK",
      color: "text-gray-600",
      bgColor: "bg-gray-100 hover:bg-gray-200",
    },
  ];

  const handleSelect = (level: RelationshipLevel) => {
    setRelationship(userId, level);
    setShowMenu(false);
  };

  const currentConfig = levels.find((l) => l.level === currentLevel);
  const Icon = currentConfig?.icon || Beer;

  if (compact) {
    return (
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMenu(!showMenu)}
          className={`p-2 rounded-full ${currentConfig?.bgColor} transition-colors`}
        >
          <Icon size={18} className={currentConfig?.color} />
        </motion.button>

        <AnimatePresence>
          {showMenu && (
            <>
              {/* オーバーレイ */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />

              {/* メニュー */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl p-2 z-50 min-w-[150px]"
              >
                {levels.map((config) => {
                  const LevelIcon = config.icon;
                  return (
                    <motion.button
                      key={config.level}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(config.level)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                        currentLevel === config.level
                          ? config.bgColor
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <LevelIcon size={18} className={config.color} />
                      <span className="text-sm font-medium">
                        {config.label}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full size button
  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentConfig?.bgColor} transition-colors`}
      >
        <Icon size={20} className={currentConfig?.color} />
        <span className={`font-medium ${currentConfig?.color}`}>
          {currentConfig?.label}
        </span>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* オーバーレイ */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* メニュー */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl p-3 z-50 min-w-[200px]"
            >
              <p className="text-xs text-gray-600 mb-2 px-2">好感度を設定</p>
              {levels.map((config) => {
                const LevelIcon = config.icon;
                return (
                  <motion.button
                    key={config.level}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(config.level)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-2 last:mb-0 ${
                      currentLevel === config.level
                        ? config.bgColor
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <LevelIcon size={24} className={config.color} />
                    <div className="flex-1 text-left">
                      <div className={`font-bold ${config.color}`}>
                        {config.label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {config.level === "HOT" && "優先表示"}
                        {config.level === "NORMAL" && "通常表示"}
                        {config.level === "BLOCK" && "非表示"}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
