import { useState, useRef, useCallback, useEffect } from 'react';
import { useRotationBuilderStore } from '../../store/rotationBuilderStore';
import { compileEndTick } from '../../utils/compiler';
import AbilitySlot from './AbilitySlot';
import SlotDropIndicator from './SlotDropIndicator';

function getDragData(e: DragEvent): { actionId: string; category: string; sourceIndex?: number } | null {
  try {
    return JSON.parse(e.dataTransfer!.getData('application/json'));
  } catch {
    return null;
  }
}

export default function RotationTimeline() {
  const abilities = useRotationBuilderStore((s) => s.abilities);
  const setAbility = useRotationBuilderStore((s) => s.setAbility);
  const insertAbility = useRotationBuilderStore((s) => s.insertAbility);
  const addOffGcdAction = useRotationBuilderStore((s) => s.addOffGcdAction);
  const moveAbility = useRotationBuilderStore((s) => s.moveAbility);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragOverEnd, setDragOverEnd] = useState(false);
  const [dragSourceIndex, setDragSourceIndex] = useState(-1);
  const [hoverSlotIndex, setHoverSlotIndex] = useState(-1);

  const dragSourceRef = useRef(-1);

  const handleDragStartSlot = useCallback((index: number) => {
    dragSourceRef.current = index;
    setDragSourceIndex(index);
  }, []);

  const calcSlotFromCursor = useCallback(
    (clientY: number, sourceIndex: number) => {
      if (!containerRef.current) return { insertIndex: abilities.length, overSlot: -1 };
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const cursorY = clientY - containerTop + containerRef.current.scrollTop;

      const slotEls = containerRef.current.querySelectorAll('.ability-slot');
      let overSlot = -1;

      for (let i = 0; i < slotEls.length; i++) {
        if (i === sourceIndex) continue;
        const rect = slotEls[i].getBoundingClientRect();
        const slotTop = rect.top - containerTop + containerRef.current.scrollTop;
        const slotBottom = slotTop + rect.height;
        if (cursorY >= slotTop && cursorY <= slotBottom) {
          overSlot = i;
          break;
        }
      }

      let insertIndex = abilities.length;
      for (let i = 0; i < slotEls.length; i++) {
        if (i === sourceIndex) continue;
        const rect = slotEls[i].getBoundingClientRect();
        const slotMid = rect.top - containerTop + rect.height / 2 + containerRef.current.scrollTop;
        if (cursorY < slotMid) {
          insertIndex = i;
          break;
        }
      }

      return { insertIndex, overSlot };
    },
    [abilities.length],
  );

  useEffect(() => {
    const onDrag = (e: DragEvent) => {
      e.preventDefault();

      const src = dragSourceRef.current;
      if (src >= 0) {
        e.dataTransfer!.dropEffect = 'move';
      } else {
        e.dataTransfer!.dropEffect = 'copy';
      }

      const { insertIndex, overSlot } = calcSlotFromCursor(e.clientY, src);
      setDropIndex(insertIndex);
      setHoverSlotIndex(overSlot);
      setDragOverEnd(insertIndex >= abilities.length);
    };

    const onDragLeave = (e: DragEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (el.contains(e.relatedTarget as Node)) return;
      setDropIndex(null);
      setDragOverEnd(false);
      setHoverSlotIndex(-1);
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const data = getDragData(e);
      if (!data) return;

      const { insertIndex, overSlot } = calcSlotFromCursor(e.clientY, dragSourceRef.current);

      setDropIndex(null);
      setDragOverEnd(false);
      setHoverSlotIndex(-1);

      if (data.sourceIndex !== undefined) {
        let target = insertIndex;
        if (data.sourceIndex < target) target = target - 1;
        if (data.sourceIndex !== target) {
          moveAbility(data.sourceIndex, target);
        }
        dragSourceRef.current = -1;
        setDragSourceIndex(-1);
        return;
      }

      if (data.category.startsWith('items:')) {
        const attachIndex = overSlot >= 0 ? overSlot
          : insertIndex < abilities.length ? insertIndex
          : abilities.length - 1;
        if (attachIndex >= 0 && attachIndex < abilities.length) {
          addOffGcdAction(attachIndex, data.actionId);
        }
        return;
      }

      if (overSlot >= 0) {
        setAbility(overSlot, data.actionId);
      } else {
        insertAbility(insertIndex, data.actionId);
      }
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('dragover', onDrag);
    container.addEventListener('dragleave', onDragLeave);
    container.addEventListener('drop', onDrop);

    return () => {
      container.removeEventListener('dragover', onDrag);
      container.removeEventListener('dragleave', onDragLeave);
      container.removeEventListener('drop', onDrop);
    };
  }, [abilities.length, calcSlotFromCursor, moveAbility, insertAbility, addOffGcdAction, setAbility]);

  const tickDuration = abilities.length > 0
    ? compileEndTick({ id: '_', name: '_', abilities }) * 600
    : 0;

  return (
    <div className="rotation-timeline" ref={containerRef}>
      {abilities.length === 0 && (
        <div className="timeline-empty">
          <p className="timeline-empty-title">Drag abilities from the palette to start building</p>
          <p className="timeline-empty-hint">Or use the Load button to edit a built-in rotation</p>
        </div>
      )}

      {abilities.map((_, i) => (
        <div key={i}>
          <SlotDropIndicator visible={dropIndex === i} />
          <AbilitySlot
            index={i}
            isDragging={dragSourceIndex === i}
            isHoverSlot={hoverSlotIndex === i}
            onDragStartSlot={handleDragStartSlot}
          />
        </div>
      ))}

      {abilities.length > 0 && (
        <>
          <SlotDropIndicator visible={dropIndex === abilities.length || dragOverEnd} />
          <div className={`add-slot-zone ${dragOverEnd ? 'drag-over' : ''}`}>
            Drop ability here to add
          </div>
        </>
      )}

      {abilities.length > 0 && (
        <div className="timeline-stats">
          {abilities.length} action{abilities.length !== 1 ? 's' : ''}
          &nbsp;&middot;&nbsp;
          {(tickDuration / 1000).toFixed(1)}s est. duration
        </div>
      )}
    </div>
  );
}
