# Reglas del negocio de corte

Este documento explica cómo funciona la app por dentro. El código en `src/lib/domain/` implementa exactamente estas reglas y tiene pruebas para cada una.

## 1. Dinero

- Todo se guarda en **centavos enteros** (`$1,234.50` → `123450`). Nunca se usan decimales para dinero, así las sumas siempre cuadran.
- Cuando algo no se divide exacto, los centavos que sobran se reparten de forma determinista (siempre a las mismas personas o a la misma mensualidad), para que el total repartido sea igual al original.

## 2. Grupos

- Un **grupo** junta a varias personas: una casa, unos roomies, un viaje.
- Cada miembro tiene un rol: `ADMIN` (puede confirmar pagos, editar tarjetas y gastos de otros) o `MEMBER`.

## 3. Tarjetas y fecha de corte

Una tarjeta pertenece a un grupo y tiene **un titular** (por ejemplo Perla). Se configura con:

- **Día de corte** (1 a 31). Si el mes no tiene ese día (corte el 31 en febrero), el corte cae en el último día del mes.
- **Días para pagar** después del corte (normalmente 20). La fecha límite es `corte + días para pagar`.

### ¿En qué estado de cuenta cae un cargo?

Un cargo hecho el día `d` entra al **primer corte que sea igual o posterior a `d`**.

Ejemplo con corte el día 5 y 20 días para pagar:

| Fecha del cargo | Corte en el que entra | Fecha límite de pago |
|---|---|---|
| 1 de noviembre | 5 de noviembre | 25 de noviembre |
| 5 de noviembre | 5 de noviembre | 25 de noviembre |
| 6 de noviembre | 5 de diciembre | 25 de diciembre |

El periodo de un estado de cuenta va del día siguiente al corte anterior hasta el día del corte, incluidos los dos.

## 4. Gastos

Un gasto tiene: descripción, monto total, fecha, tipo y **cómo se pagó**:

- **Pagó una persona** (efectivo, transferencia, su propia tarjeta): la deuda es con esa persona y no tiene fecha de corte.
- **Con una tarjeta del grupo**: la deuda es con el **titular** de la tarjeta y se acomoda en el estado de cuenta según la fecha.

Tipos de gasto (sirven para filtrar y para reportes, no cambian el cálculo):

- `SHARED`: compartido entre varios (luz, agua, internet, súper).
- `PERSONAL`: le toca todo a una persona.
- `GIFT`: un regalo. Se le carga a quien regala, no a quien lo recibe.

### Cómo se divide

Cada gasto tiene una lista de **partes**: quién paga cuánto. Formas de dividir:

- **Igual** entre las personas elegidas.
- **Por montos exactos** (tienen que sumar el total).
- **Por porcentajes** (tienen que sumar 100 %).

## 5. Compras a meses sin intereses (MSI)

- Un gasto con tarjeta puede ser **a N meses**. Contado = 1 mes.
- La mensualidad `i` (empezando en 1) entra al corte de la compra **+ (i − 1) meses**. La primera mensualidad cae en el mismo corte en el que caería la compra de contado.
- El monto de cada mensualidad es `total ÷ N` redondeado hacia abajo, y **la última mensualidad se lleva los centavos que sobran**.
- Cada parte de la división se reparte igual en sus mensualidades. Así, si a Beto le toca la mitad de un refri a 12 meses, en cada corte le toca la mitad de esa mensualidad.

## 6. Lo que cada quien debe en un corte

Para una tarjeta y un corte, a cada persona le toca la suma de:

- Sus partes de los gastos de contado que cayeron en ese periodo.
- Sus partes de las mensualidades que caen en ese corte.

La suma de todo debería ser igual al total del estado de cuenta del banco. Si no cuadra, falta registrar algo (o sobra).

Lo que le toca al **titular** no lo tiene que depositar a nadie, porque la tarjeta es suya. Igual se muestra, para que cuadre contra el estado de cuenta.

## 7. Pagos entre personas

- Un **pago** es "Beto le dio $1,300 a Perla". Puede ir ligado a un corte de una tarjeta para saber qué periodo está cubriendo.
- Por corte se ve para cada persona: lo que le toca, lo que ya pagó y lo que le falta.
- Si a la fecha límite falta dinero para cubrir el total, la app avisa: lo que falte va a generar intereses.

## 8. Saldos y simplificación de deudas

- Saldo de una persona = lo que pagó por otros − lo que le tocaba de lo que pagaron otros + pagos que hizo − pagos que recibió.
- Positivo: le deben. Negativo: debe. La suma de todos los saldos del grupo siempre es 0.
- Para liquidar con el menor número de transferencias, se empareja repetidamente a quien más debe con a quien más le deben.

## 9. Personas, cuentas y permisos

- En un grupo el dinero se relaciona con **personas**, no con cuentas. Se puede agregar a alguien que nunca se va a registrar (por ejemplo la abuela).
- Quien se une con el código puede **reclamar** a una persona sin cuenta para ver sus cuentas, o entrar como persona nueva.
- Solo los miembros de un grupo pueden ver y modificar sus datos; a cualquier otro se le responde como si el grupo no existiera.
- Por ahora cualquier miembro puede registrar, editar y borrar gastos y pagos (pensado para grupos de confianza como una familia). El admin además puede cambiar el código de invitación.
