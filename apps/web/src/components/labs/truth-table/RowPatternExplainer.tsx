export function RowPatternExplainer({ symbols }: { symbols: string[] }) {
  if (symbols.length === 0) return null;
  const rows = 2 ** symbols.length;
  return (
    <section className="row-pattern" aria-labelledby="row-pattern-heading">
      <div>
        <p className="truth-lab__section-label" id="row-pattern-heading">Row pattern</p>
        <p>
          {symbols.length} symbol{symbols.length === 1 ? '' : 's'} produce <strong>2^{symbols.length} = {rows}</strong> assignments.
          Each column flips at half the rate of the column before it.
        </p>
      </div>
      {symbols.length <= 4 && (
        <div className="row-pattern__grid" aria-label="Truth value repetition pattern">
          {symbols.map((symbol, index) => {
            const block = 2 ** (symbols.length - index - 1);
            return (
              <div className="row-pattern__column" key={symbol}>
                <strong>{symbol}</strong>
                <span>{`T × ${block}, F × ${block}`}</span>
                <small>repeat every {block * 2} rows</small>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
