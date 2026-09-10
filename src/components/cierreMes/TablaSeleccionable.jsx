import React, { useMemo } from 'react';

/**
 * Grilla con seleccion multiple. `columnas` describe cada celda y
 * `esSeleccionable` decide que filas muestran checkbox.
 */
const TablaSeleccionable = ({
  items,
  columnas,
  seleccionados,
  onToggle,
  onToggleTodos,
  getId,
  esSeleccionable = () => true,
  mensajeVacio = 'No hay registros.',
  getClaseFila,
}) => {
  const seleccionables = useMemo(() => items.filter(esSeleccionable), [items, esSeleccionable]);
  const todosSeleccionados =
    seleccionables.length > 0 && seleccionables.every((item) => seleccionados.has(getId(item)));

  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-500 bg-white/60 rounded-xl border border-dashed border-gray-300">
        {mensajeVacio}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="border-b border-gray-200">
            <th className="w-10 py-2.5 px-3">
              {seleccionables.length > 0 && (
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={() => onToggleTodos(seleccionables.map(getId))}
                  className="w-4 h-4 accent-[#f58ea3] cursor-pointer"
                  aria-label="Seleccionar todos"
                />
              )}
            </th>
            {columnas.map((col) => (
              <th
                key={col.key}
                className={`py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const id = getId(item);
            const seleccionable = esSeleccionable(item);
            return (
              <tr
                key={id}
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${getClaseFila?.(item) ?? ''}`}
              >
                <td className="py-2.5 px-3">
                  {seleccionable && (
                    <input
                      type="checkbox"
                      checked={seleccionados.has(id)}
                      onChange={() => onToggle(id)}
                      className="w-4 h-4 accent-[#f58ea3] cursor-pointer"
                      aria-label={`Seleccionar ${id}`}
                    />
                  )}
                </td>
                {columnas.map((col) => (
                  <td
                    key={col.key}
                    className={`py-2.5 px-3 ${col.align === 'right' ? 'text-right' : 'text-left'} ${
                      col.clase ?? 'text-gray-700'
                    }`}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TablaSeleccionable;
