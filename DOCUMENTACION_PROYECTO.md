# Documentación y Estado del Proyecto: Crossover Web

Este documento sirve como "memoria" del proyecto. Cuando inicies una nueva sesión para seguir trabajando, puedes pedirle a la Inteligencia Artificial que lea este archivo (`DOCUMENTACION_PROYECTO.md`) para que se ponga en contexto de inmediato.

---

## 1. Stack Tecnológico
- **Framework:** Next.js (App Router)
- **Estilos:** Tailwind CSS (con variables personalizadas en `globals.css`)
- **Lenguaje:** TypeScript / React
- **Iconos:** Material Symbols Outlined (Google Fonts)

## 2. Arquitectura y Componentes
Recientemente refactorizamos la aplicación para que sea escalable:
- **`src/components/Navbar.tsx`**: Menú superior de navegación interactivo. Tiene soporte para versión móvil (Hamburger menu) usando estado de React (`useState`).
- **`src/components/Footer.tsx`**: Pie de página minimalista. Contiene redes sociales y horario de atención (sin saturar de información).
- **`src/app/layout.tsx`**: Inyecta el `Navbar` y `Footer` automáticamente a todas las páginas de la web.

## 3. Páginas Desarrolladas (Hasta ahora)

### 🏠 Inicio (`/`)
- Hero Section con un Slider de imágenes dinámico.
- "Bento Grid" (cuadrículas asimétricas modernas) para la Oferta Académica con imágenes filtradas para legibilidad.
- Sección "About" resaltando los 25 años de fundación (desde 2001).

### 👥 Nosotros (`/nosotros`)
- Hero con imagen oscurecida al 80% para resaltar texto blanco.
- Sección de Filosofía Institucional con tipografía de lectura cómoda.
- Misión y Visión implementadas en un diseño de tarjetas de cristal (Glassmorphism).
- Valores organizados en tarjetas pequeñas con íconos.
- Perfil del Egresado destacado con un botón rojo para descargar PDF.

### 📞 Contacto (`/contacto`)
- Tarjetas de información directa (Dirección, Correos, Teléfonos).
- Formulario de contacto visual (UI lista, falta backend si se desea que envíe correos reales).
- **Directorio de Extensiones Click-to-Call:** Las extensiones están programadas para que al tocarlas desde un móvil marquen el número principal, hagan una pausa (,) y marquen la extensión automáticamente.
- Mapa de Google incrustado apuntando a "Crossover Center".

### 🚧 Páginas "Próximamente" (Placeholders)
Se crearon para que el cliente no reciba errores 404 al navegar por el menú. Tienen un diseño hermoso de "En Construcción":
- `/colegio`
- `/instituto`
- `/infotep`
- `/deportes`
- `/noticias`

---

## 4. Próximos Pasos (To-Do List)
Cuando retomemos el proyecto, estas son las áreas a trabajar:

1. **Rellenar Páginas Pendientes:** Reemplazar las páginas "En Construcción" (Colegio, Instituto, Infotep, Deportes, Noticias) con el contenido real y los programas de estudio.
2. **Imágenes Faltantes:** 
   - Subir el archivo PDF del "Perfil del Egresado" para enlazarlo en la página Nosotros.
   - Reemplazar las imágenes temporales de Misión/Visión con las imágenes oficiales ("Mesa de trabajo 2 copia").
3. **Integración de Instagram:** Habíamos conversado sobre poner un "feed" automático de Instagram en el Home. Queda pendiente decidir si usamos un Widget (como Elfsight) o conectamos la API oficial.
4. **Formulario de Contacto:** Conectar el formulario de la página `/contacto` a un servicio como EmailJS, Formspree o Resend para que envíe correos reales cuando el cliente le dé a "Enviar Mensaje".

5. **Optimización de Rendimiento (Imágenes):** Según PageSpeed Insights, el rendimiento en móviles es de 57/100 debido a imágenes pesadas (`secundaria.jpg`, `cielo.jpg`, etc.). Debemos comprimir las imágenes o convertirlas a formato WebP para aumentar el puntaje a +90.
6. **Vercel Deployment:** La web ya está exitosamente vinculada a Vercel (`crossover-web-blond.vercel.app`) y está desplegando automáticamente cada vez que hacemos un `git push` a la rama `main`.

---
*Fin del reporte.*
