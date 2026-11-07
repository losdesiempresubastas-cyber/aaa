# Subastas Independiente

Proyecto escolar web de Club Atlético Independiente. Esta versión utiliza **Vercel** para alojar la página y sus funciones API, y **MongoDB Atlas** para guardar los datos en la nube.

## Importante: no se instala nada en las computadoras del colegio

Los compañeros solamente abren el enlace de Vercel desde el navegador. No necesitan Node.js, npm ni permisos de administrador. Node.js se ejecuta en Vercel, no en la computadora del visitante.

## Funciones incluidas

- Registro e inicio/cierre de sesión.
- Sesiones mediante cookie firmada.
- Perfil con nombre, apellido, fecha de nacimiento, email y dirección editable.
- Catálogo original de 25 productos, cargado automáticamente en MongoDB una sola vez.
- Publicación de artículos con título, descripción, precio e imagen (máximo 2 MB).
- Catálogo compartido: todos ven los artículos publicados.
- Carrito individual por usuario, con cantidades y total.
- Favoritos individuales por usuario.
- Listado y eliminación de publicaciones propias.
- Imágenes de publicaciones guardadas en MongoDB, no en el disco temporal de Vercel.

## Configuración paso a paso

### A. Crear la base de datos MongoDB Atlas

1. Entrá en https://www.mongodb.com/atlas y creá una cuenta gratuita.
2. Creá un proyecto llamado `Subastas Independiente`.
3. Creá un cluster gratuito (M0 si está disponible en tu región).
4. En **Database Access**, creá un usuario de base de datos. Guardá el usuario y contraseña en un lugar privado.
5. En **Database Access**, asignale al usuario el permiso `readWrite` sobre la base `subastas_independiente` (no hace falta darle permisos de administrador).
6. En **Network Access**, agregá `0.0.0.0/0` para este proyecto escolar. Vercel puede ejecutar funciones desde distintas direcciones IP; esta regla permite la conexión desde Vercel, pero también permite que cualquier IP intente conectarse. Por eso usá un usuario exclusivo de la aplicación, una contraseña larga y no compartas la cadena de conexión.
7. En **Database > Connect > Drivers**, elegí Node.js y copiá la cadena `mongodb+srv://...`.
8. Reemplazá `<password>` por la contraseña del usuario de base de datos. Si la contraseña contiene caracteres especiales, usá la opción de Atlas para codificarlos correctamente.

### B. Subir el proyecto a GitHub

1. Descargá y descomprimí este ZIP.
2. Entrá en el repositorio de GitHub del proyecto.
3. Si el repositorio ya tenía la versión SQLite anterior, eliminá del repositorio viejo `server.js`, `iniciar.bat`, las carpetas `src/` y `data/`, `node_modules/` y el `package-lock.json` anterior.
4. Subí el contenido de este ZIP, manteniendo `public/`, `api/`, `lib/`, `package.json` y `vercel.json` directamente en la raíz del repositorio (no dentro de otra carpeta).
5. No subas un archivo `.env` ni contraseñas. El archivo `.env.example` es solamente una plantilla.

### C. Publicar en Vercel

1. Entrá en https://vercel.com e iniciá sesión con GitHub.
2. Elegí **Add New > Project**.
3. Importá el repositorio `subastas-independiente`.
4. En la configuración del proyecto, dejá **Framework Preset: Other**.
5. Dejá **Root Directory** en `./` (la raíz del repositorio).
6. Dejá Build Command vacío. El archivo `vercel.json` ya configura `public` como carpeta de archivos estáticos y Vercel detecta las funciones del servidor dentro de `api`.
7. Antes de desplegar, agregá estas variables en **Environment Variables**:

   - `MONGODB_URI`: la cadena de conexión completa de MongoDB Atlas.
   - `MONGODB_DB`: `subastas_independiente`.
   - `SESSION_SECRET`: una cadena aleatoria larga de al menos 32 caracteres. No uses la contraseña de MongoDB como secreto de sesión.

8. Aplicá las variables a Production, Preview y Development.
9. Presioná **Deploy** y esperá a que termine.
10. Abrí el dominio `.vercel.app` que te entrega Vercel.

### D. Probar que funciona

1. Abrí el enlace de Vercel en una ventana normal.
2. Creá un usuario de prueba.
3. Entrá a **Compras** y verificá que aparezcan los 25 artículos originales.
4. Agregá uno al carrito y otro a favoritos.
5. Desde **Publicar**, subí un artículo de prueba con una imagen pequeña.
6. Abrí el enlace desde otro navegador o celular, creá otro usuario y comprobá que ese artículo también aparece en Compras.
7. Verificá que el segundo usuario tenga su propio carrito y favoritos, separados del primero.
8. Reiniciá o volvé a desplegar Vercel y comprobá que los datos continúan allí.

## Cómo se actualiza el proyecto

- Los cambios de código se hacen en los archivos del proyecto y se suben a GitHub. Vercel vuelve a desplegar automáticamente cuando recibe cambios en la rama conectada.
- Los usuarios, productos, carritos y favoritos se guardan directamente en MongoDB Atlas. No se suben a GitHub.
- No edites ni reemplaces la base de datos desde GitHub: MongoDB es la fuente única de datos compartida.

## Límites y notas

- Las imágenes nuevas tienen un límite de 2 MB y se guardan como datos binarios codificados dentro de MongoDB. Para un proyecto escolar y pocas publicaciones es suficiente; si el catálogo crece mucho, conviene pasar las imágenes a un servicio de almacenamiento de archivos.
- El carrito y los favoritos requieren iniciar sesión.
- No hay cobros reales ni procesamiento de pagos. El carrito calcula el total, pero no realiza compras.
- Las contraseñas se guardan con hash bcrypt. No uses datos personales reales en un proyecto escolar público.
- Si Atlas muestra un error de conexión, revisá `MONGODB_URI`, el usuario/contraseña de base de datos y **Network Access**.

## Estructura

- `public/`: páginas HTML, CSS, JavaScript e imágenes.
- `api/`: funciones del servidor que ejecuta Vercel.
- `lib/`: conexión MongoDB, catálogo inicial y utilidades de sesión.
- `package.json`: dependencias que Vercel instala durante el despliegue.
- `vercel.json`: configuración de Vercel.

## Comprobación rápida del servidor

Abrí `https://TU-DOMINIO.vercel.app/api/health`. Si la configuración está bien, devuelve un JSON indicando que MongoDB está conectada y cuántos productos hay. La primera consulta inicializa el catálogo de 25 artículos si todavía no estaba cargado.
