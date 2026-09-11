# Prueba Técnica — Desarrollador(a) Full Stack
**Educación Estrella®**

## 1. Contexto

En Educación Estrella financiamos el acceso de jóvenes a la educación superior. Parte de nuestro proceso de originación de crédito incluye una **entrevista en video** que el solicitante graba y sube a la plataforma, y que luego revisa nuestro equipo de análisis.

Queremos que construyas una versión mínima pero funcional de ese flujo. No buscamos un producto terminado: buscamos ver **cómo piensas, cómo decides y cómo sustentas** lo que construyes.

## 2. Sobre el uso de inteligencia artificial

**Esperamos que uses IA. No es una concesión, es un requisito.**

El desarrollo debe hacerse end-to-end con **Claude Code**. Puedes complementar con otras herramientas si lo consideras útil.

Lo que evaluamos no es si escribiste el código a mano, sino si **entiendes y puedes defender cada decisión** del resultado. En la entrevista técnica te haremos preguntas concretas sobre tu arquitectura, tu manejo de errores, tus decisiones de seguridad y tus trade-offs. Si no puedes explicar por qué algo está donde está, la prueba no cumple su propósito.

Te pedimos además documentar tu proceso (ver entregable 4.4).

## 3. Alcance funcional

### 3.1 Autenticación (login básico)

- Registro e inicio de sesión de un solicitante con correo y contraseña.
- Sesión persistente y ruta protegida: sin sesión válida no se accede al formulario.
- Cierre de sesión.

**Libertad de implementación:** puedes usar un proveedor administrado (Amazon Cognito u otro) o implementar tu propio esquema de tokens. Ambas rutas son válidas; lo que evaluamos es que sustentes la elección y que el manejo de credenciales y sesiones sea correcto.

### 3.2 Formulario de solicitud de crédito con video de entrevista

Un formulario, accesible solo con sesión activa, que capture:

- Nombre completo
- Documento de identidad
- Institución educativa y programa académico
- Monto solicitado
- **Video de la entrevista** (archivo de hasta 200 MB, formatos `.mp4` / `.webm`)

Requisitos de comportamiento:

- Validación de campos en el cliente **y** en el servidor.
- Validación de tipo y tamaño del archivo antes de consumir ancho de banda innecesario.
- Indicador de progreso de la subida.
- Manejo explícito del caso de error: la subida falla, la conexión se corta, el archivo excede el límite.
- Al finalizar, la solicitud queda registrada con su estado y una referencia al video almacenado.

### 3.3 Consulta de la solicitud

Una vista donde el usuario autenticado ve las solicitudes que ha enviado, con su estado y fecha. Puede ser una tabla simple.

## 4. Requisitos técnicos

### 4.1 Frontend

- **React**. Puedes usar Next.js o React sin framework — tu decisión, sustentada.
- Librería de estilos a tu criterio. No evaluamos diseño gráfico, sí claridad, estados de carga y manejo de errores visibles para el usuario.

### 4.2 Backend

- Expuesto como **API REST**.
- Desplegado como **función Lambda** (con API Gateway o Function URL) **o** en **contenedor** (ECS Fargate, App Runner o equivalente). Tu decisión, sustentada.
- Lenguaje a tu criterio dentro de lo que domines: Python, Node/TypeScript o Go.

### 4.3 Infraestructura

- Todo debe desplegarse en **AWS, dentro de los límites del Free Tier**. No queremos que incurras en costos; si alguna decisión implica un cobro, documéntala en lugar de ejecutarla.
- Región sugerida: `us-east-1`.
- Almacenamiento de archivos en **S3**. Los videos **no deben ser públicos**.
- Persistencia de datos a tu criterio (DynamoDB, RDS en Free Tier, u otra opción justificada).
- Se valora —no es obligatorio— definir la infraestructura como código (CDK, Terraform o SAM).

### 4.4 Datos

Usa exclusivamente **datos ficticios**. No cargues información real de personas, ni documentos de identidad reales, ni videos con personas identificables sin su consentimiento.

## 5. Entregables

1. **Repositorio Git** (GitHub o GitLab) con acceso para `[usuario del evaluador]`. Historial de commits legible: queremos ver la evolución del trabajo, no un único commit final.
2. **URL del frontend desplegado y funcionando**, con un usuario de prueba creado. Mantenlo activo hasta 48 horas después de la entrevista técnica.
3. **README** que incluya:
   - Cómo levantar el proyecto localmente.
   - Diagrama o descripción de la arquitectura desplegada.
   - Decisiones técnicas tomadas y por qué (Lambda vs. contenedor, estrategia de autenticación, estrategia de subida de archivos, elección de base de datos).
   - Limitaciones conocidas y qué harías distinto con más tiempo.
4. **Bitácora de trabajo con IA** (`AI-LOG.md`): 1 a 2 páginas describiendo cómo usaste Claude Code. Qué le pediste, dónde su propuesta no funcionó, qué corregiste o descartaste y por qué. Nos interesa el criterio, no el volumen.
5. **Video de demostración** de máximo 5 minutos: recorrido del flujo funcionando, grabación de pantalla, sin edición necesaria.

## 6. Lo que NO estamos pidiendo

Para que administres bien tu tiempo, esto queda explícitamente fuera de alcance:

- Diseño visual elaborado o sistema de diseño propio.
- Panel administrativo o flujo de aprobación de créditos.
- Transcodificación, compresión o análisis del video.
- Notificaciones por correo, SMS o WhatsApp.
- Suite completa de pruebas. Unas pocas pruebas bien elegidas valen más que cobertura amplia y superficial.
- Pipeline de CI/CD.
- Multi-idioma, modo oscuro, accesibilidad avanzada.

## 7. Criterios de evaluación

| Dimensión | Peso | Qué observamos |
|---|---|---|
| **Arquitectura y criterio técnico** | 25% | Coherencia de la solución, trade-offs conscientes, capacidad de sustentar cada decisión. |
| **Backend y manejo de archivos** | 25% | Corrección de la API, validaciones del lado servidor, estrategia de subida de video, manejo de errores. |
| **Seguridad** | 20% | Protección de rutas, manejo de secretos y credenciales, permisos de S3 e IAM, exposición de datos. |
| **Frontend** | 15% | Estados de carga y error, validaciones, que el flujo completo funcione sin sorpresas. |
| **Despliegue en AWS** | 10% | La aplicación efectivamente corre en la nube y es alcanzable. |
| **Calidad de código y documentación** | 5% | Legibilidad, estructura, historial de commits, README útil. |

## 8. Señales que penalizamos

- Credenciales, llaves de acceso o secretos versionados en el repositorio.
- Bucket de S3 con acceso público de lectura o escritura.
- Ausencia total de validación en el servidor, confiando solo en el cliente.
- Código que el candidato no puede explicar en la entrevista.
- Un único commit con todo el proyecto.

## 9. Sobre la entrevista técnica

Después de la entrega sostendremos una sesión de aproximadamente 60 minutos:

- **Recorrido de tu solución** (10 min): nos muestras el flujo funcionando.
- **Profundización técnica** (30 min): preguntas sobre tus decisiones, tu código y escenarios alternativos.
- **Modificación en vivo** (15 min): te pediremos un cambio pequeño sobre tu propio código. Puedes usar Claude Code durante este ejercicio.
- **Tus preguntas** (5 min).

---

## Notas de cierre

Si algún requisito te parece ambiguo, **documenta tu interpretación y sigue adelante**. Tomar una decisión razonable y explicarla vale más que quedarse esperando aclaración. Si algo te bloquea por completo, escríbenos.

Valoramos la honestidad por encima del resultado. Un entregable incompleto con un README que explique con claridad qué falta y por qué es mejor recibido que uno que aparenta estar terminado.

Gracias por el tiempo que vas a invertir en esto. Sabemos que es significativo y lo tenemos presente.

**Equipo Educación Estrella®**
