function soloDigitos(str) {
  return String(str ?? '').replace(/[^\d]/g, '');
}

function formatear(digitos) {
  if (!digitos) return '';
  const sinCeros = digitos.replace(/^0+(?=\d)/, '');
  return Number(sinCeros).toLocaleString('es-CL');
}

export default function MoneyInput({ value, onChange, placeholder, className, required }) {
  function handleChange(e) {
    const digitos = soloDigitos(e.target.value);
    const sinCeros = digitos.replace(/^0+(?=\d)/, '');
    onChange(sinCeros ? Number(sinCeros) : 0);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      required={required}
      value={formatear(soloDigitos(value))}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
