const BLOCK_COUNT = 8;

const LEVEL_TO_FILLED_BLOCKS = {
  low: 2,
  medium: 4,
  high: 6,
};

export default function ConfusionFootprint({ level }) {
  if (typeof level !== "string") {
    return null;
  }

  const normalizedLevel = level.toLowerCase();
  const filledBlocks = LEVEL_TO_FILLED_BLOCKS[normalizedLevel];

  if (!filledBlocks) {
    return null;
  }

  const blocks = Array.from({ length: BLOCK_COUNT }, (_, index) => (
    <span
      key={index}
      className={`confusion-footprint-block${
        index < filledBlocks ? " filled" : ""
      }`}
    />
  ));

  return (
    <div className="confusion-footprint" aria-hidden="true">
      <span className="confusion-footprint-label">Confusion:</span>
      <span className="confusion-footprint-blocks">{blocks}</span>
    </div>
  );
}
