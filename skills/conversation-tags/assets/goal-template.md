# Goal <empresa> — <nit> — <yyyy-mm-dd>

> Un archivo por cliente: `docs/goals/<nit>-<yyyy-mm-dd>.md`.
> El agente lo genera, Dani lo aprueba con `ok` y solo entonces hay escritura.

- Cliente:
- NIT:
- Tenant DB:
- Fecha:
- Aprobador:
- Estado: pendiente-ok | aprobado

## Objetivo (en palabras del cliente)

Qué debe hacer la instancia (paneles, tags, terms).

## Estado leído

Ids de `agent_configs` por type, conteo de hijos, tags custom, terms.

## Fichas de entrada

Tal como Dani las pegó (paneles, FAQs, transfers, activations, instrucciones,
botones, tags, terms).

## Config DB exacta

Sentencias en orden: UPDATE configs → hijos → tags → terms.

## Verificación por lecturas

`SELECT` posteriores y qué se ve en `/agents` y en la bandeja.

## Fuera de scope

Tags de sistema, `onboarding`/`commerce`, clasificador, campañas, WPI, Ciesa,
otros tenants.
