export default function Logo({ size = 44 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: '#CEC6C3' }}
    >
      <img
        src="/logo-icono-blanco.png"
        alt="Hatton Schultz Atelier"
        style={{ width: size * 0.62, height: 'auto' }}
      />
    </div>
  );
}
