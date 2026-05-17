# Requerimientos Funcionales del Cliente

## 1. Contexto del Proyecto
DIGITALICE requiere una plataforma web EdTech para gestionar la inscripción, seguimiento académico y facturación de sus programas de formación. La plataforma deberá cubrir tres tipos de productos académicos con sus respectivos módulos  docentes, estudiantes y flujos de pago.

Los productos académicos deben mantener la siguiente estructura

nombre del curso, codigo estandar, n° de Módulos
Por ejemplo, considera que cada "," es otra columna para este punto:

- Curso, NCU_XXXXX, 1, NCU_001_MOD1
- Curso Experto, NCE_XXXXX, 3, [NCE_001_MOD1, NCE_001_MOD2, NCE_001_MOD3]
- Diplomado, NCD_XXXXX,5,NCD10925_MOD1,[NCD10925_MOD2,NCD10925_MOD3,NCD10925_MOD4,NCD10925_MOD5]



## 2. Usuarios del Sistema
Describe los tipos de usuarios.

Ejemplo:
- Administrador: Gestión total del sistema, CRUD completo en todos los módulos
- Coordinador: Gestión operativa académica, Inscripciones, notas, reportes
- Docente: Acceso a sus módulos asignados, Ver estudiantes, cargar notas
- Estudiante: Acceso a sus módulos asignados, Ver estudiantes, cargar notas

| Rol         | Descripción                    | Permisos Clave                     |
| ----------- | ------------------------------ | ---------------------------------- |
| Admin       | Gestión total del sistema      | CRUD completo en todos los módulos |
| Coordinador | Gestión operativa académica    | Inscripciones, notas, reportes     |
| Docente     | Acceso a sus módulos asignados | Ver estudiantes, cargar notas      |
| Estudiante  | Acceso a su progreso           | Ver módulos, notas, estado de pago |



## 3. Módulos Principales
Lista las áreas funcionales del sistema.

Ejemplo:
- Autenticación
- Gestión de Notas y Certifiaciones
- Gestión de Producto Académico
- Gestión de pagos 
- Gestión de Reportes 

## 4. Requerimientos Funcionales

# Requerimientos Funcionales del Sistema Académico

## 1. Módulo: Productos Académicos

---

### RF-001: Registrar producto académico

**Módulo:** Productos Académicos  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** registrar un producto académico,  
**para** crear cursos, cursos expertos o diplomados dentro del sistema.

**Descripción funcional:**  
El sistema debe permitir registrar productos académicos con código único, nombre, tipo de producto, cantidad de módulos esperados e información institucional.

El producto académico representa la oferta principal que será posteriormente inscrita por los estudiantes.

**Campos requeridos:**

| Campo | Tipo | Validación |
|---|---|---|
| Código del producto | Texto | Obligatorio, único, formato NCD/NCE/NCU + dígitos + año |
| Nombre del producto | Texto | Obligatorio, máximo 200 caracteres |
| Tipo de producto | Select | DIPLOMADO, CURSO_EXPERTO o CURSO |
| Institución | Select/Text | Obligatorio |
| Aprobado por Ministerio | Boolean | Sí/No |
| Estado | Boolean | Activo/Inactivo |

**Reglas de negocio:**

- El código del producto debe ser único en todo el sistema.
- El tipo de producto determina automáticamente la cantidad de módulos:
  - CURSO: 1 módulo.
  - CURSO_EXPERTO: 3 módulos.
  - DIPLOMADO: 5 módulos.
- El producto debe crearse junto con sus módulos en una sola operación.
- No debe permitirse guardar un producto sin sus módulos requeridos.
- Una vez guardado el producto, los nombres de los módulos asociados no deben modificarse directamente.
- La creación debe ser transaccional: producto, módulos y slots deben guardarse juntos.

**Criterios de aceptación:**

- El sistema debe validar el formato del código antes de guardar.
- El sistema debe rechazar códigos duplicados.
- El sistema debe calcular automáticamente el número de módulos según el tipo seleccionado.
- El sistema debe mostrar errores si faltan campos obligatorios.
- El sistema debe guardar el producto y sus módulos en una transacción atómica.
- Si ocurre un error durante el guardado, no debe quedar información parcial registrada.

Al inicializar el sistema en producción, se debe ejecutar un seed que cargue los 22 diplomados del Excel oficial:

| Código | Nombre del Diplomado |
|---|---|
| NCD02823v1 | Compliance Empresarial y Blindaje Corporativo |
| NCD03823v2 | Transformación Digital |
| NCD05423v1 | Transformación Digital y Ciencia de Datos |
| NCD05523v1 | Investigación para las Ciencias Sociales |
| NCD01424 | Modelos cuantitativos aplicados a Finanzas y Economía |
| NCD01524 | Marketing Digital, E-Commerce & Social Media |
| NCD05024 | Blockchain, Activos Virtuales y Mercados Financieros |
| NCD08924 | Educación Superior para Ciencias Empresariales |
| NCD09124 | Métodos Cuantitativos para la investigación social |
| NCD01225 | Microfinanzas, Riesgos Financieros y FINTECH |
| NCD10925 | Analítica de Datos |
| NCD11025 | Banca y Gestión Integral de Riesgo |
| NCD04225 | Data Engineering |
| NCD08625 | Finanzas Sostenibles y Gestión de Riesgos |
| NCD09025 | Microfinanzas, Gestión de Riesgos y Fintech |
| NCD11125 | Business Analytics con Power BI |
| NCD11225 | Data Engineering (nueva versión) |
| NCD11325 | Finanzas Cuantitativas con Python |
| NCD11625 | Educación Superior basado en Competencias e Innovación Tecnológica |
| NCD11725 | Gestión del Talento Humano y People Analytics |
| NCD11825 | Innovación Financiera y Business Intelligence |
| NCD11925 | Marketing Digital y Diseño Gráfico |

---

### RF-002: Registrar módulos durante la creación del producto

**Módulo:** Productos Académicos  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** ingresar los nombres de los módulos al crear un producto académico,  
**para** definir la estructura académica completa del producto desde su creación.

**Descripción funcional:**  
El sistema debe mostrar dinámicamente los campos de módulos según el tipo de producto seleccionado.

Los módulos deben cargarse en el mismo acto de creación del producto académico. Una vez guardados, los nombres de módulos son inmutables.

**Campos requeridos:**

| Campo | Tipo | Validación |
|---|---|---|
| Nombre del módulo | Texto | Obligatorio |
| Número de módulo | Entero | Generado según posición |
| Código de slot | Texto | Generado automáticamente |

**Reglas de negocio:**

- Si el producto es CURSO, el sistema debe solicitar 1 módulo.
- Si el producto es CURSO_EXPERTO, el sistema debe solicitar 3 módulos.
- Si el producto es DIPLOMADO, el sistema debe solicitar 5 módulos.
- No deben existir nombres de módulos duplicados dentro del mismo producto.
- Los módulos se deben asociar al producto mediante la tabla `producto_modulos`.
- Cada módulo debe ocupar un slot único dentro del producto.
- Un producto no puede tener dos módulos con el mismo número de módulo.
- El código del slot debe generarse automáticamente con el patrón: `CODIGO_PRODUCTO_MODN`.

**Ejemplo:**

| Producto | Módulo | Código slot |
|---|---|---|
| NCD10925 | Módulo 1 | NCD10925_MOD1 |
| NCD10925 | Módulo 2 | NCD10925_MOD2 |
| NCD10925 | Módulo 3 | NCD10925_MOD3 |

**Criterios de aceptación:**

- El sistema debe mostrar automáticamente la cantidad correcta de campos de módulo.
- Cada nombre de módulo debe ser obligatorio.
- El sistema debe impedir nombres duplicados dentro del mismo producto.
- El sistema debe generar automáticamente el código de slot.
- El sistema debe guardar la relación producto-módulo correctamente.
- El sistema debe impedir que se guarde un producto si falta algún módulo requerido.

---

### RF-003: Reutilizar módulos existentes

**Módulo:** Productos Académicos  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** que el sistema reutilice módulos existentes cuando tengan el mismo nombre oficial,  
**para** evitar duplicidad de módulos en el catálogo académico.

**Descripción funcional:**  
Antes de crear un nuevo módulo, el sistema debe verificar si ya existe un módulo con el mismo nombre exacto.

Si existe, debe reutilizarlo. Si no existe, debe crear uno nuevo.

**Reglas de negocio:**

- La comparación debe realizarse por nombre oficial exacto.
- Si el módulo ya existe, el sistema no debe crear un duplicado.
- Si el módulo no existe, el sistema debe registrarlo en la tabla `modulos`.
- La reutilización del módulo no debe afectar su uso en otros productos.
- Un mismo módulo puede estar presente en diferentes productos académicos.
- La relación entre producto y módulo debe mantenerse mediante `producto_modulos`.

**Criterios de aceptación:**

- El sistema debe buscar el módulo antes de crearlo.
- El sistema debe reutilizar la entidad si encuentra coincidencia exacta.
- El sistema debe crear una nueva entidad si no existe coincidencia.
- El usuario no debe tener que realizar esta validación manualmente.
- El sistema debe mantener un catálogo limpio de módulos sin duplicados innecesarios.

---

## 2. Módulo: Estudiantes

---

### RF-004: Registrar estudiante

**Módulo:** Estudiantes  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** registrar estudiantes con sus datos personales, académicos, laborales y de contacto,  
**para** gestionar su inscripción en productos académicos.

**Descripción funcional:**  
El sistema debe permitir registrar la ficha completa del estudiante, basada en la ficha oficial de inscripción.

**Campos del formulario:**

| Grupo | Campos | Validación |
|---|---|---|
| Datos personales | Nombres, Apellidos | Texto obligatorio |
| Identificación | C.I., Extensión | C.I. numérico único y extensión seleccionable |
| Contacto | Celular/WhatsApp, Correo | Celular numérico, correo válido y único |
| Datos adicionales | Fecha de nacimiento, Estado civil, Dirección, Ciudad | Date, select y texto |
| Formación | Universidad, Carrera, Grado académico | Texto o select |
| Trabajo | Institución, Cargo, Año de inicio | Texto y número |
| Teléfonos | Teléfono oficina, Teléfono domicilio | Numéricos opcionales |
| Inscripción | Tipo de programa, Nombre del programa, Paralelo | Select encadenado |
| Pago | Método de pago | Al contado o cuotas |
| Compromiso | Declaración de compromiso de pago | Checkbox requerido si elige cuotas |

**Reglas de negocio:**

- El C.I. debe ser único.
- El correo electrónico debe ser único.
- La extensión del C.I. debe seleccionarse desde una lista controlada.
- El método de pago es obligatorio.
- Si el estudiante elige pago en cuotas, debe aceptar el compromiso de pago.
- El campo “Selecciona el Programa” debe controlar qué lista de productos se muestra.
- La lógica del formulario debe ser condicional según el tipo de programa seleccionado.
- El estudiante debe registrarse con estado activo por defecto.

**Criterios de aceptación:**

- El sistema debe validar campos obligatorios antes de guardar.
- El sistema debe rechazar C.I. duplicado.
- El sistema debe rechazar correo duplicado.
- El sistema debe validar formato de correo.
- El sistema debe mostrar los productos según el tipo de programa seleccionado.
- El sistema debe exigir compromiso de pago cuando la modalidad sea cuotas.
- El sistema debe guardar al estudiante con estado activo por defecto.

---

### RF-005: Formulario condicional de inscripción de estudiante

**Módulo:** Estudiantes / Inscripciones  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** que el formulario cambie dinámicamente según el tipo de programa seleccionado,  
**para** evitar errores al asociar estudiantes con productos académicos incorrectos.

**Descripción funcional:**  
El sistema debe mostrar opciones diferentes de productos según el tipo de programa seleccionado por el usuario.

**Reglas de negocio:**

- Si el usuario selecciona DIPLOMADO, el sistema debe mostrar solo diplomados activos.
- Si el usuario selecciona CURSO_EXPERTO, el sistema debe mostrar solo cursos expertos activos.
- Si el usuario selecciona CURSO, el sistema debe mostrar solo cursos activos.
- No deben mostrarse productos inactivos.
- El paralelo debe seleccionarse después de elegir el producto académico.
- Si el usuario cambia el tipo de programa, debe limpiarse la selección previa del producto.

**Criterios de aceptación:**

- El selector de programa debe filtrar correctamente los productos.
- El sistema no debe permitir seleccionar productos de otro tipo.
- El sistema debe limpiar el producto seleccionado si el usuario cambia el tipo de programa.
- El sistema debe validar que exista producto seleccionado antes de guardar la inscripción.
- El sistema debe evitar inconsistencias entre tipo de programa y producto seleccionado.

---

## 3. Módulo: Inscripciones

---

### RF-006: Inscribir estudiante a producto académico

**Módulo:** Inscripciones  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** inscribir a un estudiante en un producto académico,  
**para** iniciar su proceso académico y financiero dentro del sistema.

**Descripción funcional:**  
El sistema debe permitir buscar un estudiante y asociarlo a un producto académico específico, generando la inscripción y el detalle de módulos correspondientes.

**Flujo funcional:**

1. El usuario busca al estudiante por C.I., nombre o apellido.
2. El sistema muestra los datos principales del estudiante.
3. El usuario selecciona el producto académico.
4. El usuario selecciona el paralelo.
5. El sistema valida si el estudiante ya cursó módulos del producto.
6. El sistema identifica posibles módulos aprobados previamente.
7. El usuario confirma la inscripción.
8. El sistema crea la inscripción.
9. El sistema crea el detalle en `inscripcion_modulos`.
10. El sistema genera el plan de pagos.

**Reglas de negocio:**

- Solo se puede inscribir estudiantes activos.
- Solo se puede seleccionar productos activos.
- Cada inscripción debe estar asociada a un estudiante y a un producto.
- El estado inicial de la inscripción debe ser ACTIVO, salvo que todos los módulos queden convalidados.
- La inscripción debe generar automáticamente el detalle de módulos.
- El sistema debe generar el plan de pagos según el método elegido.
- La inscripción debe registrar el usuario que realizó la operación mediante `created_by`.

**Criterios de aceptación:**

- El sistema debe permitir búsqueda por C.I. o nombre.
- El sistema debe mostrar alerta si el estudiante tiene módulos aprobados previamente.
- El sistema debe crear la inscripción correctamente.
- El sistema debe crear los registros en `inscripcion_modulos`.
- El sistema debe asociar cada módulo inscrito al slot correspondiente de `producto_modulos`.
- El sistema debe generar pagos automáticamente según la modalidad seleccionada.

---

### RF-007: Convalidar módulos automáticamente

**Módulo:** Inscripciones / Convalidaciones  
**Prioridad:** Alta  

**Como** coordinador o administrador,  
**quiero** que el sistema convalide automáticamente los módulos aprobados previamente por el estudiante,  
**para** evitar que el estudiante repita módulos ya aprobados.

**Descripción funcional:**  
Cuando un estudiante se inscribe a un nuevo producto académico, el sistema debe revisar sus inscripciones anteriores y detectar módulos ya aprobados.

**Reglas de negocio:**

- La convalidación debe realizarse por comparación del nombre oficial del módulo.
- Si el estudiante tiene un módulo aprobado con nota mayor o igual a 60, el nuevo módulo debe marcarse como CONVALIDADO.
- Si el estudiante no tiene el módulo aprobado, debe quedar como PENDIENTE.
- La convalidación debe aplicarse automáticamente durante la inscripción.
- Debe registrarse la inscripción de origen de la convalidación.
- Los módulos convalidados no requieren nota nueva.
- Los módulos convalidados deben contar como aprobados para completar el producto.
- La convalidación no debe modificar la inscripción anterior ni la nota original.

**Criterios de aceptación:**

- El sistema debe revisar inscripciones anteriores del estudiante.
- El sistema debe detectar módulos aprobados previamente.
- El sistema debe mostrar alerta antes de confirmar la inscripción.
- El sistema debe marcar automáticamente los módulos como CONVALIDADO.
- El sistema debe guardar `es_convalidacion = true`.
- El sistema debe guardar `inscripcion_origen_id` cuando aplique.
- El sistema no debe duplicar notas ni modificar la inscripción original.

---

### RF-008: Generar detalle de módulos de una inscripción

**Módulo:** Inscripciones  
**Prioridad:** Alta  

**Como** sistema,  
**quiero** generar automáticamente los módulos asociados a una inscripción,  
**para** controlar el avance académico del estudiante módulo por módulo.

**Descripción funcional:**  
Al confirmar una inscripción, el sistema debe crear un registro por cada módulo del producto académico en la tabla `inscripcion_modulos`.

**Reglas de negocio:**

- Cada producto tiene módulos definidos previamente en `producto_modulos`.
- Por cada `producto_modulo`, debe crearse un registro en `inscripcion_modulos`.
- El estado inicial debe ser PENDIENTE, salvo que aplique convalidación.
- El docente puede asignarse posteriormente.
- La nota debe iniciar como NULL.
- La fecha de inicio y fin pueden ser NULL al momento de la inscripción.
- Cada registro debe representar el avance del estudiante en un módulo específico.

**Criterios de aceptación:**

- El sistema debe crear un registro por cada módulo del producto.
- El sistema debe asociar correctamente la inscripción con el slot del módulo.
- El sistema debe mantener estado PENDIENTE cuando no exista convalidación.
- El sistema debe mantener estado CONVALIDADO cuando aplique.
- El sistema debe permitir asignar docente posteriormente.
- El sistema debe permitir consultar el avance académico por módulo.

---

## 4. Módulo: Docentes

---

### RF-009: Registrar docente

**Módulo:** Docentes  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** registrar docentes en el sistema,  
**para** asignarlos a módulos específicos dentro de las inscripciones.

**Campos requeridos:**

| Campo | Validación |
|---|---|
| Nombre completo | Obligatorio |
| Correo personal | Email válido y único |
| Celular | Obligatorio |
| Carrera o especialidad | Obligatorio |
| País | Select obligatorio |
| Estado | Activo por defecto |

**Reglas de negocio:**

- El correo personal del docente debe ser único.
- El docente debe registrarse como activo por defecto.
- Solo docentes activos pueden ser asignados a módulos.
- El país debe seleccionarse desde una lista controlada.
- El docente puede participar en múltiples módulos, grupos o paralelos.

**Criterios de aceptación:**

- El sistema debe validar campos obligatorios.
- El sistema debe validar formato de correo.
- El sistema debe impedir correos duplicados.
- El sistema debe guardar al docente con estado activo.
- El sistema debe permitir consultar docentes desde el catálogo.

---

### RF-010: Asignar docente a módulo inscrito

**Módulo:** Docentes / Inscripciones  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** asignar un docente a un módulo específico dentro de una inscripción,  
**para** controlar qué docente imparte cada módulo a cada estudiante o grupo.

**Descripción funcional:**  
La asignación del docente no debe ser global al módulo, sino específica a la relación entre inscripción, producto y módulo.

**Flujo funcional:**

1. El usuario selecciona una inscripción activa.
2. El sistema muestra los módulos asociados a la inscripción.
3. El usuario selecciona un módulo específico.
4. El usuario busca un docente activo.
5. El usuario asigna el docente.
6. El sistema actualiza el registro en `inscripcion_modulos`.

**Reglas de negocio:**

- Solo se pueden asignar docentes activos.
- Solo se pueden asignar docentes a inscripciones activas.
- Un docente puede estar asignado al mismo módulo en múltiples grupos o paralelos.
- La asignación se realiza sobre `inscripcion_modulos`, no sobre la tabla global `modulos`.
- El sistema debe permitir cambiar el docente si el módulo aún no tiene nota registrada.
- Si el módulo ya tiene nota registrada, el cambio debe ser restringido o permitido solo por Admin.

**Criterios de aceptación:**

- El sistema debe listar módulos de la inscripción.
- El sistema debe permitir buscar docentes activos.
- El sistema debe guardar la relación docente-módulo-inscripción.
- El sistema debe impedir asignar docentes inactivos.
- El sistema debe reflejar la asignación en la vista académica del estudiante.

---

## 5. Módulo: Notas

---

### RF-011: Ingresar notas por módulo

**Módulo:** Notas  
**Prioridad:** Alta  

**Como** docente o coordinador,  
**quiero** ingresar notas de los estudiantes en los módulos asignados,  
**para** registrar el avance académico y determinar si aprobaron o reprobaron.

**Descripción funcional:**  
El docente debe visualizar únicamente los módulos que tiene asignados.  
El coordinador puede visualizar módulos según su alcance operativo.  
El sistema debe permitir registrar notas del 1 al 100.

**Flujo funcional:**

1. El docente accede a su panel.
2. El sistema muestra los módulos asignados.
3. El docente selecciona un módulo.
4. El sistema muestra la lista de estudiantes inscritos.
5. El docente ingresa la nota de cada estudiante.
6. El sistema calcula el estado automáticamente.
7. El docente confirma el registro.
8. Una vez guardada, la nota solo puede ser modificada por Admin.

**Reglas de negocio:**

- La nota debe estar entre 1 y 100.
- Si la nota es mayor o igual a 60, el estado debe ser APROBADO.
- Si la nota es menor a 60, el estado debe ser REPROBADO.
- Si la nota está vacía, el estado debe permanecer PENDIENTE.
- Si el módulo está CONVALIDADO, no debe requerir nota.
- Una vez guardada la nota, solo Admin puede modificarla.

**Tabla de estados:**

| Rango de nota | Estado resultante | Descripción |
|---|---|---|
| 60 - 100 | APROBADO | El estudiante aprueba el módulo |
| 1 - 59 | REPROBADO | El estudiante no aprueba el módulo |
| NULL | PENDIENTE | El módulo aún no ha sido evaluado |
| N/A | CONVALIDADO | Módulo reconocido de inscripción previa |

**Criterios de aceptación:**

- El sistema debe validar que la nota esté entre 1 y 100.
- El sistema debe calcular automáticamente el estado.
- El sistema debe bloquear edición posterior para docentes.
- El sistema debe permitir modificación posterior solo a usuarios Admin.
- El sistema debe actualizar el avance académico del estudiante.
- El sistema debe verificar si el producto queda completado después de registrar la nota.

---

### RF-012: Calcular aprobación total del producto académico

**Módulo:** Notas / Inscripciones  
**Prioridad:** Alta  

**Como** sistema,  
**quiero** evaluar si el estudiante completó todos los módulos requeridos,  
**para** actualizar automáticamente el estado de la inscripción.

**Reglas de aprobación:**

| Tipo de producto | Condición de aprobación total |
|---|---|
| CURSO | El único módulo debe estar APROBADO o CONVALIDADO |
| CURSO_EXPERTO | Los 3 módulos deben estar APROBADOS o CONVALIDADOS |
| DIPLOMADO | Los 5 módulos deben estar APROBADOS o CONVALIDADOS |

**Reglas de negocio:**

- El sistema debe revisar todos los módulos asociados a la inscripción.
- Un módulo APROBADO cuenta como completado.
- Un módulo CONVALIDADO cuenta como completado.
- Un módulo PENDIENTE o REPROBADO impide completar el producto.
- Cuando todos los módulos estén completados, la inscripción debe pasar a estado COMPLETADO.
- El sistema debe registrar la fecha de finalización del producto.

**Criterios de aceptación:**

- El sistema debe ejecutar la validación después de registrar o modificar una nota.
- El sistema debe actualizar automáticamente la inscripción a COMPLETADO.
- El sistema no debe completar una inscripción si existe algún módulo pendiente o reprobado.
- El sistema debe registrar la fecha de completado.
- El sistema debe mantener las notas individuales por módulo.

---

## 6. Módulo: Certificaciones

---

### RF-013: Registrar estado de certificación académica

**Módulo:** Certificaciones  
**Prioridad:** Media  

**Como** sistema,  
**quiero** almacenar la información académica final del estudiante,  
**para** dejar evidencia de que completó satisfactoriamente un producto académico.

**Descripción funcional:**  
Por el momento, el sistema no generará certificados PDF.  
Solo debe registrar el estado académico final, la fecha de completado, notas y docentes asociados.

**Información que debe almacenarse:**

| Dato | Descripción |
|---|---|
| Estado de inscripción | COMPLETADO |
| Fecha de completado | Fecha en que aprobó o convalidó el último módulo |
| Notas individuales | Notas de cada módulo cursado |
| Módulos convalidados | Módulos reconocidos automáticamente |
| Docente por módulo | Docente que impartió cada módulo |

**Reglas de negocio:**

- La certificación solo aplica cuando la inscripción está COMPLETADA.
- No se debe generar PDF en esta fase.
- La información debe quedar disponible para futuras funcionalidades de certificados.
- La generación de certificados PDF queda reservada para una fase posterior.

**Criterios de aceptación:**

- El sistema debe almacenar la fecha de completado.
- El sistema debe mostrar el estado COMPLETADO.
- El sistema debe permitir consultar notas individuales.
- El sistema debe permitir consultar docentes por módulo.
- El sistema no debe generar certificado PDF en esta versión.

---

## 7. Módulo: Pagos

---

### RF-014: Generar plan de pagos al crear inscripción

**Módulo:** Pagos  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** definir la modalidad de pago al crear una inscripción,  
**para** que el sistema genere automáticamente las cuotas correspondientes.

**Modalidades de pago:**

| Modalidad | Descripción | Comportamiento |
|---|---|---|
| AL_CONTADO | Pago único | Genera 1 registro de pago |
| CUOTAS | Pago dividido | Genera N registros de pago |

**Reglas de negocio:**

- La modalidad de pago es obligatoria.
- Si el método es AL_CONTADO, debe generarse una sola cuota.
- Si el método es CUOTAS, debe generarse una cuota por cada fecha definida.
- Cada cuota debe tener monto y fecha de vencimiento.
- La suma de cuotas debe representar el total del programa.
- Las cuotas deben iniciar con estado PENDIENTE.
- Si el método es CUOTAS, el estudiante debe aceptar el compromiso de pago.

**Criterios de aceptación:**

- El sistema debe solicitar modalidad de pago durante la inscripción.
- El sistema debe generar 1 pago si la modalidad es AL_CONTADO.
- El sistema debe generar N pagos si la modalidad es CUOTAS.
- El sistema debe validar monto y fecha de vencimiento.
- El sistema debe guardar los pagos asociados a la inscripción.
- El sistema debe mostrar las cuotas generadas después de guardar.

---

### RF-015: Registrar pago de cuota

**Módulo:** Pagos  
**Prioridad:** Alta  

**Como** coordinador,  
**quiero** registrar el pago realizado por un estudiante,  
**para** actualizar el estado financiero de su inscripción.

**Campos del formulario de pago:**

| Campo | Tipo | Obligatorio |
|---|---|---|
| Fecha de pago | Date picker | Sí |
| Monto pagado | Número decimal | Sí |
| Entidad facturadora | Select: DIGITALICE / USFA | Sí |
| Estado factura | Select: FACTURADO / PENDIENTE | Sí |
| Archivo comprobante | Upload: jpg, png o pdf, máximo 5MB | No, recomendado |
| Notas u observaciones | Textarea | No |

**Reglas de negocio:**

- Solo se pueden registrar pagos sobre cuotas existentes.
- La fecha de pago es obligatoria.
- El monto pagado es obligatorio.
- La entidad facturadora es obligatoria.
- El estado de factura es obligatorio.
- Si se adjunta comprobante, debe ser jpg, png o pdf.
- El archivo no debe superar 5MB.
- Los comprobantes deben almacenarse en un servicio externo como Cloudinary o S3.
- La base de datos solo debe guardar la URL del comprobante.
- Al registrar el pago, la cuota debe pasar a estado PAGADO.
- Se debe registrar el usuario que realizó el registro del pago.

**Criterios de aceptación:**

- El sistema debe validar los campos obligatorios.
- El sistema debe aceptar solo formatos permitidos para comprobantes.
- El sistema debe rechazar archivos mayores a 5MB.
- El sistema debe guardar la URL del comprobante.
- El sistema debe actualizar la cuota a PAGADO.
- El sistema debe registrar el usuario que realizó el registro.
- El sistema debe guardar la fecha de registro del pago.

---

### RF-016: Marcar cuotas vencidas automáticamente

**Módulo:** Pagos  
**Prioridad:** Alta  

**Como** sistema,  
**quiero** identificar cuotas vencidas,  
**para** mantener actualizado el estado financiero de cada inscripción.

**Descripción funcional:**  
El sistema debe revisar las cuotas pendientes y marcar como vencidas aquellas cuya fecha de vencimiento ya pasó.

**Reglas de negocio:**

- Si la fecha actual es mayor que la fecha de vencimiento y la cuota no está pagada, el estado debe ser VENCIDO.
- Las cuotas pagadas no deben cambiar a vencidas.
- La validación puede ejecutarse al consultar la vista de pagos o mediante un proceso programado.
- El estado financiero debe reflejarse en la vista del estudiante y del coordinador.

**Criterios de aceptación:**

- El sistema debe detectar cuotas pendientes vencidas.
- El sistema debe actualizar el estado a VENCIDO.
- El sistema no debe modificar cuotas pagadas.
- El sistema debe mostrar las cuotas vencidas de manera diferenciada.
- El sistema debe permitir filtrar cuotas por estado.

---

### RF-017: Visualizar estado de pagos por inscripción

**Módulo:** Pagos  
**Prioridad:** Alta  

**Como** administrador o coordinador,  
**quiero** visualizar el estado financiero de una inscripción,  
**para** conocer pagos realizados, cuotas pendientes, vencidas y comprobantes.

**Información a mostrar:**

| Elemento | Descripción |
|---|---|
| Total del programa | Monto total asociado a la inscripción |
| Total pagado | Suma de cuotas pagadas |
| Saldo pendiente | Total pendiente de pago |
| Cuotas pendientes | Cuotas no pagadas y no vencidas |
| Cuotas vencidas | Cuotas con fecha vencida |
| Historial de pagos | Pagos registrados |
| Comprobantes | Archivo descargable o visible desde URL |

**Reglas de negocio:**

- El sistema debe calcular el total pagado.
- El sistema debe calcular el saldo pendiente.
- El sistema debe separar cuotas pendientes, pagadas y vencidas.
- Las cuotas vencidas deben resaltarse visualmente.
- El comprobante debe poder visualizarse o descargarse.
- Solo usuarios autorizados deben acceder a esta información.

**Criterios de aceptación:**

- El sistema debe mostrar resumen financiero por inscripción.
- El sistema debe mostrar cuotas pagadas, pendientes y vencidas.
- El sistema debe permitir acceder al comprobante.
- El sistema debe mostrar observaciones registradas.
- El sistema debe actualizar los valores cuando se registre un nuevo pago.

---

## 8. Módulo: Seguridad y Control de Acceso

---

### RF-018: Controlar acciones según rol

**Módulo:** Seguridad y Control de Acceso  
**Prioridad:** Alta  

**Como** sistema,  
**quiero** restringir las funcionalidades según el rol del usuario,  
**para** proteger la información académica, financiera y administrativa.

**Roles considerados:**

| Rol | Acceso esperado |
|---|---|
| Admin | Gestión total del sistema |
| Coordinador | Gestión operativa académica y financiera |
| Docente | Acceso a módulos asignados y registro de notas |
| Estudiante | Consulta de progreso académico y estado de pagos |

**Reglas de negocio:**

- Solo Admin y Coordinador pueden registrar productos académicos.
- Solo Admin y Coordinador pueden registrar estudiantes.
- Solo Admin y Coordinador pueden crear inscripciones.
- Solo Admin y Coordinador pueden registrar pagos.
- Solo Admin y Coordinador pueden registrar docentes.
- Solo Admin y Coordinador pueden asignar docentes.
- El Docente solo puede ver módulos asignados.
- El Docente solo puede registrar notas de sus módulos asignados.
- El Estudiante solo puede consultar su propio progreso.
- El Estudiante solo puede consultar su propio estado de pagos.
- Solo Admin puede modificar notas ya guardadas.

**Criterios de aceptación:**

- El sistema debe validar permisos antes de ejecutar cada acción.
- El sistema debe ocultar opciones no permitidas según el rol.
- El sistema debe impedir acceso directo por URL a funcionalidades no autorizadas.
- El sistema debe registrar quién crea inscripciones y pagos.
- El sistema debe proteger la información financiera de estudiantes.
- El sistema debe aplicar autorización tanto en frontend como en backend.

---

# Resumen de Requerimientos por Módulo

| Módulo | Requerimientos funcionales |
|---|---|
| Productos Académicos | RF-001, RF-002, RF-003 |
| Estudiantes | RF-004 |
| Estudiantes / Inscripciones | RF-005 |
| Inscripciones | RF-006, RF-008 |
| Inscripciones / Convalidaciones | RF-007 |
| Docentes | RF-009 |
| Docentes / Inscripciones | RF-010 |
| Notas | RF-011 |
| Notas / Inscripciones | RF-012 |
| Certificaciones | RF-013 |
| Pagos | RF-014, RF-015, RF-016, RF-017 |
| Seguridad y Control de Acceso | RF-018 |

---

# Consideraciones Generales para Desarrollo

## Seguridad

- Toda operación debe validar el rol del usuario autenticado.
- El backend debe impedir operaciones no autorizadas aunque el frontend oculte botones.
- Los estudiantes solo deben acceder a su propia información.
- Los docentes solo deben acceder a los módulos que tengan asignados.
- La información financiera debe ser visible solo para Admin, Coordinador y el estudiante propietario.

## Integridad de datos

- Todas las entidades principales deben utilizar identificadores únicos.
- Las relaciones deben implementarse mediante claves foráneas.
- El sistema debe evitar duplicidad en códigos, correos, C.I. y slots académicos.
- La creación de productos con módulos debe ejecutarse como transacción atómica.
- La inscripción debe generar automáticamente módulos y pagos asociados.

## Trazabilidad

- El sistema debe registrar quién crea inscripciones.
- El sistema debe registrar quién registra pagos.
- El sistema debe registrar fechas de creación.
- El sistema debe conservar el historial académico por módulo.
- El sistema debe conservar la relación entre inscripción, módulo, docente, nota y pago.

## Estados principales

| Entidad | Estados posibles |
|---|---|
| Producto académico | Activo, Inactivo |
| Módulo inscrito | PENDIENTE, EN_CURSO, APROBADO, REPROBADO, CONVALIDADO |
| Inscripción | ACTIVO, SUSPENDIDO, COMPLETADO, CONVALIDADO |
| Pago | PENDIENTE, PAGADO, VENCIDO |
| Factura | PENDIENTE, FACTURADO |

## Funcionalidades futuras fuera del alcance inicial

- Generación automática de certificados PDF.
- Firma digital de certificados.
- Portal avanzado de estudiante.
- Reportes ejecutivos avanzados.
- Integración con pasarela de pagos.

---

## Ajuste Funcional UX/UI - Gestión Mediante Modales

Para mejorar la experiencia operativa, los formularios principales de creación y edición deben abrirse en ventanas modales desde cada módulo.

### Reglas agregadas

- Productos académicos, estudiantes y docentes deben crearse desde acciones visibles en la tabla principal.
- Las acciones CRUD deben mostrarse por fila cuando el rol tenga permiso.
- La eliminación de registros críticos debe implementarse como desactivación lógica.
- La creación de productos académicos debe separar los datos generales del producto y la gestión de módulos.
- Después de crear un producto, el sistema debe permitir abrir una ventana para agregar módulos.
- Los módulos de un producto deben poder agregarse dinámicamente sin limitarse a 1, 3 o 5 campos fijos en pantalla.
- El sistema debe incluir una vista de configuración de usuario para consultar y actualizar datos básicos del usuario autenticado.
- El formulario de inscripción debe abrirse en modal e incluir cantidad de cuotas cuando la modalidad sea CUOTAS.
- Si la modalidad es CUOTAS, antes de registrar la inscripción debe abrirse un segundo modal para configurar el detalle de cuotas: número, monto y fecha de vencimiento.
- La fecha de vencimiento de cada cuota se almacena en `pagos.fecha_vencimiento`.
- La lista de inscripciones debe mostrar institución, cuotas pendientes y saldo pendiente.
- La vista de pagos debe mostrar datos del estudiante, contacto, producto, institución, cuotas pendientes, auditoría de usuario que registra el pago, código y fecha de comprobante.
- La vista de pagos debe ofrecer acciones para exportar o imprimir estado de cuenta y preparar envío por correo electrónico.
- Solo el rol Admin puede eliminar pagos. La eliminación debe ser lógica: el registro no se muestra en la web, pero queda en base de datos con `eliminado`, `eliminado_por` y `eliminado_at` para auditoría.
- El monto total del estado de cuenta siempre debe referenciar `inscripciones.monto_total`; eliminar una cuota no debe reducir el monto total ni borrar la deuda histórica de la inscripción.
- Solo el rol Admin puede eliminar inscripciones. La eliminación debe ser lógica y conservar auditoría con usuario y fecha de eliminación.
- Los formularios deben mostrar mensajes de error comprensibles para el usuario, indicando el campo faltante o el problema concreto. No deben mostrarse errores técnicos como `Failed to fetch`.
- El dashboard debe incluir gráficos de barras para recaudación por curso y por institución, basados en pagos registrados no eliminados.
- La interfaz debe usar iconografía relacionada con cada módulo para mejorar lectura visual y navegación.
- La lista de inscripciones debe permitir editar los datos principales de la inscripción. La reprogramación de cuotas debe tratarse como flujo financiero separado para no alterar deuda ya generada sin control.
- Notificaciones automáticas por WhatsApp o correo.


## 11. Consideraciones Finales

### 11.1 Seguridad

- Todas las rutas deben estar protegidas con middleware de autenticación JWT.
- El middleware de roles debe verificar permisos antes de ejecutar cualquier lógica de negocio.
- Las contraseñas deben almacenarse hasheadas con `bcrypt`, con un mínimo de 10 rounds.
- Los archivos de comprobante deben validarse por tipo MIME y tamaño antes de subirse.
- Nunca se debe exponer el `JWT_SECRET` ni credenciales dentro del repositorio.
- Las variables sensibles deben manejarse mediante variables de entorno.
- El backend debe validar permisos aunque el frontend oculte botones o rutas.
- Los usuarios solo deben acceder a la información permitida según su rol.

---

### 11.2 Validaciones Generales

- Usar `Zod` en el backend para validar todos los cuerpos de request.
- El C.I. del estudiante debe ser único en el sistema.
- El correo del estudiante debe ser único en el sistema.
- El correo del docente debe ser único en el sistema.
- Las notas deben estar estrictamente entre 1 y 100.
- Los códigos de producto deben seguir el formato: `NCD/NCE/NCU + números + año`.
- Los campos obligatorios no deben aceptar valores vacíos.
- Los estados deben manejarse mediante valores controlados tipo `ENUM`.
- Las fechas deben validarse antes de ser almacenadas.
- Los montos de pago deben ser mayores a 0.
- Los archivos adjuntos deben respetar el tamaño máximo permitido.

---

### 11.3 Experiencia de Usuario por Rol

| Rol | Vista principal recomendada |
|---|---|
| Admin | Dashboard con métricas globales: inscripciones activas, pagos vencidos, módulos pendientes de nota, productos activos, docentes registrados y estudiantes activos. |
| Coordinador | Lista de inscripciones recientes, alertas de pagos vencidos, estudiantes sin docente asignado, pagos pendientes de facturación y módulos pendientes de seguimiento. |
| Docente | Lista de módulos asignados → click en módulo → lista de estudiantes inscritos con campo para registrar nota. |
| Estudiante | Mi progreso académico: módulos completados, módulos pendientes, notas obtenidas, estado de pagos y próximas fechas de vencimiento. |

---

## Reglas de Negocio Críticas

| # | Regla | Implementación sugerida |
|---|---|---|
| RN-01 | Los módulos aprobados por el Ministerio no pueden renombrarse. | Usar el campo `nombre_oficial` en base de datos como dato inmutable. No debe existir endpoint de edición para este campo. Solo debe permitirse lectura después de la creación. |
| RN-02 | Un producto no puede tener dos veces el mismo número de módulo. | Crear la restricción `UNIQUE (producto_id, numero_modulo)` en la tabla `producto_modulos`. |
| RN-03 | La nota mínima de aprobación es 60 puntos. | Validar en backend al guardar la nota. El sistema debe calcular automáticamente el estado del módulo según la nota registrada. |
| RN-04 | La convalidación se activa automáticamente al inscribir al estudiante. | Implementar la lógica en `POST /inscripciones`, comparando los módulos del nuevo producto con el historial académico del estudiante por nombre oficial del módulo. |
| RN-05 | Un módulo puede pertenecer a varios productos distintos. | Implementar relación N:M mediante la tabla `producto_modulos`. No se debe duplicar la entidad `modulos` si el módulo ya existe. |
| RN-06 | Los códigos de slot se generan automáticamente. | Generar en backend concatenando `codigo_producto + '_MOD' + numero_modulo`. El campo nunca debe ser editable por el usuario. |
| RN-07 | La inscripción solo es válida si el estudiante acepta el compromiso de pago cuando elige cuotas. | Validar en `POST /inscripciones`: si `metodo_pago = CUOTAS`, entonces `comprometido_pago` debe ser `true`. |
| RN-08 | Solo el rol Admin puede modificar una nota ya registrada. | Aplicar middleware de autorización por rol en el endpoint `PATCH /nota` o endpoint equivalente de actualización de notas. |
| RN-09 | El estado de una inscripción pasa a COMPLETADO automáticamente. | Ejecutar trigger o lógica posterior al guardado de nota para verificar si todos los módulos están en estado `APROBADO` o `CONVALIDADO`. |
| RN-10 | Una cuota vencida se marca automáticamente. | Implementar un job programado diario, tipo cron, que actualice las cuotas con `fecha_vencimiento < hoy` y `estado = PENDIENTE`, cambiándolas a `VENCIDO`. |
