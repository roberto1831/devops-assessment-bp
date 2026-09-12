# API Manager - Diseno del control de acceso

Este documento explica como se maneja el control de acceso del microservicio: que cabeceras se validan, en que orden, que lleva el JWT y como se garantiza que no se reutilice. Al final describo como se llevaria esto a un API Manager comercial si el servicio creciera.

En esta entrega, la gestion de API Key y JWT esta implementada dentro de la propia aplicacion, como middleware de Express. No use un API Manager dedicado a proposito: para el alcance de la prueba priorice simplicidad, portabilidad y no depender de servicios externos. Aun asi, dejo documentado el camino de migracion, porque esa es la interpretacion mas ambiciosa del requisito.

---

## Orden de validacion

Cada peticion pasa por tres filtros, siempre en el mismo orden. Si uno falla, se corta ahi y no se sigue al siguiente:

```text
1. API Key   ->   2. JWT   ->   3. Cuerpo (payload)   ->   Logica de negocio
```

La razon del orden es practica: primero lo mas barato de verificar y lo que descarta mas trafico no autorizado (la API Key), luego lo que necesita trabajo criptografico (el JWT), y solo al final se valida la forma del cuerpo. No tiene sentido gastar en verificar un token si la API Key ya venia mal.

---

## 1. API Key

Se valida la cabecera:

```http
X-Parse-REST-API-Key
```

El valor que llega se compara contra el esperado (`API_KEY`, inyectado por variable de entorno). Si la cabecera no viene, o viene pero no coincide, la respuesta es:

```http
401 Unauthorized
```

Esto vive en `src/middleware/apiKey.js` y es lo primero que corre en las rutas protegidas.

---

## 2. JWT

Se valida la cabecera:

```http
X-JWT-KWY
```

El token tiene que cumplir cuatro condiciones para pasar. Si falla cualquiera, es `401 Unauthorized`:

- Firma valida (HS256).
- No estar expirado.
- Traer el claim `jti`.
- No haberse usado antes.

Esto vive en `src/middleware/jwt.js`.

### Que lleva el JWT

```json
{
  "sub": "banco-pichincha-assessment",
  "jti": "<uuid>",
  "iat": 0,
  "exp": 0
}
```

- `sub` identifica al consumidor de la API.
- `iat` es el momento de emision.
- `exp` es el momento de expiracion.
- `jti` es un identificador unico (UUID v4) para esa transaccion puntual.

### Cuanto dura

El token expira a los **60 segundos** de emitirse. Es una ventana corta a proposito: suficiente para completar la llamada, pero lo bastante breve para que un token filtrado sirva de poco.

El token se genera con `POST /token` (que tambien pide la API Key) o con el script `scripts/generate-jwt.js` para pruebas.

---

## Como se garantiza que no se reutilice

Cada JWT sirve para una sola transaccion. Cuando un token se usa correctamente, su `jti` se guarda en un registro de tokens consumidos. Si mas tarde llega otra peticion con el mismo token, el `jti` ya esta en ese registro y se rechaza con `401 Unauthorized`.

Hoy ese registro es un almacen en memoria dentro del proceso. Es simple y rapido.

> **Limitacion conocida:** al estar en memoria, ese registro no se comparte entre replicas. Con varios nodos detras del balanceador, un token usado en el nodo A todavia se veria como valido en el nodo B. Para produccion real, ese registro deberia moverse a un almacen compartido como Redis (Memorystore), de modo que el anti-replay funcione igual sin importar que nodo atienda la peticion. Lo dejo en memoria a proposito para esta prueba, pero lo dejo escrito porque es el punto que hay que resolver al escalar.

---

## Como crecer a un API Manager comercial

El enfoque de middleware cumple el requisito, pero si el servicio creciera, la validacion de API Key y JWT se puede mover a un gateway dedicado sin cambiar la logica de negocio. El gateway se encargaria de autenticar antes de que la peticion llegue al microservicio, y el registro de `jti` pasaria a Redis para operar de forma consistente entre replicas.

Las opciones que manejaria:

- **Apigee** - gateway administrado de Google Cloud. Suma OAuth, rate limiting, analytics y politicas de seguridad configurables. Encaja bien porque el resto del stack ya esta en GCP.
- **Kong** - gateway open source. Tiene plugins listos para validar JWT y API Key, y para control de trafico. Buena opcion si se busca algo portable y no atado a un cloud.
- **Cloud Endpoints** - tambien de Google Cloud. Se apoya en una especificacion OpenAPI, se integra con IAM, valida JWT y aporta monitoreo.

En cualquiera de los tres, la aplicacion se quedaria enfocada solo en la logica de negocio, y toda la capa de seguridad de acceso (API Key, JWT, rate limiting, cuotas) viviria en el gateway.
