# corte

**Gastos compartidos, a tiempo.** App para repartir gastos entre familia, roomies o amigos, con algo que las apps conocidas no hacen: controlar una **tarjeta de crédito compartida** (fecha de corte, fecha límite para no pagar intereses y compras a **meses sin intereses**).

## El problema

En muchas casas en México todos usan la tarjeta de una sola persona: para la luz, el súper, compras personales, regalos y cosas a meses. El titular recibe el estado de cuenta y tiene que calcular a mano cuánto le debe cada quien y cobrarle antes de la fecha límite, porque si no se paga el total, el banco cobra intereses. Además, lo que se compra un día después del corte ya no entra en ese mes, y las compras a meses se cobran un pedazo en cada corte.

corte hace esas cuentas solo: cada cargo cae en su corte, se reparte entre quien corresponde y cada persona ve cuánto depositar y para cuándo.

## Qué puedes hacer

- Crear un grupo e invitar con un código o link. Puedes agregar personas sin cuenta y después ellas "reclaman" su nombre al unirse.
- Dar de alta tarjetas con titular, día de corte y días para pagar.
- Registrar gastos: compartidos (igual, por montos o por porcentaje), personales o regalos; pagados con tarjeta del grupo (contado o a 3–24 MSI) o por una persona.
- Ver el **estado de cuenta por corte**: lo que le toca a cada quien con su desglose, lo que ya depositó y lo que falta, y compararlo contra el total del banco.
- Registrar depósitos al titular y pagos entre personas.
- Ver saldos del grupo y las transferencias mínimas para quedar a mano.
- Ver lo que viene en los próximos cortes (mensualidades).
- Crear un **grupo de ejemplo** con un clic para probar todo.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + TypeScript
- Tailwind CSS 4 con la paleta de la marca
- PostgreSQL con [Drizzle ORM](https://orm.drizzle.team). En desarrollo usa [PGlite](https://pglite.dev) (PostgreSQL dentro del proyecto, sin instalar nada)
- Sesiones propias con cookies httpOnly, contraseñas con scrypt e inicio con Google (OAuth 2.0 con PKCE, sin librerías)
- Zod para validar formularios, Vitest para las pruebas

## Estructura

```
src/
  app/                 páginas (Next.js App Router)
    (auth)/            registro, inicio de sesión
    grupos/            mis grupos, crear, unirse, ejemplo
    unirse/[code]/     link de invitación
    g/[groupId]/       resumen, tarjetas, corte, gastos, movimientos, personas
  components/          UI compartida (marca, formularios, display)
  db/                  esquema de Drizzle y conexión
  lib/
    domain/            lógica pura: cortes, MSI, divisiones, saldos (con pruebas)
    auth/              contraseñas y sesiones
    groups/            consultas, acciones del servidor, validación, ejemplo
drizzle/               migraciones SQL
docs/reglas.md         reglas del negocio explicadas
```

La lógica importante vive en `src/lib/domain/` y no depende de React ni de la base de datos, así se prueba sola. Las reglas están en [`docs/reglas.md`](docs/reglas.md).

## Correrlo en tu computadora

Necesitas **Node.js 20.9 o más nuevo** (`node -v` para revisar).

```bash
npm install
npm run dev        # abre http://localhost:3000
```

La primera vez se crea la base de datos sola en la carpeta `.data/`. Para empezar de cero, borra esa carpeta.

Otros comandos:

```bash
npm test           # pruebas de la lógica
npm run lint
npm run build      # build de producción
npm run db:generate  # genera una migración nueva si cambias src/db/schema.ts
```

## Iniciar sesión con Google (opcional)

1. En [Google Cloud Console](https://console.cloud.google.com/auth/overview) crea un proyecto y configura la app (público: Externo). No hace falta activar la prueba gratuita ni poner tarjeta.
2. En **Clientes → Crear cliente** elige "Aplicación web" y agrega:
   - Origen autorizado: `http://localhost:3000`
   - URI de redireccionamiento: `http://localhost:3000/api/auth/google/callback`
3. Copia `.env.example` como `.env` y pega el ID y el secreto del cliente en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
4. Reinicia `npm run dev`. En Entrar y Crear cuenta aparece "Continuar con Google".

Mientras la app de Google esté "en prueba", solo los correos agregados como usuarios de prueba pueden entrar. Si alguien ya tenía cuenta con el mismo correo, se liga a esa cuenta.

## Producción

Pon la variable `DATABASE_URL` con un PostgreSQL real (por ejemplo [Neon](https://neon.tech), gratis) y la app usa esa base en lugar de PGlite. Las migraciones se aplican solas al arrancar.
