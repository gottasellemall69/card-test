"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const toTimestampKey = ( value ) => {
  const date = new Date( value );
  if ( Number.isNaN( date.getTime() ) ) return null;
  return date.toISOString();
};

const toDayKey = ( value ) => {
  const date = new Date( value );
  if ( Number.isNaN( date.getTime() ) ) return null;
  return date.toISOString().split( "T" )[ 0 ];
};

const formatDateLabel = ( value ) =>
  new Date( value ).toLocaleDateString( "en-US", { month: "short", day: "numeric" } );

const currencyFormatter = new Intl.NumberFormat( "en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
} );

const RANGE_OPTIONS = [
  { id: "1W", label: "1W", days: 7 },
  { id: "1M", label: "1M", days: 30 },
  { id: "3M", label: "3M", days: 90 },
  { id: "1Y", label: "1Y", days: 365 },
  { id: "ALL", label: "All", days: null },
];

const CollectionValueChart = ( { valueHistory = [], currentValue = 0 } ) => {
  const [ rangeId, setRangeId ] = useState( "1M" );
  const formattedData = useMemo( () => {
    if ( !Array.isArray( valueHistory ) ) return [];

    const cleaned = valueHistory
      .map( ( entry ) => {
        const date = toTimestampKey( entry?.date );
        const value = Number( entry?.value );
        if ( !date || !Number.isFinite( value ) ) return null;
        return { date, value };
      } )
      .filter( Boolean )
      .sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );

    if ( cleaned.length === 0 && Number.isFinite( currentValue ) && currentValue > 0 ) {
      const now = toTimestampKey( new Date() );
      if ( now ) {
        return [ { date: now, value: currentValue } ];
      }
    }

    const today = toDayKey( new Date() );
    if ( cleaned.length > 0 && today ) {
      const lastEntry = cleaned[ cleaned.length - 1 ];
      const lastDay = toDayKey( lastEntry.date );
      if ( lastDay !== today ) {
        const lastValue = lastEntry.value;
        const nextValue = Number.isFinite( currentValue ) && currentValue > 0 ? currentValue : lastValue;
        const now = toTimestampKey( new Date() );
        if ( now ) {
          cleaned.push( { date: now, value: nextValue } );
        }
      }
    }

    return cleaned;
  }, [ currentValue, valueHistory ] );

  const filteredData = useMemo( () => {
    if ( rangeId === "ALL" ) return formattedData;

    const range = RANGE_OPTIONS.find( ( option ) => option.id === rangeId );
    if ( !range?.days || formattedData.length === 0 ) {
      return formattedData;
    }

    const endDate = new Date( formattedData[ formattedData.length - 1 ].date );
    if ( Number.isNaN( endDate.getTime() ) ) {
      return formattedData;
    }

    const startDate = new Date( endDate );
    startDate.setDate( endDate.getDate() - range.days + 1 );

    return formattedData.filter( ( entry ) => new Date( entry.date ) >= startDate );
  }, [ formattedData, rangeId ] );

  if ( formattedData.length === 0 ) {
    return (
      <p className="text-sm text-white/70">
        No collection value history yet. Refresh prices to start tracking.
      </p>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex flex-wrap gap-2">
        { RANGE_OPTIONS.map( ( option ) => {
          const isActive = option.id === rangeId;
          return (
            <button
              key={ option.id }
              type="button"
              onClick={ () => setRangeId( option.id ) }
              className={ `rounded-full border px-3 py-1 text-xs font-semibold transition ${ isActive
                ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-100"
                : "border-white/20 bg-white/10 text-white/80 hover:border-white/40"
                }` }
              aria-pressed={ isActive }
            >
              { option.label }
            </button>
          );
        } ) }
      </div>
      <div className="min-h-0 flex-1">
        { filteredData.length === 0 ? (
          <p className="text-sm text-white/70">No data in this range yet.</p>
        ) : (
          <ResponsiveContainer className="text-black h-full w-full max-w-[85%] mx-auto glass text-shadow backdrop rounded-md -p-10" width="100%" height="100%">
            <LineChart data={ filteredData }>
              <XAxis
                dataKey="date"
                tick={ { fill: "white" } }
                tickFormatter={ formatDateLabel }
              />
              <YAxis
                tick={ { fill: "white" } }
                tickFormatter={ ( value ) => currencyFormatter.format( value ) }
              />
              <Tooltip
                formatter={ ( value ) => currencyFormatter.format( value ) }
                labelFormatter={ formatDateLabel }
              />
              <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={ 2 } dot={ false } />
            </LineChart>
          </ResponsiveContainer>
        ) }
      </div>
    </div>
  );
};

export default CollectionValueChart;
