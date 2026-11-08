"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  ShieldAlert,
  X,
} from "lucide-react";

type Account = {
  login?: number;
  server?: string;
  currency?: string;
  balance?: number;
  equity?: number;
  freeMargin?: number;
  leverage?: number;
  tradeMode?: number;
  name?: string;
  terminalTradeAllowed?: boolean;
  tradingEnabled?: boolean;
  maxVolume?: number;
};

type Position = {
  ticket: number;
  symbol: string;
  type: "BUY" | "SELL" | string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  sl?: number | null;
  tp?: number | null;
  profit: number;
  swap?: number;
};

type PendingOrder = {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  comment?: string;
};

const money = (value: number | undefined, currency = "USD") =>
  value === undefined || Number.isNaN(value)
    ? "—"
    : `${value < 0 ? "-" : ""}${currency === "USD" ? "$" : ""}${Math.abs(value).toFixed(2)}${currency === "USD" ? "" : ` ${currency}`}`;

const price = (value: number | undefined) =>
  value === undefined ? "—" : value.toFixed(5);

export default function TradingDesk({
  symbol,
  livePrice,
  embedded = false,
}: {
  symbol: string;
  livePrice?: number;
  embedded?: boolean;
}) {
  const utils = api.useUtils();
  const [open, setOpen] = useState(true);
  const [volume, setVolume] = useState("0.01");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [confirming, setConfirming] = useState<"BUY" | "SELL" | null>(null);
  const [message, setMessage] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);

  const accountQuery = api.trading.mt5Account.useQuery(undefined, {
    refetchInterval: 5000,
    retry: 1,
  });
  const positionsQuery = api.trading.mt5Positions.useQuery(undefined, {
    refetchInterval: 5000,
    retry: 1,
  });
  const pendingQuery = api.trading.mt5PendingOrders.useQuery(undefined, {
    refetchInterval: 10_000,
    retry: 1,
  });

  const account = (accountQuery.data ?? {}) as Account;
  const positions = (positionsQuery.data ?? []) as Position[];
  const pending = (pendingQuery.data ?? []) as PendingOrder[];

  const placeOrder = api.trading.placeOrder.useMutation({
    onSuccess: (result) => {
      setMessage({
        tone: "ok",
        text: `Order #${String(result.order)} accepted (deal ${String(result.deal)}).`,
      });
      setConfirming(null);
      setSl("");
      setTp("");
      void utils.trading.mt5Positions.invalidate();
      void utils.trading.mt5Account.invalidate();
    },
    onError: (error) => {
      setConfirming(null);
      setMessage({ tone: "err", text: error.message });
    },
  });

  const closePosition = api.trading.closePosition.useMutation({
    onSuccess: () => {
      setMessage({ tone: "ok", text: "Position closed." });
      void utils.trading.mt5Positions.invalidate();
      void utils.trading.mt5Account.invalidate();
    },
    onError: (error) => setMessage({ tone: "err", text: error.message }),
  });

  const cancelOrder = api.trading.cancelOrder.useMutation({
    onSuccess: () => {
      setMessage({ tone: "ok", text: "Pending order cancelled." });
      void utils.trading.mt5PendingOrders.invalidate();
    },
    onError: (error) => setMessage({ tone: "err", text: error.message }),
  });

  const connected =
    !accountQuery.isError && account.balance !== undefined;
  const isReal = account.tradeMode === 2;
  const locked = account.tradingEnabled === false;
  const noFunds = (account.balance ?? 0) <= 0;
  const brokerOff = account.terminalTradeAllowed === false;
  const busy = placeOrder.isPending;

  const submit = (side: "BUY" | "SELL") => {
    setMessage(null);
    placeOrder.mutate({
      symbol,
      action: side,
      volume: Number(volume),
      sl: sl ? Number(sl) : undefined,
      tp: tp ? Number(tp) : undefined,
      comment: "Kaalvanta",
    });
  };

  return (
    <div className={embedded ? "w-full" : "pointer-events-none absolute inset-0 z-30"}>
      <div className={embedded ? "w-full overflow-hidden rounded-2xl border border-[var(--color-primary-dark)]/15 bg-[var(--color-primary-light)]/95 text-[var(--color-primary-dark)]" : "pointer-events-auto absolute bottom-4 left-4 w-[342px] overflow-hidden rounded-2xl border border-[var(--color-primary-dark)]/15 bg-[var(--color-primary-light)]/95 text-[var(--color-primary-dark)] shadow-2xl backdrop-blur"}>
        {/* Header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 bg-[var(--color-primary-dark)] px-4 py-2.5 text-left text-[var(--color-primary-light)]"
        >
          <span className="font-mono text-[10px] font-black tracking-[0.18em] uppercase">
            Execution
          </span>
          {!connected ? (
            <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[8px] font-black tracking-[0.14em] text-white/70 uppercase">
              Offline
            </span>
          ) : isReal ? (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-mono text-[8px] font-black tracking-[0.14em] text-red-200 uppercase">
              Live · Real
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[8px] font-black tracking-[0.14em] text-emerald-200 uppercase">
              Demo
            </span>
          )}
          <span className="ml-auto font-mono text-[9px] opacity-60">
            #{account.login ?? "—"}
          </span>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 opacity-70" />
          )}
        </button>

        {open && (
          <div className={`space-y-3 p-4 ${embedded ? "" : "max-h-[70vh] overflow-y-auto"}`}>
            {/* Account strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Balance", money(account.balance, account.currency)],
                ["Equity", money(account.equity, account.currency)],
                ["Free", money(account.freeMargin, account.currency)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--color-primary-dark)]/10 bg-white/60 px-2 py-2"
                >
                  <p className="font-mono text-[7px] font-black tracking-[0.16em] uppercase opacity-45">
                    {label}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] font-black">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {accountQuery.isError && (
              <div className="rounded-xl bg-red-500/10 px-3 py-2 font-mono text-[9px] leading-relaxed text-red-800 uppercase">
                MT5 not connected — log in to the terminal, enable
                AutoTrading, then restart the bridge.
              </div>
            )}

            {connected && (locked || brokerOff || noFunds) && (
              <div className="space-y-1 rounded-xl bg-amber-500/10 px-3 py-2 font-mono text-[9px] leading-relaxed text-amber-900 uppercase">
                {noFunds && (
                  <p className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Balance is {money(account.balance, account.currency)} — orders
                    will be rejected by the broker.
                  </p>
                )}
                {brokerOff && (
                  <p className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3 w-3 shrink-0" />
                    AutoTrading is OFF in the MT5 terminal.
                  </p>
                )}
                {locked && (
                  <p className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 shrink-0" />
                    Execution locked — set MT5_TRADING_ENABLED=true.
                  </p>
                )}
              </div>
            )}

            {/* Ticket */}
            <div className="rounded-xl border border-[var(--color-primary-dark)]/12 bg-white/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] font-black tracking-[0.1em]">
                  {symbol}
                </span>
                <span className="font-mono text-[11px] opacity-60">
                  {price(livePrice)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="mb-1 block font-mono text-[7px] font-black tracking-[0.16em] uppercase opacity-45">
                    Volume
                  </span>
                  <input
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg border border-[var(--color-primary-dark)]/15 bg-white px-2 py-1.5 font-mono text-[11px] font-bold outline-none focus:border-[var(--color-accent-orange)]/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[7px] font-black tracking-[0.16em] uppercase opacity-45">
                    SL
                  </span>
                  <input
                    value={sl}
                    onChange={(e) => setSl(e.target.value)}
                    inputMode="decimal"
                    placeholder="optional"
                    className="w-full rounded-lg border border-[var(--color-primary-dark)]/15 bg-white px-2 py-1.5 font-mono text-[11px] font-bold outline-none focus:border-[var(--color-accent-orange)]/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[7px] font-black tracking-[0.16em] uppercase opacity-45">
                    TP
                  </span>
                  <input
                    value={tp}
                    onChange={(e) => setTp(e.target.value)}
                    inputMode="decimal"
                    placeholder="optional"
                    className="w-full rounded-lg border border-[var(--color-primary-dark)]/15 bg-white px-2 py-1.5 font-mono text-[11px] font-bold outline-none focus:border-[var(--color-accent-orange)]/60"
                  />
                </label>
              </div>

              {confirming ? (
                <div className="mt-3 rounded-lg bg-[var(--color-primary-dark)]/5 p-2.5">
                  <p className="font-mono text-[9px] leading-relaxed uppercase opacity-70">
                    {confirming} {volume} {symbol} at market
                    {isReal ? " on the LIVE account" : ""}?
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => submit(confirming)}
                      disabled={busy}
                      className={`flex-1 rounded-lg px-3 py-2 font-mono text-[9px] font-black tracking-[0.12em] text-white uppercase disabled:opacity-60 ${
                        confirming === "BUY" ? "bg-emerald-600" : "bg-red-600"
                      }`}
                    >
                      {busy ? (
                        <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="rounded-lg px-3 py-2 font-mono text-[9px] font-black tracking-[0.12em] uppercase opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming("BUY")}
                    disabled={!connected}
                    className="rounded-lg bg-emerald-600 px-3 py-2.5 font-mono text-[10px] font-black tracking-[0.14em] text-white uppercase transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming("SELL")}
                    disabled={!connected}
                    className="rounded-lg bg-red-600 px-3 py-2.5 font-mono text-[10px] font-black tracking-[0.14em] text-white uppercase transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sell
                  </button>
                </div>
              )}
            </div>

            {message && (
              <p
                className={`rounded-lg px-3 py-2 font-mono text-[9px] leading-relaxed uppercase ${
                  message.tone === "ok"
                    ? "bg-emerald-500/10 text-emerald-800"
                    : "bg-red-500/10 text-red-700"
                }`}
              >
                {message.text}
              </p>
            )}

            {/* Positions */}
            <div>
              <p className="mb-1.5 flex items-center justify-between font-mono text-[8px] font-black tracking-[0.16em] uppercase opacity-50">
                <span>Open positions</span>
                <span>{positions.length}</span>
              </p>

              {positions.length === 0 ? (
                <p className="rounded-lg bg-white/50 px-3 py-2 font-mono text-[9px] uppercase opacity-40">
                  No open positions.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {positions.map((position) => {
                    const profit = position.profit + (position.swap ?? 0);
                    return (
                      <div
                        key={position.ticket}
                        className="flex items-center gap-2 rounded-lg border border-[var(--color-primary-dark)]/10 bg-white/70 px-2.5 py-2"
                      >
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-black uppercase ${
                            position.type === "BUY"
                              ? "bg-emerald-500/15 text-emerald-700"
                              : "bg-red-500/15 text-red-700"
                          }`}
                        >
                          {position.type}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-[10px] font-bold">
                            {position.symbol} · {position.volume}
                          </p>
                          <p className="font-mono text-[8px] opacity-45">
                            {price(position.openPrice)} →{" "}
                            {price(position.currentPrice)}
                          </p>
                        </div>
                        <span
                          className={`font-mono text-[10px] font-black ${
                            profit >= 0 ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {money(profit, account.currency)}
                        </span>
                        <button
                          type="button"
                          title={`Close ${position.ticket}`}
                          disabled={closePosition.isPending}
                          onClick={() =>
                            closePosition.mutate({ ticket: position.ticket })
                          }
                          className="rounded p-1 text-red-600/70 transition-colors hover:bg-red-500/10 hover:text-red-700 disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending orders */}
            {pending.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center justify-between font-mono text-[8px] font-black tracking-[0.16em] uppercase opacity-50">
                  <span>Pending orders</span>
                  <span>{pending.length}</span>
                </p>
                <div className="space-y-1.5">
                  {pending.map((order) => (
                    <div
                      key={order.ticket}
                      className="flex items-center gap-2 rounded-lg border border-[var(--color-primary-dark)]/10 bg-white/70 px-2.5 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[10px] font-bold">
                          {order.symbol} · {order.volume}
                        </p>
                        <p className="font-mono text-[8px] opacity-45">
                          {order.type} @ {price(order.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          cancelOrder.mutate({ ticket: order.ticket })
                        }
                        className="rounded p-1 text-red-600/70 hover:bg-red-500/10"
                        title={`Cancel ${order.ticket}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="pt-1 text-center font-mono text-[7px] tracking-[0.14em] uppercase opacity-30">
              {account.server ?? "MT5"} · {account.leverage ?? "—"}x · magic
              Kaalvanta
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
