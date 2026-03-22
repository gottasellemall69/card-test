"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const currencyFormatter = new Intl.NumberFormat( "en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} );

const formatCurrencyTick = ( value ) => {
  const numeric = Number( value );
  if ( !Number.isFinite( numeric ) ) {
    return "N/A";
  }
  return currencyFormatter.format( numeric );
};

const CustomTooltip = ( { active, payload, label } ) => {
  if ( !active || !Array.isArray( payload ) || payload.length === 0 ) {
    return null;
  }

  const price = payload[ 0 ]?.value;
  const date = label ? new Date( label ) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm text-white shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Snapshot</p>
      <p className="mt-2 text-base font-semibold text-emerald-300">{ formatCurrencyTick( price ) }</p>
      <p className="mt-1 text-xs text-white/60">
        { date && !Number.isNaN( date.getTime() )
          ? date.toLocaleDateString( "en-US", { month: "short", day: "numeric", year: "numeric" } )
          : "Unknown date" }
      </p>
    </div>
  );
};

const PriceHistoryChart = ( { selectedVersion, priceHistory } ) => {
  if ( !Array.isArray( priceHistory ) || priceHistory.length === 0 ) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-center text-white/60">
        <p className="text-sm">No price history available for this version.</p>
      </div>
    );
  }

  const today = new Date().toISOString().split( "T" )[ 0 ];
  const byDay = new Map();

  priceHistory
    .map( ( entry ) => ( {
      timestamp: new Date( entry?.date ),
      price: Number( entry?.price ),
    } ) )
    .filter( ( entry ) => !Number.isNaN( entry.timestamp.getTime() ) && Number.isFinite( entry.price ) )
    .sort( ( left, right ) => left.timestamp - right.timestamp )
    .forEach( ( entry ) => {
      const day = entry.timestamp.toISOString().split( "T" )[ 0 ];
      byDay.set( day, entry.price );
    } );

  const formattedData = Array.from( byDay.entries() ).map( ( [ date, price ] ) => ( {
    date,
    price,
  } ) );

  if ( !formattedData.some( ( entry ) => entry.date === today ) ) {
    const lastPrice = formattedData.length > 0 ? formattedData[ formattedData.length - 1 ].price : null;
    if ( lastPrice !== null ) {
      formattedData.push( { date: today, price: lastPrice } );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/45">Tracking</p>
          <h3 className="mt-2 text-base font-semibold text-white">
            { selectedVersion || "Selected version" }
          </h3>
        </div>
        <p className="text-xs text-white/50">Snapshots are grouped by calendar day.</p>
      </div>

      <ResponsiveContainer width="100%" height={ 380 }>
        <LineChart
          data={ formattedData }
          margin={ {
            top: 18,
            right: 14,
            left: 4,
            bottom: 8,
          } }
        >
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={ false } />
          <XAxis
            dataKey="date"
            axisLine={ false }
            tickLine={ false }
            tickMargin={ 12 }
            tick={ { fill: "rgba(255,255,255,0.65)", fontSize: 12 } }
            tickFormatter={ ( tick ) =>
              new Date( tick ).toLocaleDateString( "en-US", { month: "short", day: "numeric" } )
            }
          />
          <YAxis
            axisLine={ false }
            tickLine={ false }
            width={ 74 }
            tickMargin={ 10 }
            tick={ { fill: "rgba(255,255,255,0.65)", fontSize: 12 } }
            tickFormatter={ formatCurrencyTick }
          />
          <Tooltip content={ <CustomTooltip /> } cursor={ { stroke: "rgba(255,255,255,0.12)" } } />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#34d399"
            strokeWidth={ 3 }
            dot={ false }
            activeDot={ {
              r: 5,
              fill: "#34d399",
              stroke: "#ecfdf5",
              strokeWidth: 2,
            } }
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceHistoryChart;
