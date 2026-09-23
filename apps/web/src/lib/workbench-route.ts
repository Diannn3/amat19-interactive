export function readWorkbenchOption<Option extends string>(
  parameter: string,
  options: readonly Option[],
): Option | undefined {
  if (typeof window === 'undefined') return undefined;
  const requested = new URLSearchParams(window.location.search).get(parameter);
  return options.find((option) => option === requested);
}
