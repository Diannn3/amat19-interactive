export type MatrixViewProps = {
  value?: Array<Array<{ toString(): string } | string | number>>;
  values?: Array<Array<{ toString(): string } | string | number>>;
  label?: string;
  highlight?: { row: number; column: number };
};

export function MatrixView({ value, values, label = 'Matrix', highlight }: MatrixViewProps) {
  const matrix = values ?? value ?? [];
  return (
    <div className="matrix-bracket" role="img" aria-label={`${label}: ${matrix.map(row => row.map(v => String(v)).join(', ')).join('; ')}`}>
      <table className="matrix-view" aria-hidden="true">
        <tbody>
          {matrix.map((row, r) => (
            <tr key={r}>
              {row.map((val, c) => (
                <td key={c} data-highlight={(highlight?.row === r && highlight?.column === c) || undefined}>
                  {String(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default MatrixView;
