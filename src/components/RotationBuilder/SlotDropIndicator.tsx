interface SlotDropIndicatorProps {
  visible: boolean;
}

export default function SlotDropIndicator({ visible }: SlotDropIndicatorProps) {
  return (
    <div className={`slot-drop-indicator ${visible ? 'visible' : ''}`} />
  );
}
