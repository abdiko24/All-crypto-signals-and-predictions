export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  symbol: string;
  type: 'TREND_LONG' | 'TREND_SHORT' | 'MEANREV_LONG' | 'MEANREV_SHORT' | 'NEUTRAL';
  regime: 'TREND_UP' | 'TREND_DOWN' | 'MEAN_REV' | 'NO_TRADE';
  price: number;
  change24h: number;
  indicators: {
    rsi: number;
    kama: number;
    cmf: number;
    atr: number;
    bb: { upper: number; lower: number };
    keltner: { upper: number; lower: number };
  };
  timestamp: number;
}

export interface DetailedAnalysis {
  verdict: 'LONG' | 'SHORT' | 'WAIT';
  confidence: number;
  reasoning: string[];
  entryZone: string;
  target1: string;
}

export type Timeframe = '15m' | '1h' | '4h' | '1d';

export const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 
  'XRPUSDT', 'DOTUSDT', 'LINKUSDT', 'AVAXUSDT', 'MATICUSDT',
  'DOGEUSDT', 'SHIBUSDT', 'LTCUSDT', 'NEARUSDT', 'ATOMUSDT',
  'UNIUSDT', 'ARBUSDT', 'OPUSDT', 'APTUSDT', 'SUIUSDT'
];
