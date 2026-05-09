'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';

export interface TopicCardTopic {
  id: string;
  title: string;
  description?: string;
  order?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  levels?: { id: string; order: number; difficulty: string; title?: string; isLocked?: boolean; isCompleted?: boolean }[];
  completionPct?: number;
}

interface TopicCardProps {
  topic: TopicCardTopic;
  isCurrent: boolean;
  onSelectTopic: (topicId: string) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, isCurrent, onSelectTopic }) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      viewport={{ once: true }}
      className={`relative group p-6 rounded-2xl transition-all duration-500 ${
        topic.isLocked 
          ? 'opacity-50 grayscale' 
          : 'glass hover:border-primary/50 cursor-pointer shadow-lg hover:shadow-primary/5'
      } ${isCurrent ? 'border-primary ring-1 ring-primary/20' : ''}`}
    >
        {isCurrent && (
          <div className="absolute -top-3 left-6 px-3 py-1 bg-primary/90 rounded-full text-[10px] font-bold tracking-widest uppercase text-white shadow-lg shadow-primary/20 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            In Progress
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
              {topic.title}
              {topic.isCompleted && <CheckCircle2 className="w-5 h-5 text-success" />}
              {topic.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{topic.description}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white/10 group-hover:text-primary/10 transition-colors">
              0{topic.order}
            </span>
          </div>
        </div>

        {/* Completion Progress */}
        {!topic.isLocked && (
          <div className="mt-4 space-y-1">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                style={{ width: `${topic.completionPct ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-white/25 uppercase tracking-widest font-bold">
                {topic.isCompleted ? 'Completed' : `${topic.completionPct ?? 0}% complete`}
              </span>
              {topic.isCompleted && <CheckCircle2 className="w-3 h-3 text-success" />}
            </div>
          </div>
        )}



        {!topic.isLocked && !topic.isCompleted && (
          <button
            onClick={() => onSelectTopic(topic.id)}
            className="w-full mt-4 flex items-center justify-center gap-1 py-3 text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
          >
            Start Practice <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </motion.div>
  );
};
