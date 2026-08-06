export default function Logo({ size = 44 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: '#CEC6C3' }}
    >
      <span
        className="font-serif text-white"
        style={{ fontSize: size * 0.52, lineHeight: 1, fontWeight: 600 }}
      >
        H
      </span>
    </div>
  );
}
