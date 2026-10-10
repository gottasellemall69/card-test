import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { requestJson } from '@/lib/client/request';

export default function PriceTracker() {
  const { data, error, mutate } = useSWR('/api/Yugioh/price-tracker', requestJson, {
    refreshInterval: 10000,
  });
  const [canManage, setCanManage] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const cancelled = useRef(false);
  useEffect(() => {
    let active = true;
    cancelled.current = false;
    requestJson('/api/auth/validate')
      .then((auth) => {
        if (active) setCanManage(auth.canManageTracking);
      })
      .catch(() => {});
    return () => {
      active = false;
      cancelled.current = true;
    };
  }, []);
  const run = async () => {
    setRunning(true);
    setMessage('');
    try {
      let result;
      do {
        result = await requestJson('/api/Yugioh/price-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restart: !result && data?.status === 'complete' }),
        });
        if (cancelled.current) return;
        await mutate(result, { revalidate: false });
        if (result.retryAfter || result.failedSets) break;
      } while (result.status !== 'complete' && !cancelled.current);
      if (!cancelled.current)
        setMessage(
          result.status === 'complete'
            ? 'All catalogue sets have been checked.'
            : 'Progress saved. A later run will retry pending sets.',
        );
    } catch (failure) {
      if (!cancelled.current) setMessage(failure.message);
    } finally {
      if (!cancelled.current) setRunning(false);
    }
  };
  const completed = data?.completedSets || 0,
    total = data?.totalSets || 0;
  return (
    <>
      <Head>
        <title>Daily Card Price Tracker</title>
      </Head>
      <section className="mx-auto max-w-5xl p-6 text-white">
        <h1 className="text-3xl font-bold">Daily Card Price Tracker</h1>
        <p className="mt-3 text-white/75">
          Tracks TCGPlayer prices across the full Yu-Gi-Oh catalogue, including inactive sets.
          History is collected for each printing and condition without opening its detail page.
        </p>
        <div className="mt-6 rounded-xl border border-white/20 bg-slate-900/80 p-5">
          <p>
            Status: <strong>{data?.status?.replaceAll('_', ' ') || 'Loading'}</strong>
          </p>
          <p className="mt-2">
            Sets checked: {completed} / {total}
          </p>
          <progress
            aria-label="Sets checked"
            className="mt-3 w-full"
            value={completed}
            max={total || 1}
          />
          <p className="mt-3">
            Price rows saved this sweep: {(data?.rowsSaved || 0).toLocaleString()}
          </p>
          <p>
            Rows without a published market price:{' '}
            {(data?.withoutMarketPrice || 0).toLocaleString()}
          </p>
          <p>Sets awaiting retry: {data?.failedSets || 0}</p>
          {data?.updatedAt && (
            <p className="mt-3 text-sm text-white/70">
              Updated: {new Date(data.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        {canManage ? (
          <button
            type="button"
            className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold disabled:opacity-60"
            onClick={run}
            disabled={running}
          >
            {running
              ? 'Tracking prices…'
              : data?.status === 'partial'
                ? 'Resume tracking'
                : 'Track all prices now'}
          </button>
        ) : (
          <p className="mt-5 text-white/70">
            An administrator can run tracking on demand. Daily scheduled tracking runs on the
            server.
          </p>
        )}
        {(message || error) && (
          <p role="status" className="mt-4 text-amber-200">
            {message || error.message}
          </p>
        )}
        <p className="mt-6 text-sm text-white/65">
          Daily snapshots begin when tracking is enabled. Prices unavailable from TCGPlayer remain
          unavailable; earlier history is retained where it already exists.
        </p>
      </section>
    </>
  );
}
