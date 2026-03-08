"use client";

import { motion } from "framer-motion";
import { Note } from "@/lib/mock-data";
import Image from "next/image";

interface NotesScrollProps {
  notes: Note[];
}

export function NotesScroll({ notes }: NotesScrollProps) {
  return (
    <div className="w-full overflow-hidden bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              className="flex-shrink-0"
            >
              <NoteItem note={note} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteItem({ note }: { note: Note }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* 吹き出し */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.2,
        }}
        whileHover={{ scale: 1.05, y: -2 }}
        className="relative mb-2 px-3 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] rounded-2xl shadow-md"
      >
        <p className="text-white text-xs font-medium whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
          {note.message}
        </p>
        {/* 吹き出しの三角形 */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#845EF7]" />
      </motion.div>

      {/* アバター */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#FF6B6B] ring-offset-2 cursor-pointer">
          <Image
            src={note.avatarUrl}
            alt={note.username}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        {/* オンラインインジケーター */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            delay: 0.3,
          }}
          className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
        />
      </motion.div>

      {/* ユーザー名 */}
      <p className="mt-1 text-xs font-medium text-gray-700 truncate max-w-[80px]">
        {note.username}
      </p>
    </div>
  );
}
