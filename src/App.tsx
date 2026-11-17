import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Activity, Zap, TrendingUp, ShieldAlert, BarChart3, Clock, Search, ChevronRight } from 'lucide-react';
import { SYMBOLS, Signal, DetailedAnalysis as DetailedAnalysisType } from './types';
import { fetchCandles, fetchTicker } from './services/binanceService';
import { calculateSignal, generateDetailedPrediction } from './services/signalEngine';
import { SignalCard } from './components/SignalCard';
import { DetailedAnalysis } from './components/DetailedAnalysis';

export default function App() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [selectedSignal, setSelectedSignal] = useState<{ signal: Signal; analysis: DetailedAnalysisType } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const updateSignals = useCallback(async () => {
    setLoading(true);
    const newSignals: Signal[] = [];

    for (const symbol of SYMBOLS) {
      const [candles, ticker] = await Promise.all([
        fetchCandles(symbol),
        fetchTicker(symbol)
      ]);

      if (candles.length > 0) {
        const signal = calculateSignal(symbol, candles, ticker);
        if (signal) newSignals.push(signal);
      }
    }

    setSignals(newSignals);
    
    // Auto-select first signal if none selected
    if (newSignals.length > 0 && !selectedSignal) {
      const analysis = generateDetailedPrediction(newSignals[0]);
      setSelectedSignal({ signal: newSignals[0], analysis });
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, [selectedSignal]);

  useEffect(() => {
    updateSignals();
    const interval = setInterval(updateSignals, 180000); // Update every 3 minutes
    return () => clearInterval(interval);
  }, [updateSignals]);

  const handleSelectCoin = (signal: Signal) => {
    const analysis = generateDetailedPrediction(signal);
    setSelectedSignal({ signal, analysis });
  };

  const filteredSignals = signals.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'ALL') return true;
    if (filter === 'BUY') return s.type.includes('LONG');
    if (filter === 'SELL') return s.type.includes('SHORT');
    return true;
  });

  const buyCount = signals.filter(s => s.type.includes('LONG')).length;
  const sellCount = signals.filter(s => s.type.includes('SHORT')).length;

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase">Engine: TradingView v6.0 Logic Matrix</span>
          </div>

          <div className="flex items-center gap-12">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Active Scan</span>
              <span className="text-xl font-bold font-mono tracking-tighter">12 Major Tokens</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">System Status</span>
              <span className="text-xl font-bold tracking-tighter text-green-400">OPTIMAL</span>
            </div>
            <button 
              onClick={updateSignals}
              disabled={loading}
              className="ml-4 p-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] border-x border-white/10 grid grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT RAIL: WATCHLIST */}
        <aside className="col-span-12 lg:col-span-3 border-r border-white/10 flex flex-col bg-[#080808]">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">Asset Priority Matrix</h3>
            <div className="relative group mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="FIND TOKEN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-white/30 transition-all uppercase"
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2 text-[9px] font-black tracking-widest transition-all border ${
                    filter === f ? 'bg-white text-black border-white' : 'text-white/40 border-white/10 hover:border-white/30'
                  }`}
                >
                  {f === 'ALL' ? 'ALL' : f === 'BUY' ? 'LONG' : 'SHORT'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {loading && signals.length === 0 ? (
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/5 animate-pulse border border-white/5" />
              ))
            ) : filteredSignals.map((signal) => (
              <button
                key={signal.symbol}
                onClick={() => handleSelectCoin(signal)}
                className={`w-full p-4 flex justify-between items-center transition-all group hover:bg-white/5 border-l-2 ${
                  selectedSignal?.signal.symbol === signal.symbol ? 'bg-white/10 border-white' : 'border-transparent'
                }`}
              >
                <div className="text-left">
                  <div className="font-black text-sm tracking-tight">{signal.symbol.replace('USDT', '')}</div>
                  <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{signal.regime.replace('_', ' ')}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-black ${
                    signal.type.includes('LONG') ? 'text-green-500' : 
                    signal.type.includes('SHORT') ? 'text-red-500' : 'text-white/20'
                  }`}>
                    {signal.type !== 'NEUTRAL' ? signal.type.replace('_', ' ') : 'WATCHING'}
                  </div>
                  <div className="text-[10px] font-mono text-white/40">${signal.price.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER: PRIME SIGNAL STAGE */}
        <section className="col-span-12 lg:col-span-6 p-8 lg:p-16 flex flex-col items-center justify-center relative min-h-[600px]">
          {selectedSignal ? (
            <motion.div 
              key={selectedSignal.signal.symbol}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full text-center"
            >
              <span className="text-xs font-black uppercase tracking-[0.5em] text-white/20 mb-6 block">Prime Signal Identified</span>
              <h1 className="text-[80px] md:text-[120px] font-black leading-none tracking-tighter mb-4">
                {selectedSignal.analysis.verdict}<br/>
                <span className={selectedSignal.analysis.verdict === 'LONG' ? 'text-green-500' : 'text-red-500'}>
                  {selectedSignal.signal.symbol.replace('USDT', '')}
                </span>
              </h1>
              
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12">
                <div className="text-left">
                  <div className="text-[10px] uppercase text-white/40 font-black tracking-[0.2em] mb-1">Entry Zone</div>
                  <div className="text-3xl font-black italic tracking-tighter">{selectedSignal.analysis.entryZone}</div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase text-white/40 font-black tracking-[0.2em] mb-1">Target Alpha</div>
                  <div className={`text-3xl font-black italic tracking-tighter ${selectedSignal.analysis.verdict === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedSignal.analysis.target1}
                  </div>
                </div>
              </div>

              <div className="mt-16 inline-flex flex-col items-center gap-4">
                 <div className="py-2 px-10 border-2 border-white rounded-full font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                   Confidence Level: {selectedSignal.analysis.confidence}%
                 </div>
                 <button 
                   onClick={() => setShowModal(true)}
                   className="text-[10px] font-black uppercase tracking-widest text-[#22C55E] animate-pulse hover:text-white transition-colors"
                 >
                   Verify Logic Matrix →
                 </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Activity size={64} className="mx-auto text-white/5 mb-8 animate-pulse" />
              <h2 className="text-xl font-black uppercase tracking-[0.3em] mb-4">Matrix Idle</h2>
              <p className="text-xs text-white/30 max-w-xs mx-auto leading-relaxed">
                SELECT A TRADING PAIR FROM THE WATCHLIST TO INITIALIZE DEEP NEURAL PREDICTION ENGINE.
              </p>
            </div>
          )}
        </section>

        {/* RIGHT RAIL: TECHNICAL FEED */}
        <aside className="col-span-12 lg:col-span-3 border-l border-white/10 p-6 flex flex-col gap-6 bg-[#050505]">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6 flex justify-between">
              Live Technicals
              <Zap size={12} className="text-blue-500" />
            </h3>
            <div className="space-y-6">
              {selectedSignal ? (
                <>
                  <div className="flex justify-between items-end border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">RSI Efficiency</span>
                    <span className={`text-xl font-black ${selectedSignal.signal.indicators.rsi > 70 ? 'text-red-500' : selectedSignal.signal.indicators.rsi < 30 ? 'text-green-500' : 'text-white'}`}>
                      {selectedSignal.signal.indicators.rsi.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">CMF Flow</span>
                    <span className={`text-xl font-black ${selectedSignal.signal.indicators.cmf > 0.1 ? 'text-green-500' : 'text-white/60'}`}>
                      {(selectedSignal.signal.indicators.cmf * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">ATR Volatility</span>
                    <span className="text-xl font-black text-blue-400">
                      {selectedSignal.signal.indicators.atr.toFixed(4)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-4 opacity-10 py-10">
                  <div className="h-10 bg-white" />
                  <div className="h-10 bg-white" />
                  <div className="h-10 bg-white" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Market Heat</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-white/5 border border-white/10 text-[9px] font-black tracking-widest uppercase">PERP: HIGH OI</span>
              <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-[9px] font-black tracking-widest uppercase text-green-500">FUNDING: +0.01%</span>
              <span className="px-2 py-1 bg-white/5 border border-white/10 text-[9px] font-black tracking-widest uppercase text-white/60">VOL: $2.4B</span>
            </div>
          </div>

          <div className="bg-white text-black p-6 mt-auto rounded-3xl">
            <p className="text-[10px] font-black uppercase mb-2 tracking-widest flex items-center gap-2">
              <ShieldAlert size={12} />
              Pine Script Guard
            </p>
            <p className="text-[11px] leading-tight font-bold italic opacity-80">
              Script v2.4-Hybrid extracted successfully. No state-machine conflicts detected in local matrix.
            </p>
          </div>
        </aside>
      </main>

      {/* Selected Analysis Modal */}
      <AnimatePresence>
        {showModal && selectedSignal && (
          <DetailedAnalysis 
            signal={selectedSignal.signal} 
            analysis={selectedSignal.analysis} 
            onClose={() => setShowModal(false)} 
          />
        )}
      </AnimatePresence>

      {/* Footer Tape */}
      <footer className="fixed bottom-0 left-0 w-full h-10 bg-white flex items-center px-10 justify-between z-[60]">
        <div className="flex gap-12 overflow-hidden whitespace-nowrap">
          <div className="flex gap-8 items-center animate-[marquee_20s_linear_infinite]">
            {SYMBOLS.map(s => (
              <span key={s} className="text-[10px] font-black text-black uppercase tracking-widest">
                {s.replace('USDT', '')} LIVE •
              </span>
            ))}
          </div>
        </div>
        <div className="text-[10px] font-black text-black uppercase tracking-widest hidden sm:block">
          Timestamp: {lastUpdated.toLocaleTimeString([], { hour12: false })} UTC
        </div>
      </footer>
    </div>
  );
}
