En la pantalla /pos

se debe implementar la funcionalidad de poder generar
pedidos con articulos que no tengan existencia. Actualmente el sistema no deja agregar o seleccionar articulos sin existenca. Se debe dejar agregar al pedido.

Pero se debe garantizar que si el usuario intenta generar la factura, el sistema no permita generar la factura y muestre un mensaje de error indicando que no se puede generar la factura porque hay articulos sin existencia.

Si el usuario da click en realizar pedido, debe seguir 
su flujo normal sin bloquear por la falta de existencias, ya que un pedido no afecta el kardex, es
realmente una cotizacion, se debe validar que en el backend el flujo de pedido no bloquee en este caso.