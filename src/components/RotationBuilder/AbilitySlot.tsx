import { getActionById } from '../../data/actions';
import { useKeybindStore } from '../../store/keybindStore';
import { useRotationBuilderStore } from '../../store/rotationBuilderStore';
import { formatKeybind } from '../../utils/keybindFormat';
import OffGcdTag from './OffGcdTag';

interface AbilitySlotProps {
  index: number;
  isDragging: boolean;
  isHoverSlot: boolean;
  onDragStartSlot: (index: number) => void;
}

export default function AbilitySlot({ index, isDragging, isHoverSlot, onDragStartSlot }: AbilitySlotProps) {
  const abilities = useRotationBuilderStore((s) => s.abilities);
  const offGcdActions = useRotationBuilderStore((s) => s.offGcdActions);
  const removeAbility = useRotationBuilderStore((s) => s.removeAbility);
  const removeOffGcdAction = useRotationBuilderStore((s) => s.removeOffGcdAction);

  const abilityId = abilities[index];
  const def = getActionById(abilityId);
  const binding = useKeybindStore((s) => s.bindings[abilityId]);
  const offGcdIds = offGcdActions[index] ?? [];

  if (!abilityId) return null;

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      actionId: abilityId,
      category: def?.category ?? '',
      sourceIndex: index,
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStartSlot(index);
  };

  const onDragEnd = () => {
    onDragStartSlot(-1);
  };

  return (
    <div
      className={`ability-slot ${isHoverSlot ? 'drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="ability-slot-main">
        <span className="ability-slot-index">#{index}</span>
        <div className="ability-slot-card">
          {def?.iconUrl && (
            <img className="ability-slot-icon" src={def.iconUrl} alt="" />
          )}
          <span className="ability-slot-name">{def?.name ?? abilityId}</span>
        </div>
        {binding && (
          <span className="ability-slot-key">{formatKeybind(binding)}</span>
        )}
        <div className="ability-slot-controls">
          <button
            className="ability-slot-btn ability-slot-remove"
            onClick={() => removeAbility(index)}
            title="Remove"
            type="button"
          >
            &times;
          </button>
        </div>
      </div>
      {offGcdIds.length > 0 && (
        <div className="ability-slot-offgcd">
          {offGcdIds.map((id) => (
            <OffGcdTag
              key={id}
              actionId={id}
              onRemove={() => removeOffGcdAction(index, id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
