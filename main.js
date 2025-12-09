function showSection(id) {
  var sections = document.querySelectorAll(".section");
  sections.forEach(function (s) {
    s.classList.remove("visible");
  });
  var buttons = document.querySelectorAll(".nav-button");
  buttons.forEach(function (b) {
    b.classList.remove("active");
  });
  var target = document.getElementById(id);
  if (target) {
    target.classList.add("visible");
  }
  buttons.forEach(function (b) {
    if (b.getAttribute("data-section") === id) {
      b.classList.add("active");
    }
  });
}

function npv(cashflows, rate) {
  var sum = 0;
  for (var k = 0; k < cashflows.length; k++) {
    sum += cashflows[k] / Math.pow(1 + rate, k);
  }
  return sum;
}

function dnpv(cashflows, rate) {
  var sum = 0;
  for (var k = 1; k < cashflows.length; k++) {
    sum += -k * cashflows[k] / Math.pow(1 + rate, k + 1);
  }
  return sum;
}

function bisectionTir(cashflows, a, b, tol, maxIter) {
  var fa = npv(cashflows, a);
  var fb = npv(cashflows, b);
  if (fa * fb > 0) {
    return { success: false, message: "No hay cambio de signo en el intervalo.", iterations: [] };
  }
  var iterations = [];
  var m = a;
  var fm = fa;
  for (var k = 1; k <= maxIter; k++) {
    m = 0.5 * (a + b);
    fm = npv(cashflows, m);
    iterations.push({
      iter: k,
      a: a,
      b: b,
      m: m,
      fm: fm
    });
    if (Math.abs(fm) < tol || Math.abs(b - a) / 2 < tol) {
      return { success: true, root: m, iterations: iterations };
    }
    if (fa * fm < 0) {
      b = m;
      fb = fm;
    } else {
      a = m;
      fa = fm;
    }
  }
  return { success: false, root: m, iterations: iterations, message: "No converge en el máximo de iteraciones." };
}

function newtonTir(cashflows, x0, tol, maxIter) {
  var iterations = [];
  var x = x0;
  for (var k = 1; k <= maxIter; k++) {
    var fx = npv(cashflows, x);
    var dfx = dnpv(cashflows, x);
    if (dfx === 0) {
      return { success: false, iterations: iterations, message: "Derivada igual a cero." };
    }
    var xNext = x - fx / dfx;
    iterations.push({
      iter: k,
      x: x,
      fx: fx
    });
    if (Math.abs(xNext - x) < tol || Math.abs(fx) < tol) {
      return { success: true, root: xNext, iterations: iterations };
    }
    x = xNext;
  }
  return { success: false, root: x, iterations: iterations, message: "No converge en el máximo de iteraciones." };
}

function buildTable(containerId, headers, rows) {
  var container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  if (!rows || rows.length === 0) {
    container.innerHTML = "<p>Sin datos.</p>";
    return;
  }
  var html = "<table><thead><tr>";
  headers.forEach(function (h) {
    html += "<th>" + h.label + "</th>";
  });
  html += "</tr></thead><tbody>";
  rows.forEach(function (row) {
    html += "<tr>";
    headers.forEach(function (h) {
      var value = row[h.key];
      if (typeof value === "number") {
        html += "<td>" + value.toFixed(6) + "</td>";
      } else {
        html += "<td>" + value + "</td>";
      }
    });
    html += "</tr>";
  });
  html += "</tbody></table>";
  container.innerHTML = html;
}

function parseCashflowsInput(value) {
  var parts = value.split(",");
  var result = [];
  for (var i = 0; i < parts.length; i++) {
    var v = parts[i].trim();
    if (v !== "") {
      var num = Number(v);
      if (!isNaN(num)) {
        result.push(num);
      }
    }
  }
  return result;
}

function parsePointsLines(value) {
  var lines = value.split("\n");
  var xs = [];
  var ys = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line === "") {
      continue;
    }
    var parts = line.split(",");
    if (parts.length !== 2) {
      return null;
    }
    var x = Number(parts[0].trim());
    var y = Number(parts[1].trim());
    if (isNaN(x) || isNaN(y)) {
      return null;
    }
    xs.push(x);
    ys.push(y);
  }
  if (xs.length === 0) {
    return null;
  }
  return { xs: xs, ys: ys };
}

function lagrangeEvaluate(xs, ys, x) {
  var n = xs.length;
  var result = 0;
  for (var i = 0; i < n; i++) {
    var term = ys[i];
    for (var j = 0; j < n; j++) {
      if (j !== i) {
        term *= (x - xs[j]) / (xs[i] - xs[j]);
      }
    }
    result += term;
  }
  return result;
}

function newtonCoefficients(xs, ys) {
  var n = xs.length;
  var levels = [];
  var firstLevel = [];
  for (var i = 0; i < n; i++) {
    firstLevel.push(ys[i]);
  }
  levels.push(firstLevel);
  var coeff = [firstLevel[0]];
  for (var k = 1; k < n; k++) {
    var prev = levels[k - 1];
    var nextLevel = [];
    for (var j = 0; j < n - k; j++) {
      var value = (prev[j + 1] - prev[j]) / (xs[j + k] - xs[j]);
      nextLevel.push(value);
    }
    levels.push(nextLevel);
    coeff.push(nextLevel[0]);
  }
  return { coeff: coeff, levels: levels };
}

function newtonEvaluate(xs, coeff, x) {
  var n = xs.length;
  var result = coeff[n - 1];
  for (var k = n - 2; k >= 0; k--) {
    result = result * (x - xs[k]) + coeff[k];
  }
  return result;
}

function trapezoidalRule(xs, ys) {
  var n = xs.length;
  if (n < 2) {
    return null;
  }
  var h = xs[1] - xs[0];
  for (var i = 2; i < n; i++) {
    var hi = xs[i] - xs[i - 1];
    if (Math.abs(hi - h) > 1e-8) {
      return null;
    }
  }
  var sum = ys[0] + ys[n - 1];
  for (var j = 1; j < n - 1; j++) {
    sum += 2 * ys[j];
  }
  return { value: (h * sum) / 2, h: h };
}

function simpsonRule(xs, ys) {
  var n = xs.length;
  if (n < 3) {
    return null;
  }
  var intervals = n - 1;
  if (intervals % 2 !== 0) {
    return null;
  }
  var h = xs[1] - xs[0];
  for (var i = 2; i < n; i++) {
    var hi = xs[i] - xs[i - 1];
    if (Math.abs(hi - h) > 1e-8) {
      return null;
    }
  }
  var sum = ys[0] + ys[n - 1];
  var oddSum = 0;
  var evenSum = 0;
  for (var j = 1; j < n - 1; j++) {
    if (j % 2 === 1) {
      oddSum += ys[j];
    } else {
      evenSum += ys[j];
    }
  }
  var value = (h / 3) * (sum + 4 * oddSum + 2 * evenSum);
  return { value: value, h: h };
}

document.addEventListener("DOMContentLoaded", function () {
  var navButtons = document.querySelectorAll(".nav-button");
  navButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      var section = b.getAttribute("data-section");
      showSection(section);
    });
  });

  var btnRoots = document.getElementById("btn-calc-roots");
  btnRoots.addEventListener("click", function () {
    var cashInput = document.getElementById("cashflows").value;
    var cashflows = parseCashflowsInput(cashInput);
    var a = Number(document.getElementById("interval-a").value);
    var b = Number(document.getElementById("interval-b").value);
    var x0 = Number(document.getElementById("newton-x0").value);
    var tol = Number(document.getElementById("tolerance-roots").value);
    var maxIter = parseInt(document.getElementById("maxiter-roots").value, 10);
    var summary = document.getElementById("roots-summary");

    if (!cashflows || cashflows.length === 0) {
      summary.innerHTML = "<div class='result-card'><h4>Error en los datos</h4><p>Entrada de flujos no válida. Escribe los valores separados por comas, por ejemplo: -10000,3000,4000,5000.</p></div>";
      document.getElementById("table-bisection").innerHTML = "";
      document.getElementById("table-newton").innerHTML = "";
      return;
    }

    var resBis = bisectionTir(cashflows, a, b, tol, maxIter);
    var resNew = newtonTir(cashflows, x0, tol, maxIter);

    var html = "";
    var tirBis = null;
    var tirNew = null;

    if (resBis.success) {
      tirBis = resBis.root * 100;
    }
    if (resNew.success) {
      tirNew = resNew.root * 100;
    }

    if (!resBis.success && !resNew.success) {
      html += "<div class='result-card'><h4>No se pudo calcular la TIR</h4>";
      html += "<p>Ambos métodos tuvieron problemas con los datos ingresados.</p>";
      html += "<p>Bisección: " + (resBis.message || "Error desconocido") + "</p>";
      html += "<p>Newton: " + (resNew.message || "Error desconocido") + "</p>";
      html += "<p class='result-note'>Revisa el intervalo inicial, el punto inicial de Newton y el formato de los flujos de caja.</p>";
      html += "</div>";
      summary.innerHTML = html;
    } else {
      html += "<div class='result-grid'>";
      html += "<div class='result-card'>";
      html += "<h4>Resumen numérico</h4>";
      if (resBis.success) {
        html += "<div class='result-row'><span class='result-label'>Bisección:</span><span class='result-value'>" + tirBis.toFixed(4) + "% (" + resBis.iterations.length + " iteraciones)</span></div>";
      } else {
        html += "<p>Bisección: " + (resBis.message || "No se obtuvo resultado.") + "</p>";
      }
      if (resNew.success) {
        html += "<div class='result-row'><span class='result-label'>Newton:</span><span class='result-value'>" + tirNew.toFixed(4) + "% (" + resNew.iterations.length + " iteraciones)</span></div>";
      } else {
        html += "<p>Newton: " + (resNew.message || "No se obtuvo resultado.") + "</p>";
      }
      if (resBis.success && resNew.success) {
        var diff = Math.abs(resBis.root - resNew.root) * 100;
        html += "<div class='result-row'><span class='result-label'>Diferencia entre métodos:</span><span class='result-value'>" + diff.toFixed(5) + "%</span></div>";
      }
      html += "</div>";

      html += "<div class='result-card'>";
      html += "<h4>Interpretación del resultado</h4>";
      var tirRef = null;
      if (tirBis !== null && tirNew !== null) {
        tirRef = (tirBis + tirNew) / 2;
      } else if (tirBis !== null) {
        tirRef = tirBis;
      } else if (tirNew !== null) {
        tirRef = tirNew;
      }
      if (tirRef !== null) {
        html += "<p>Según los flujos de caja que ingresaste, la tasa interna de retorno aproximada del proyecto es de <span class='result-highlight'>" + tirRef.toFixed(2) + "%</span>.</p>";
        html += "<p>Esto significa que, en promedio, el proyecto rinde aproximadamente ese porcentaje anual.</p>";
        html += "<p>Si la tasa mínima aceptable de tu empresa es menor que esta TIR, el proyecto puede considerarse <strong>atractivo</strong>. Si es mayor, el proyecto sería menos interesante.</p>";
        if (resBis.success && resNew.success) {
          html += "<p class='result-note'>Como ambos métodos entregan valores muy cercanos, la solución numérica es consistente y confiable.</p>";
        }
      } else {
        html += "<p>No se pudo interpretar una TIR única porque solo uno de los métodos produjo resultado y el valor no es confiable.</p>";
      }
      html += "</div>";
      html += "</div>";
      summary.innerHTML = html;
    }

    var headersBis = [
      { key: "iter", label: "Iteración" },
      { key: "a", label: "a" },
      { key: "b", label: "b" },
      { key: "m", label: "m" },
      { key: "fm", label: "f(m)" }
    ];
    buildTable("table-bisection", headersBis, resBis.iterations || []);

    var headersNew = [
      { key: "iter", label: "Iteración" },
      { key: "x", label: "x" },
      { key: "fx", label: "f(x)" }
    ];
    buildTable("table-newton", headersNew, resNew.iterations || []);
  });

  var btnInterp = document.getElementById("btn-calc-interpolation");
  btnInterp.addEventListener("click", function () {
    var pointsValue = document.getElementById("points-interpolation").value;
    var parsed = parsePointsLines(pointsValue);
    var summary = document.getElementById("interp-summary");
    var coeffContainer = document.getElementById("interp-newton-coeff");
    var pointsTable = document.getElementById("interp-points-table");

    if (!parsed) {
      summary.innerHTML = "<div class='result-card'><h4>Error en los datos</h4><p>Entrada de puntos no válida. Usa el formato x,y en cada línea, por ejemplo: 8,10.</p></div>";
      coeffContainer.innerHTML = "";
      pointsTable.innerHTML = "";
      return;
    }
    var xs = parsed.xs;
    var ys = parsed.ys;
    var xEval = Number(document.getElementById("x-eval").value);

    var yLag = lagrangeEvaluate(xs, ys, xEval);
    var nc = newtonCoefficients(xs, ys);
    var yNew = newtonEvaluate(xs, nc.coeff, xEval);
    var diff = Math.abs(yLag - yNew);

    var html = "";
    html += "<div class='result-grid'>";
    html += "<div class='result-card'>";
    html += "<h4>Resumen numérico</h4>";
    html += "<div class='result-row'><span class='result-label'>Lagrange:</span><span class='result-value'>" + yLag.toFixed(6) + "</span></div>";
    html += "<div class='result-row'><span class='result-label'>Newton:</span><span class='result-value'>" + yNew.toFixed(6) + "</span></div>";
    html += "<div class='result-row'><span class='result-label'>Diferencia absoluta:</span><span class='result-value'>" + diff.toExponential(3) + "</span></div>";
    html += "</div>";

    html += "<div class='result-card'>";
    html += "<h4>Interpretación del resultado</h4>";
    var yRef = 0.5 * (yLag + yNew);
    html += "<p>Para la hora x = <span class='result-highlight'>" + xEval.toFixed(2) + "</span>, la temperatura estimada es aproximadamente <span class='result-highlight'>" + yRef.toFixed(2) + " °C</span>.</p>";
    html += "<p>Ambos métodos de interpolación (Lagrange y Newton) usan los mismos datos medidos para construir un polinomio que se ajusta a las mediciones.</p>";
    if (diff < 1e-3) {
      html += "<p>Como la diferencia entre los métodos es muy pequeña, podemos confiar en que esta estimación es consistente con los datos originales.</p>";
    } else {
      html += "<p>La diferencia entre los métodos es notable; podría ser útil revisar los datos, agregar más mediciones o evaluar si el comportamiento de la temperatura es realmente suave entre los puntos.</p>";
    }
    html += "<p class='result-note'>Este valor representa la temperatura probable en una hora donde no se midió directamente, basada en todas las mediciones disponibles.</p>";
    html += "</div>";
    html += "</div>";
    summary.innerHTML = html;

    var rowsPoints = [];
    for (var i = 0; i < xs.length; i++) {
      rowsPoints.push({ x: xs[i], y: ys[i] });
    }
    var headersPoints = [
      { key: "x", label: "x" },
      { key: "y", label: "y" }
    ];
    buildTable("interp-points-table", headersPoints, rowsPoints);

    var rowsCoeff = [];
    for (var j = 0; j < nc.coeff.length; j++) {
      rowsCoeff.push({ index: j, value: nc.coeff[j] });
    }
    var headersCoeff = [
      { key: "index", label: "Índice" },
      { key: "value", label: "Coeficiente a" }
    ];
    buildTable("interp-newton-coeff", headersCoeff, rowsCoeff);
  });

  var btnIntegration = document.getElementById("btn-calc-integration");
  btnIntegration.addEventListener("click", function () {
    var pointsValue = document.getElementById("points-integration").value;
    var parsed = parsePointsLines(pointsValue);
    var summary = document.getElementById("integration-summary");

    if (!parsed) {
      summary.innerHTML = "<div class='result-card'><h4>Error en los datos</h4><p>Entrada de datos no válida. Usa el formato tiempo,velocidad en cada línea, por ejemplo: 0,0.</p></div>";
      return;
    }
    var xs = parsed.xs;
    var ys = parsed.ys;

    var trap = trapezoidalRule(xs, ys);
    var simp = simpsonRule(xs, ys);

    var html = "";
    html += "<div class='result-grid'>";
    html += "<div class='result-card'>";
    html += "<h4>Resumen numérico</h4>";

    if (trap) {
      html += "<div class='result-row'><span class='result-label'>Trapecios:</span><span class='result-value'>" + trap.value.toFixed(6) + " unidades</span></div>";
    } else {
      html += "<p>Trapecios: no disponible. Los tiempos deben tener un paso constante.</p>";
    }

    if (simp) {
      html += "<div class='result-row'><span class='result-label'>Simpson 1/3:</span><span class='result-value'>" + simp.value.toFixed(6) + " unidades</span><span class='result-badge'>Referencia</span></div>";
    } else {
      html += "<p>Simpson 1/3: no disponible. Se requiere número par de intervalos y paso constante.</p>";
    }

    if (trap && simp) {
      var diff = Math.abs(trap.value - simp.value);
      html += "<div class='result-row'><span class='result-label'>Diferencia absoluta:</span><span class='result-value'>" + diff.toExponential(3) + "</span></div>";
    }

    html += "</div>";

    html += "<div class='result-card'>";
    html += "<h4>Interpretación del resultado</h4>";
    if (trap || simp) {
      var t0 = xs[0];
      var tn = xs[xs.length - 1];
      var ref = null;
      if (simp) {
        ref = simp.value;
      } else if (trap) {
        ref = trap.value;
      }
      html += "<p>Entre t = <span class='result-highlight'>" + t0.toFixed(2) + "</span> y t = <span class='result-highlight'>" + tn.toFixed(2) + "</span>, el vehículo recorre aproximadamente <span class='result-highlight'>" + ref.toFixed(2) + "</span> unidades de distancia.</p>";
      html += "<p>El método de Simpson 1/3 suele ser más preciso que Trapecios cuando los datos son suaves, por eso se puede tomar como referencia principal si está disponible.</p>";
      if (trap && simp) {
        if (diff < 1e-1) {
          html += "<p>Como los dos métodos dan resultados muy similares, la aproximación de la distancia es consistente con las mediciones de velocidad.</p>";
        } else {
          html += "<p>La diferencia entre Trapecios y Simpson es grande; esto indica que podría haber cambios bruscos en la velocidad o que sería recomendable tomar más mediciones intermedias.</p>";
        }
      }
      html += "<p class='result-note'>La distancia se obtiene integrando numéricamente la velocidad en el tiempo, es decir, sumando los pequeños desplazamientos entre cada par de mediciones.</p>";
    } else {
      html += "<p>No se pudo interpretar la distancia porque ningún método pudo aplicarse correctamente. Revisa que los tiempos estén ordenados y tengan un paso constante.</p>";
    }
    html += "</div>";
    html += "</div>";

    summary.innerHTML = html;
  });
});