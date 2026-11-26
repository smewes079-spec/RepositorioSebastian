import { useEffect, useRef, useState } from 'react';

// Contenedor para tablas anchas. En vez de que la barra horizontal quede al
// fondo de la tabla (y haya que bajar hasta el final para moverse a los
// lados), muestra una barra "pegada" al borde inferior de la pantalla
// mientras la tabla está a la vista, sincronizada con la tabla.
//
// Importante: ningún contenedor padre puede tener `overflow-hidden` (rompe el
// `sticky`); para las esquinas redondeadas usar `overflow-clip`.
export default function ScrollHorizontal({ children }) {
  const contenidoRef = useRef(null);
  const barraRef = useRef(null);
  const esperados = useRef(new Map());
  const [anchoTotal, setAnchoTotal] = useState(0);
  const [desborda, setDesborda] = useState(false);

  useEffect(() => {
    const cont = contenidoRef.current;
    if (!cont) return undefined;
    const medir = () => {
      setAnchoTotal(cont.scrollWidth);
      setDesborda(cont.scrollWidth > cont.clientWidth + 1);
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(cont);
    if (cont.firstElementChild) obs.observe(cont.firstElementChild);
    return () => obs.disconnect();
  }, []);

  // Al aparecer la barra, que parta en la misma posición que la tabla.
  useEffect(() => {
    if (desborda && barraRef.current && contenidoRef.current) {
      barraRef.current.scrollLeft = contenidoRef.current.scrollLeft;
    }
  }, [desborda]);

  // Mueve `destino` a la posición de `origen`. Se recuerda la posición que se
  // le puso a `destino`, para reconocer el evento de scroll que eso provoca
  // (el "eco") y no devolverlo, así las dos barras no se pelean.
  function sincronizar(origen, destino) {
    if (!origen || !destino) return;
    const pos = origen.scrollLeft;
    const esperado = esperados.current.get(origen);
    esperados.current.delete(origen);
    if (esperado !== undefined && Math.abs(esperado - pos) < 1) return;
    if (Math.abs(destino.scrollLeft - pos) >= 1) {
      esperados.current.set(destino, pos);
      destino.scrollLeft = pos;
    }
  }

  return (
    <>
      <div
        ref={contenidoRef}
        className="overflow-x-auto sin-barra-scroll"
        onScroll={() => sincronizar(contenidoRef.current, barraRef.current)}
      >
        {children}
      </div>
      {desborda && (
        <div
          ref={barraRef}
          className="sticky bottom-0 z-20 overflow-x-scroll border-t border-black/5 bg-white/95"
          onScroll={() => sincronizar(barraRef.current, contenidoRef.current)}
        >
          <div style={{ width: anchoTotal, height: 1 }} />
        </div>
      )}
    </>
  );
}
