import React from 'react';
import { ModuleConfig } from '../types';
import { Icons } from './ui/Icons';

interface ModuleCardProps {
  config: ModuleConfig;
  total: number;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ config, total, onClick }) => {
  const IconComponent = (Icons as any)[config.icon] || Icons.Wallet;

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden p-6 rounded-2xl bg-white shadow-sm border border-slate-100 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${config.color}-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className={`p-3 w-fit rounded-xl bg-${config.color}-100 text-${config.color}-600 mb-4`}>
            <IconComponent size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{config.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{config.description}</p>
        </div>
        
        <div className="mt-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Acumulado</p>
          <p className={`text-2xl font-bold text-${config.color}-600`}>
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};