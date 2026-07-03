import BuilderToolbar from './BuilderToolbar';
import AbilityPalette from './AbilityPalette';
import RotationTimeline from './RotationTimeline';
import './RotationBuilder.css';

export default function RotationBuilder() {
  return (
    <div className="rotation-builder">
      <BuilderToolbar />
      <div className="builder-body">
        <AbilityPalette />
        <RotationTimeline />
      </div>
    </div>
  );
}
