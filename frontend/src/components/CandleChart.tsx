import { CandlestickSeries, createChart } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import type { ApiCandle } from '../api/candles.ts'
import { toChartCandles } from './chart-data.ts'

export function CandleChart({ candles }: { candles: readonly ApiCandle[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container === null) return

    // autoSize follows the container width with a ResizeObserver; remove() disposes it and every listener.
    const chart = createChart(container, {
      autoSize: true,
      timeScale: { timeVisible: true, secondsVisible: false },
    })
    chart.addSeries(CandlestickSeries).setData(toChartCandles(candles))
    chart.timeScale().fitContent()

    return () => {
      chart.remove()
    }
  }, [candles])

  return <div ref={containerRef} className="chart" />
}
