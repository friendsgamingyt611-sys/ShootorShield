
import React, { useEffect } from 'react';
import { Achievement } from '../../types';
import { Trophy } from 'lucide-react';

interface AchievementToastProps {
    achievement: Achievement;
    onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [achievement, onClose]);

    const tierColors = {
        'BRONZE': 'border-orange-700 bg-orange-950 text-orange-200',
        'SILVER': 'border-gray-400 bg-gray-800 text-gray-200',
        'GOLD': 'border-yellow-500 bg-yellow-900 text-yellow-200',
        'PLATINUM': 'border-cyan-400 bg-cyan-900 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-500 pointer-events-none">
            <div className={`flex items-center gap-4 p-4 rounded-xl border-2 shadow-2xl backdrop-blur-md ${tierColors[achievement.tier]}`}>
                <div className="text-4xl animate-bounce">{achievement.icon}</div>
                <div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1">
                        <Trophy size={10} /> {achievement.tier} UNLOCKED
                    </div>
                    <div className="text-xl font-black italic">{achievement.name}</div>
                    <div className="text-xs opacity-80 font-mono">{achievement.description}</div>
                </div>
            </div>
        </div>
    );
};
