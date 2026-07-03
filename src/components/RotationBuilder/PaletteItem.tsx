import type { ActionCategory } from '../../types';
import { getActionById } from '../../data/actions';
import { useKeybindStore } from '../../store/keybindStore';
import { formatKeybind } from '../../utils/keybindFormat';

interface PaletteItemProps {
  actionId: string;
  category: ActionCategory;
}

export default function PaletteItem({ actionId, category }: PaletteItemProps) {
  const def = getActionById(actionId);
  const binding = useKeybindStore((s) => s.bindings[actionId]);
  const isItem = category.startsWith('items:');

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ actionId, category }),
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={`palette-item ${isItem ? 'off-gcd' : ''}`}
      draggable
      onDragStart={onDragStart}
      title={isItem ? 'Drag onto an ability slot to add as off-GCD' : def?.name ?? actionId}
    >
      {def?.iconUrl ? (
        <img className="palette-item-icon" src={def.iconUrl} alt="" />
      ) : (
        <span className="palette-item-dot">&middot;</span>
      )}
      <span className="palette-item-name">{def?.name ?? actionId}</span>
      {binding && (
        <span className="palette-item-key">{formatKeybind(binding)}</span>
      )}
    </div>
  );
}
