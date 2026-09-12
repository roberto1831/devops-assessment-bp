# DevOps Technical Assessment - Banco Pichincha

Este proyecto es un microservicio REST con un endpoint `POST /DevOps`, protegido con API Key y un JWT que solo sirve para una transaccion. Va dentro de un contenedor y se despliega en Google Cloud con un pipeline de CI/CD escrito como codigo.

El desarrollo se hizo con TDD (Jest + Supertest con cobertura) y buscando codigo limpio: cada cosa en su lugar, separada en middleware, rutas, esquemas y utilidades.

---

## Stack

| Area              | Tecnologia                                      |
| ----------------- | ----------------------------------------------- |
| Lenguaje          | Node.js 20 + Express 5                          |
| Validacion        | Zod                                             |
| Autenticacion     | API Key (header) + JWT HS256 (`jsonwebtoken`)   |
| Testing           | Jest + Supertest (con cobertura)                |
| Analisis estatico | CodeQL (GitHub Code Scanning)                   |
| Contenedor        | Docker multi-stage, usuario no-root             |
| IaC               | Terraform (Artifact Registry) + Kustomize (K8s) |
| Cloud             | Cloud Run (desarrollo) - GKE (produccion)       |
| CI/CD             | GitHub Actions                                  |

---

## Como esta armado

```text
                     GitHub Actions (CI)
        lint -> test -> static-analysis (CodeQL) -> build
                              |
                 sube la imagen a Artifact Registry
                              |
            +-----------------+-----------------+
            |                                   |
      Deploy Dev                          Deploy Prod
   (cualquier rama)                       (rama master)
            |                                   |
       Cloud Run                      GKE + Ingress (LB)
                                       2+ replicas (HPA)
```

La idea es sencilla: cualquier push a una rama que no sea `master` va a **Cloud Run** para probar. Cuando algo llega a `master`, se despliega a **GKE**, detras de un **Ingress** que hace de load balancer, con minimo **2 replicas** y autoescalado por **HPA**.

---

## Endpoints

### `POST /DevOps`

Necesita los dos headers. Responde con el saludo usando el valor de `to`.

**Headers**

```http
X-Parse-REST-API-Key: <api-key>
X-JWT-KWY: <jwt>
```

**Body**

```json
{
  "message": "This is a test",
  "to": "Juan Perez",
  "from": "Rita Asturia",
  "timeToLifeSec": 45
}
```

**Respuesta `200`**

```json
{
  "message": "Hello Juan Perez your message will be send"
}
```

Si llamas a `/DevOps` con cualquier otro metodo (`GET`, `PUT`, `PATCH`, `DELETE`), devuelve el texto `ERROR`.

### `POST /token`

Genera un JWT nuevo para una transaccion. Pide la API Key.

```http
X-Parse-REST-API-Key: <api-key>
```

**Respuesta `200`**

```json
{ "token": "<jwt>" }
```

### `GET /health`

Chequeo de salud para el contenedor y el balanceador. Responde `200 OK`.

---

## Control de acceso (el "API Manager")

La gestion de API Key y JWT esta hecha dentro de la misma aplicacion, como middleware de Express, en vez de usar un API Manager aparte tipo Apigee o Kong. Lo decidi asi por simplicidad y para no arrastrar dependencias externas en el alcance de esta prueba. Mas abajo explico como se migraria a un gateway de verdad si el proyecto creciera.

Cada request pasa por este orden:

```text
API Key  ->  JWT  ->  Payload  ->  Logica de negocio
```

### API Key

Va en el header `X-Parse-REST-API-Key` y se compara contra el valor esperado (`API_KEY`). Si no viene o no coincide, corta con `401 Unauthorized`.

### JWT

Va en el header `X-JWT-KWY`. Para pasar tiene que cumplir cuatro cosas: firma valida (HS256), no estar expirado, traer `jti`, y no haberse usado antes. Si falla cualquiera, `401 Unauthorized`.

Los claims que lleva:

```json
{
  "sub": "banco-pichincha-assessment",
  "jti": "<uuid>",
  "iat": 0,
  "exp": 0
}
```

- `sub` dice quien consume la API.
- `iat` es cuando se emitio.
- `exp` cuando expira (60 segundos).
- `jti` es el identificador unico de esa transaccion.

### Que sea unico por transaccion

Los `jti` que ya se usaron se guardan en memoria. Si alguien intenta reusar el mismo JWT, se rechaza con `401`.

> **Algo que hay que tener claro:** guardar los `jti` en memoria es simple y rapido, pero no comparte estado entre replicas. En produccion con varios nodos, esto deberia apoyarse en algo compartido como Redis (Memorystore). Para esta prueba lo dejo en memoria a proposito, pero lo menciono porque es la limitacion real de este enfoque.

---

## Correrlo en local

Necesitas Node.js 20 y, si quieres, Docker.

```bash
# 1. Instalar dependencias
npm ci

# 2. Armar tu archivo de variables desde el ejemplo
cp src/.env.example src/.env
# Edita src/.env con tus valores

# 3. Levantar el servicio
npm start
# Server running on port 8080
```

### Sacar un JWT de prueba

```bash
node scripts/generate-jwt.js
```

Te imprime un token valido por 60 segundos, listo para pegarlo en el header `X-JWT-KWY`.

### Probar el endpoint

```bash
API_KEY="<tu-api-key>"
JWT="$(node scripts/generate-jwt.js)"

curl -X POST \
  -H "X-Parse-REST-API-Key: ${API_KEY}" \
  -H "X-JWT-KWY: ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{"message":"This is a test","to":"Juan Perez","from":"Rita Asturia","timeToLifeSec":45}' \
  http://localhost:8080/DevOps
```

---

## Tests

```bash
npm test
```

Corre Jest con cobertura. Los tests cubren la autenticacion (API Key y JWT), el rechazo de un JWT reusado, la validacion del payload, la respuesta correcta del endpoint, el `ERROR` en los metodos que no van, y el health check.

---

## Docker

```bash
docker build -t devops-service .
docker run -p 8080:8080 --env-file src/.env devops-service
```

La imagen es multi-stage, corre como usuario no-root (`node`) y trae un `HEALTHCHECK` que pega a `/health`.

---

## Infraestructura como codigo

```text
infra/
├── terraform/          # Artifact Registry, proyecto GCP
└── k8s/
    ├── base/           # deployment, service, ingress, hpa, secret, namespace
    └── overlays/prod/  # kustomization de produccion
```

Terraform se encarga del Artifact Registry donde viven las imagenes. Kustomize define los manifiestos de Kubernetes: el `Deployment` corre 2 replicas, el `HPA` escala de 2 a 6 pods segun CPU, y el `Ingress` hace de load balancer.

---

## El pipeline (CI/CD como codigo)

Todo esta en `.github/workflows/`. Corre en cualquier rama, y `master` es la que despliega a produccion.

### `ci.yml` - corre en cada push

| Job               | Que hace                                                                             |
| ----------------- | ------------------------------------------------------------------------------------ |
| `lint`            | ESLint y revision de formato con Prettier.                                           |
| `test`            | `npm audit`, tests con cobertura y publica el reporte.                               |
| `static-analysis` | Analisis estatico con CodeQL sobre el codigo JavaScript.                             |
| `build`           | Construye la imagen (tag `latest` + `sha-<commit>`), la sube y la escanea con Trivy. |

Las dependencias se instalan con `npm ci` usando el `package-lock.json`, asi la instalacion siempre es la misma.

### `deploy-dev.yml`

Se dispara cuando el CI termina bien en una rama que no es `master`, o a mano con `workflow_dispatch`. Despliega a Cloud Run.

### `deploy-prod.yml`

Se dispara con un push a `master` (con entorno `production` y aprobacion), o a mano. Despliega a GKE con Kustomize, espera el rollout y hace rollback solo si algo falla.

> Para hablar con GCP, el pipeline usa Workload Identity Federation. Asi no hay claves de service account guardadas en el repositorio.

---

## Seguridad

- API Key obligatoria y validada de verdad contra el valor esperado.
- JWT firmado con HS256, unico por transaccion y con expiracion automatica de 60 segundos.
- El contenedor corre como usuario no-root.
- Las imagenes se escanean con Trivy (CRITICAL y HIGH).
- El codigo pasa por analisis estatico con CodeQL.
- Las credenciales del CI/CD se manejan con Workload Identity Federation.

---

## Si esto tuviera que crecer a un API Manager de verdad

El control de acceso actual esta en middleware, pero se puede mover a un gateway dedicado sin tocar la logica de negocio:

- **Apigee** - OAuth, rate limiting, analytics, politicas de seguridad.
- **Kong** - API Gateway con validacion de JWT y API Key, control de trafico.
- **Cloud Endpoints** - OpenAPI, IAM, validacion de JWT, monitoreo.

En cualquiera de esos casos, el gateway se encargaria de validar la API Key y el JWT antes de que la peticion llegue al microservicio, y el registro de `jti` pasaria a Redis para funcionar bien entre varias replicas.
