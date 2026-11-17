import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Info, Zap, RefreshCw, BarChart } from 'lucide-react';
import { Signal } from '../types';

interface SignalCardProps {
  signal: Signal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isLong = signal.type.includes('LONG');
  const isShort = signal.type.includes('SHORT');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-[#080808] border border-white/10 p-6 relative overflow-hidden transition-all duration-300 hover:border-white/30 group ${
        signal.type !== 'NEUTRAL' ? (isLong ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500') : ''
      }`}
    >
      {/* Header Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-black tracking-tighter leading-none">{signal.symbol.replace('USDT', '')}</h3>
          <div className="flex items-center gap-1.5 mt-1 border-b border-white/5 pb-1">
             <span className={`w-2 h-0.5 ${
               signal.regime === 'TREND_UP' ? 'bg-green-400' :
               signal.regime === 'TREND_DOWN' ? 'bg-red-400' :
               signal.regime === 'MEAN_REV' ? 'bg-blue-400' : 'bg-white/20'
             }`} />
             <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">{signal.regime.replace('_', ' ')}</p>
          </div>
        </div>
        {signal.type !== 'NEUTRAL' && (
          <div className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
            isLong ? 'text-green-500' : 'text-red-500'
          }`}>
            {signal.type.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* Main Signal Display */}
      <div className="mb-8">
        <div className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">Index Price</div>
        <p className="text-3xl font-black italic tracking-tighter leading-none">
          ${signal.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <div className={`flex items-center gap-1 mt-2 text-[10px] font-black tracking-widest ${signal.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {signal.change24h >= 0 ? '▲' : '▼'} {Math.abs(signal.change24h).toFixed(2)}%
        </div>
      </div>

      {/* Technicals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Efficiency</p>
          <div className="flex items-center gap-2">
            <span className={`text-base font-black ${signal.indicators.cmf > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(signal.indicators.cmf * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">RSI (14)</p>
          <div className="flex items-center justify-end gap-2">
             <span className={`text-base font-black ${signal.indicators.rsi > 70 ? 'text-red-500' : signal.indicators.rsi < 30 ? 'text-green-500' : 'text-white'}`}>
               {signal.indicators.rsi.toFixed(1)}
             </span>
          </div>
        </div>
      </div>

      {/* Visual Glitch/Accents */}
      <div className={`absolute top-0 right-0 w-16 h-1 bg-gradient-to-l ${
        isLong ? 'from-green-500' : isShort ? 'from-red-500' : 'from-white/10'
      } to-transparent opacity-50`} />

      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
         <span className="text-[10px] font-black uppercase tracking-[.3em] bg-black px-4 py-2 border border-white/20">Analyze Logic Matrix</span>
      </div>
    </motion.div>
  );
};
