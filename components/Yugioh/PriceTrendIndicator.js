import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

const parsePrice = ( value ) => {
  if ( value === null || value === undefined || value === "" ) {
    return null;
  }

  const numeric = Number( value );
  return Number.isFinite( numeric ) ? numeric : null;
};

const formatCurrencyDelta = ( value ) => {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${ sign }$${ Math.abs( value ).toFixed( 2 ) }`;
};

const formatPercentDelta = ( value ) => {
  if ( !Number.isFinite( value ) ) {
    return null;
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${ sign }${ Math.abs( value ).toFixed( 1 ) }%`;
};

export const getPriceTrend = ( previousPrice, currentPrice ) => {
  const previous = parsePrice( previousPrice );
  const current = parsePrice( currentPrice );

  if ( previous === null || current === null ) {
    return {
      direction: "none",
      label: "No prior scan",
      amountLabel: "No prior",
      percentLabel: null,
      ariaLabel: "No prior scan price available",
    };
  }

  const delta = current - previous;
  const percent = previous > 0 ? ( delta / previous ) * 100 : null;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const amountLabel = formatCurrencyDelta( delta );
  const percentLabel = formatPercentDelta( percent );

  if ( direction === "flat" ) {
    return {
      direction,
      label: "No change",
      amountLabel,
      percentLabel: percentLabel || "0.0%",
      ariaLabel: "Price has not changed since the last scan",
    };
  }

  const verb = direction === "up" ? "risen" : "fallen";

  return {
    direction,
    label: direction === "up" ? "Up" : "Down",
    amountLabel,
    percentLabel,
    ariaLabel: `Price has ${ verb } ${ amountLabel }${ percentLabel ? `, ${ percentLabel }` : "" } since the last scan`,
  };
};

const TREND_STYLES = {
  up: {
    Icon: ArrowUpRight,
    className: "text-emerald-300",
    mutedClassName: "text-emerald-100/65",
  },
  down: {
    Icon: ArrowDownRight,
    className: "text-rose-300",
    mutedClassName: "text-rose-100/65",
  },
  flat: {
    Icon: ArrowRight,
    className: "text-sky-300",
    mutedClassName: "text-sky-100/60",
  },
  none: {
    Icon: ArrowRight,
    className: "text-white/45",
    mutedClassName: "text-white/40",
  },
};

const PriceTrendIndicator = ( {
  previousPrice,
  currentPrice,
  compact = false,
  className = "",
} ) => {
  const trend = getPriceTrend( previousPrice, currentPrice );
  const style = TREND_STYLES[ trend.direction ] || TREND_STYLES.none;
  const Icon = style.Icon;

  if ( compact ) {
    return (
      <span
        className={ `inline-flex shrink-0 items-baseline gap-1.5 text-[0.72rem] font-semibold leading-none ${ style.className } ${ className }` }
        aria-label={ trend.ariaLabel }
        title={ trend.ariaLabel }
      >
        <Icon className="relative top-0.5 h-3.5 w-3.5" aria-hidden="true" />
        <span className="tabular-nums">{ trend.amountLabel }</span>
        { trend.percentLabel ? <span className={ `tabular-nums ${ style.mutedClassName }` }>{ trend.percentLabel }</span> : null }
      </span>
    );
  }

  return (
    <span
      className={ `inline-flex min-w-[7.5rem] items-center justify-center gap-2 text-xs font-semibold ${ style.className } ${ className }` }
      aria-label={ trend.ariaLabel }
      title={ trend.ariaLabel }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="flex flex-col items-start leading-tight">
        <span className="tabular-nums">{ trend.amountLabel }</span>
        <span className={ `tabular-nums ${ style.mutedClassName }` }>
          { trend.percentLabel || trend.label }
        </span>
      </span>
    </span>
  );
};

export default PriceTrendIndicator;
