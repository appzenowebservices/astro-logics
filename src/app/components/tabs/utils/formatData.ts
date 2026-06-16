import { type Time } from "lightweight-charts";

export interface FormattedCandle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PriceData {
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
}

export const formatKlinesData = (data: any[]): FormattedCandle[] => {
  return data.map((d: any[]) => ({
    time: Math.floor(d[0] / 1000) as Time,
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
  }));
};

export const calculatePriceData = (
  formattedData: FormattedCandle[],
): PriceData => {
  const lastCandle = formattedData[formattedData.length - 1];
  const firstCandle = formattedData[0];
  const change = lastCandle.close - firstCandle.open;
  const changePercent = (change / firstCandle.open) * 100;

  return {
    open: lastCandle.open,
    high: lastCandle.high,
    low: lastCandle.low,
    close: lastCandle.close,
    change,
    changePercent,
  };
};
