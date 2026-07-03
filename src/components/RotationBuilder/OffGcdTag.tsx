import { getActionById } from '../../data/actions';

interface OffGcdTagProps {
  actionId: string;
  onRemove: () => void;
}

export default function OffGcdTag({ actionId, onRemove }: OffGcdTagProps) {
  const def = getActionById(actionId);

  return (
    <span className="off-gcd-tag" title={def?.name ?? actionId}>
      <span className="off-gcd-tag-dot">&middot;</span>
      <span className="off-gcd-tag-name">{def?.name ?? actionId}</span>
      <button
        className="off-gcd-tag-remove"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        type="button"
      >
        &times;
      </button>
    </span>
  );
}
