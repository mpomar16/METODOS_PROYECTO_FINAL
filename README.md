# Laboratorio de Análisis Numérico – Aplicación Web

Aplicación web interactiva que muestra **tres problemas prácticos de la vida real**, resueltos con **métodos de Análisis Numérico** y permitiendo comparar resultados entre métodos para el mismo problema.

La página está pensada como material de apoyo para una materia de **Análisis Numérico / Métodos Numéricos** y se centra en la parte **práctica y funcional**, no en la teoría.

---

## Contenidos

La aplicación incluye tres temas:

1. **Tema 1 – Finanzas:** Cálculo de la **Tasa Interna de Retorno (TIR)** de un proyecto.
   - Métodos: **Bisección** y **Newton**.
2. **Tema 2 – Temperatura:** Estimación de temperatura en una hora intermedia a partir de mediciones reales.
   - Métodos: **Interpolación de Lagrange** y **Interpolación de Newton (diferencias divididas)**.
3. **Tema 3 – Movimiento:** Cálculo de la **distancia recorrida** a partir de datos de velocidad en función del tiempo.
   - Métodos: **Regla del Trapecio (compuesta)** y **Regla de Simpson 1/3 (compuesta)**.

En cada tema el usuario puede:

- Ingresar datos reales o de ejemplo.
- Ejecutar los métodos numéricos.
- Ver tablas de iteraciones o coeficientes.
- Leer una **interpretación en lenguaje cotidiano** de los resultados.

---

## Estructura del proyecto

Archivos principales:

- `index.html`  
  Página principal con las tres secciones (Finanzas, Temperatura, Movimiento) y la interfaz de usuario.

- `styles.css`  
  Estilos de la aplicación, con temas visuales diferenciados:
  - Finanzas: tonos azules/violetas.
  - Temperatura: tonos verdes suaves.
  - Movimiento: tonos naranjas/amarillos.

- `main.js`  
  Lógica numérica y manejo de eventos:
  - Cálculo de TIR con Bisección y Newton.
  - Interpolación de Lagrange y Newton.
  - Integración numérica con Trapecios y Simpson 1/3.
  - Construcción dinámica de tablas de iteraciones y resultados.
