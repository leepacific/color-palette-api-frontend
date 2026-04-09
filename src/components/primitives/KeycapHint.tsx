interface KeycapHintProps {
  keys: string | string[];
  ariaLabel?: string;
}

export function KeycapHint({ keys, ariaLabel }: KeycapHintProps) {
  const arr = Array.isArray(keys) ? keys : [keys];
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-xs"
      aria-label={ariaLabel ?? `shortcut ${arr.join(' then ')}`}
    >
      {arr.map((k, i) => (
        <span key={i} className="keycap">
          {k}
        </span>
      ))}
    </span>
  );
}
