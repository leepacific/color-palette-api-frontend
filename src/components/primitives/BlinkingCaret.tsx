import { memo } from 'react';

interface BlinkingCaretProps {
  color?: string;
  character?: '█' | '▌';
  className?: string;
  ariaHidden?: boolean;
}

function BlinkingCaretInner({
  color,
  character = '▌',
  className = '',
  ariaHidden = true,
}: BlinkingCaretProps) {
  return (
    <span
      className={`blinking-caret inline-block font-mono ${className}`}
      style={color ? { color } : undefined}
      aria-hidden={ariaHidden}
    >
      {character}
    </span>
  );
}

export const BlinkingCaret = memo(BlinkingCaretInner);
