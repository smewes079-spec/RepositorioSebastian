export default function InfoAuditoria({ auditoria }) {
  if (!auditoria || (!auditoria.creadoPor && !auditoria.actualizadoPor)) return null;
  return (
    <p className="text-xs text-[#2C2420]/40 mb-4 max-w-3xl">
      {auditoria.creadoPor && <>Creado por {auditoria.creadoPor}</>}
      {auditoria.creadoPor && auditoria.actualizadoPor && auditoria.actualizadoPor !== auditoria.creadoPor && (
        <> · Última edición de {auditoria.actualizadoPor}</>
      )}
    </p>
  );
}
