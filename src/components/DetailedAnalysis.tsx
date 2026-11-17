import React from 'react';
import { motion } from 'motion/react';
import { Signal, DetailedAnalysis as DetailedAnalysisType } from '../types';
import { Target, ShieldAlert, Cpu, Zap, ArrowRight, X } from 'lucide-react';

interface DetailedAnalysisProps {
  signal: Signal;
  analysis: DetailedAnalysisType;
  onClose: () => void;
}

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ signal, analysis, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-[#050505] border-2 border-white/10 rounded-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-[101]"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
          {/* Main Verdict Section */}
          <div className="lg:col-span-7 p-10 border-r border-white/5 flex flex-col justify-center">
            <span className="text-xs font-black uppercase tracking-[0.5em] text-white/30 mb-4 block">Deep Matrix Analysis Result</span>
            
            <div className="mb-10">
               <h1 className="text-[100px] font-black leading-tight tracking-tighter mb-0">
                 {analysis.verdict}
               </h1>
               <h2 className={`text-6xl font-black italic -mt-4 ${
                 analysis.verdict === 'LONG' ? 'text-green-500' : analysis.verdict === 'SHORT' ? 'text-red-500' : 'text-white/40'
               }`}>
                 {signal.symbol.replace('USDT', '')}
               </h2>
            </div>

            <div className="flex gap-12 mb-10">
              <div>
                <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Entry Strategy</div>
                <div className="text-2xl font-black italic">{analysis.entryZone}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Target 1</div>
                <div className={`text-2xl font-black italic ${analysis.verdict === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                  {analysis.target1}
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-4 py-3 px-8 border-2 border-white rounded-full">
               <Cpu size={18} className="text-blue-400" />
               <span className="font-black text-sm uppercase tracking-widest">Confidence: {analysis.confidence}%</span>
            </div>
          </div>

          {/* Reasoning / Technicals Section */}
          <div className="lg:col-span-5 p-10 bg-[#080808]">
            <div className="mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Technical Reasoning</h3>
              <div className="space-y-4">
                {analysis.reasoning.map((reason, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white/5 border-l-4 border-white/20">
                    <ArrowRight size={14} className="mt-1 text-white/40" />
                    <p className="text-sm font-bold tracking-tight">{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Indicator Snapshot</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase text-white/20 font-black mb-1">RSI Efficiency</p>
                  <p className="text-xl font-bold">{signal.indicators.rsi.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-white/20 font-black mb-1">CMF Flow</p>
                  <p className={`text-xl font-bold ${signal.indicators.cmf > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(signal.indicators.cmf * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase text-white/20 font-black mb-1">KAMA Trend Base</p>
                  <p className="text-xl font-bold font-mono tracking-tighter">${signal.indicators.kama.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white text-black rounded-2xl">
               <div className="flex items-center gap-2 mb-2">
                 <ShieldAlert size={14} className="font-bold" />
                 <span className="text-[10px] font-black uppercase tracking-tight">Risk Protocol</span>
               </div>
               <p className="text-xs leading-tight font-medium italic">
                 Calculated on 1H timeframe using Vol-Responsible Hybrid Model. Ensure strict SL placement at local swing points.
               </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
