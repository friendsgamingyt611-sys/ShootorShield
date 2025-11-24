
import React from 'react';
import { User } from 'lucide-react';
import { CHARACTERS } from '../../constants';

interface CharacterSelectProps {
  inputName: string;
  setInputName: (val: string) => void;
  selectedCharIndex: number;
  setSelectedCharIndex: (idx: number) => void;
  onConfirm: () => void;
  randomNamePlaceholder: string;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ 
  inputName, setInputName, selectedCharIndex, setSelectedCharIndex, onConfirm, randomNamePlaceholder 
}) => {
  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
      <h2 className="text-center text-3xl font-bold text-white mb-8 tracking-wider">IDENTITY SELECTION</h2>
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1 bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
            <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2">Enter Callsign</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="text" 
                value={inputName} 
                onChange={(e) => setInputName(e.target.value)}
                placeholder={randomNamePlaceholder}
                className="w-full bg-black border border-gray-700 rounded py-3 pl-10 pr-4 text-blue-400 font-mono focus:outline-none focus:border-blue-500 uppercase tracking-wider"
              />
            </div>
            <p className="text-gray-600 text-[10px] mt-2">*Leave empty for system assigned handle.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {CHARACTERS.map((char, index) => (
            <button 
              key={char.id}
              onClick={() => setSelectedCharIndex(index)}
              className={`relative p-6 rounded-xl border-2 transition-all text-left group overflow-hidden ${
                selectedCharIndex === index 
                ? `border-white bg-gradient-to-b ${char.bgGradient} scale-105 shadow-2xl` 
                : 'border-gray-800 bg-black/50 hover:border-gray-600 opacity-60 hover:opacity-100'
              }`}
            >
              <div className={`mb-4 ${char.color}`}>
                <div className="text-4xl font-bold">{char.name}</div>
                <div className="text-xs uppercase tracking-widest opacity-80">{char.role}</div>
              </div>
              <p className="text-gray-300 text-xs font-mono leading-relaxed">{char.description}</p>
              {selectedCharIndex === index && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
              )}
            </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button onClick={onConfirm} className="px-12 py-4 bg-white text-black font-bold text-xl rounded hover:bg-gray-200 transition-colors shadow-[0_0_25px_rgba(255,255,255,0.3)] tracking-widest">
          CONFIRM LOADOUT
        </button>
      </div>
    </div>
  );
};
