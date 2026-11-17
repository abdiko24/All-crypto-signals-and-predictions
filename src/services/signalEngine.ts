import { RSI, EMA, SMA, ATR, BollingerBands } from 'technicalindicators';
import { Candle, Signal } from '../types';

const calculateKAMA = (values: number[], length: number = 10, fast: number = 2, slow: number = 30) => {
  const kama: number[] = [];
  const fastSC = 2 / (fast + 1);
  const slowSC = 2 / (slow + 1);

  let currentAMA = values[length];
  kama.push(currentAMA);

  for (let i = length + 1; i < values.length; i++) {
    const direction = Math.abs(values[i] - values[i - length]);
    let volatility = 0;
    for (let j = i - length + 1; j <= i; j++) {
      volatility += Math.abs(values[j] - values[j - 1]);
    }

    const er = volatility !== 0 ? direction / volatility : 0;
    const sc = Math.pow(er * (fastSC - slowSC) + slowSC, 2);
    currentAMA = currentAMA + sc * (values[i] - currentAMA);
    kama.push(currentAMA);
  }
  return kama;
};

const calculateCMF = (highs: number[], lows: number[], closes: number[], volumes: number[], period: number = 21) => {
  const cmf: number[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    let sumMFV = 0;
    let sumVol = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const mfm = highs[j] !== lows[j] ? ((closes[j] - lows[j]) - (highs[j] - closes[j])) / (highs[j] - lows[j]) : 0;
      sumMFV += mfm * volumes[j];
      sumVol += volumes[j];
    }
    cmf.push(sumVol !== 0 ? sumMFV / sumVol : 0);
  }
  return cmf;
};

export const calculateSignal = (symbol: string, candles: Candle[], ticker: any): Signal | null => {
  if (candles.length < 50) return null;

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  // --- Indicators ---
  const rsiValues = RSI.calculate({ values: closes, period: 14 });
  const kamaValues = calculateKAMA(closes, 10);
  const atrValues = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
  const ema20Values = EMA.calculate({ values: closes, period: 20 });
  const bbValues = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2.5 });
  const cmfValues = calculateCMF(highs, lows, closes, volumes, 21);

  const lastRSI = rsiValues[rsiValues.length - 1];
  const lastKama = kamaValues[kamaValues.length - 1];
  const prevKama = kamaValues[kamaValues.length - 6]; // 5 bars back for slope
  const lastATR = atrValues[atrValues.length - 1];
  const lastEMA20 = ema20Values[ema20Values.length - 1];
  const lastBB = bbValues[bbValues.length - 1];
  const lastCMF = cmfValues[cmfValues.length - 1];
  
  // --- Keltner Channels ---
  const keltnerUpper = lastEMA20 + 1.5 * lastATR;
  const keltnerLower = lastEMA20 - 1.5 * lastATR;

  // --- Regime Detection ---
  const kamaSlope = lastKama - prevKama;
  const cmfThreshold = 0.1;
  
  // Range check for Mean Reversion
  const last30Kama = kamaValues.slice(-30);
  const highestKama = Math.max(...last30Kama);
  const lowestKama = Math.min(...last30Kama);
  const kamaRange = (highestKama - lowestKama) / lowestKama;

  let regime: Signal['regime'] = 'NO_TRADE';
  if (kamaSlope > 0 && lastCMF > cmfThreshold) regime = 'TREND_UP';
  else if (kamaSlope < 0 && lastCMF < -cmfThreshold) regime = 'TREND_DOWN';
  else if (kamaRange < 0.01) regime = 'MEAN_REV';

  // --- Volume Analysis ---
  const avgVolume = SMA.calculate({ values: volumes, period: 20 }).pop() || 0;
  const volumeSpike = volumes[volumes.length - 1] > avgVolume * 1.5;

  // --- Pivot Points (Swing High/Low) ---
  const getPivot = (arr: number[], period: number, isHigh: boolean) => {
    const idx = arr.length - 1 - period;
    const val = arr[idx];
    for (let i = idx - period; i <= idx + period; i++) {
        if (i < 0 || i >= arr.length) continue;
        if (isHigh ? arr[i] > val : arr[i] < val) return null;
    }
    return val;
  };
  
  const lastSwingHigh = getPivot(highs, 10, true) || highs[highs.length - 2];
  const lastSwingLow = getPivot(lows, 10, false) || lows[lows.length - 2];

  // --- Entry Logic ---
  let type: Signal['type'] = 'NEUTRAL';
  const close = closes[closes.length - 1];
  const open = candles[candles.length - 1].open;
  const low = lows[lows.length - 1];
  const high = highs[highs.length - 1];

  // Trend Mode
  if (regime === 'TREND_UP' && close > lastSwingHigh && volumeSpike && close > lastKama && lastRSI > 50 && lastRSI < 75) {
    type = 'TREND_LONG';
  } else if (regime === 'TREND_DOWN' && close < lastSwingLow && volumeSpike && close < lastKama && lastRSI < 50 && lastRSI > 25) {
    type = 'TREND_SHORT';
  }
  
  // Mean Reversion Mode
  const fundingTurningPositive = ticker && parseFloat(ticker.priceChangePercent) > -0.05; // Proxy for turning positive
  if (regime === 'MEAN_REV') {
    if (low <= keltnerLower && lastRSI < 25 && close > open) type = 'MEANREV_LONG';
    else if (high >= keltnerUpper && lastRSI > 75 && close < open) type = 'MEANREV_SHORT';
  }

  return {
    symbol,
    type,
    regime,
    price: ticker ? parseFloat(ticker.lastPrice) : close,
    change24h: ticker ? parseFloat(ticker.priceChangePercent) : 0,
    indicators: {
      rsi: lastRSI,
      kama: lastKama,
      cmf: lastCMF,
      atr: lastATR,
      bb: { upper: lastBB.upper, lower: lastBB.lower },
      keltner: { upper: keltnerUpper, lower: keltnerLower }
    },
    timestamp: Date.now()
  };
};

export const generateDetailedPrediction = (signal: Signal): DetailedAnalysis => {
  const reasoning: string[] = [];
  let verdict: DetailedAnalysis['verdict'] = 'WAIT';
  let confidence = 50;

  if (signal.type === 'TREND_LONG') {
    verdict = 'LONG';
    confidence = 85;
    reasoning.push('KAMA Slope is Positive');
    reasoning.push('CMF volume accumulation detected');
    reasoning.push('Breakout above local swing high');
  } else if (signal.type === 'TREND_SHORT') {
    verdict = 'SHORT';
    confidence = 85;
    reasoning.push('KAMA Slope is Negative');
    reasoning.push('CMF volume distribution detected');
    reasoning.push('Breakout below local swing low');
  } else if (signal.type === 'MEANREV_LONG') {
    verdict = 'LONG';
    confidence = 70;
    reasoning.push('Price at Keltner Lower Band');
    reasoning.push('RSI Oversold reversal');
    reasoning.push('Mean reversion target: KAMA');
  } else if (signal.type === 'MEANREV_SHORT') {
    verdict = 'SHORT';
    confidence = 70;
    reasoning.push('Price at Keltner Upper Band');
    reasoning.push('RSI Overbought reversal');
    reasoning.push('Mean reversion target: KAMA');
  } else {
    reasoning.push('Market in Neutral consolidation');
    reasoning.push('Waiting for volume confirmation');
  }

  // Adjust confidence based on indicators
  if (Math.abs(signal.indicators.cmf) > 0.2) confidence += 10;
  if (signal.type.includes('TREND') && Math.abs(signal.price - signal.indicators.kama) / signal.indicators.kama > 0.05) confidence -= 5;

  const entryZone = `$${(signal.price * 0.999).toFixed(4)} - $${(signal.price * 1.001).toFixed(4)}`;
  const target1 = verdict === 'LONG' 
    ? `$${(signal.price * 1.05).toFixed(4)}` 
    : `$${(signal.price * 0.95).toFixed(4)}`;

  return {
    verdict,
    confidence: Math.min(confidence, 99),
    reasoning,
    entryZone,
    target1
  };
};

import { DetailedAnalysis } from '../types';
