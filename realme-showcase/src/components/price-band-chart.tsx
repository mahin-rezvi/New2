type PriceBandChartProps = {
  bands: Array<{
    label: string;
    count: number;
  }>;
};

export function PriceBandChart({ bands }: PriceBandChartProps) {
  const max = Math.max(...bands.map((band) => band.count), 1);

  return (
    <div className="band-chart">
      {bands.map((band) => (
        <div className="band-row" key={band.label}>
          <div className="band-copy">
            <span>{band.label}</span>
            <strong>{band.count}</strong>
          </div>
          <div className="band-track">
            <div className="band-fill" style={{ width: `${(band.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
