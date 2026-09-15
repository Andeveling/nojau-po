# Errores frecuentes

Responde con el bloque de error copiable y su solución — Dani no toca
servidores, así que cada error trae qué pegar de vuelta.

## Duplicado (incluye borradas)

```
Error: Ya existe una etiqueta con este nombre en el tenant
```

El UNIQUE de `name` abarca filas soft-deleted: el nombre existe aunque no se
vea en la bandeja. Solución: pega otra ficha con variante (`_2`) o pide
reactivar la existente (`UPDATE is_active = 1`).

## Más de 500 caracteres

```
Error: El caso de asignación es obligatorio / supera 500 caracteres
```

`assignment_case` es `string(500)` (`SaveConversationTagRequest`). Solución:
recorta a una frase en palabras del cliente y reintenta con la ficha
corregida.

## Tag de sistema

```
Error: Bloqueado: id=<n> es tag de sistema (system_key=<clave>)
```

`Nueva`, `Abandonada` y `Finalizada` no se editan, desactivan ni borran
(`EnsureConversationTagIsEditableAction` + guard del plugin). Solución: crea
un tag custom con ese comportamiento en el `assignment_case`, sin tocar el de
sistema.

## NIT o empresa sin match

```
Error: Sin match en companies para '<dato>' — no escribo sin tenant validado
```

Solución: pega NIT exacto o nombre como aparece en la factura; confirmas la
company encontrada antes de seguir.

## Ficha mal formada

```
Error: Ficha incompleta — falta <campo> (NIT/nombre + name + assignment_case + aprobador)
```

Solución: reenvía la ficha con el campo faltante; lo ya dado se conserva.
