/**
 * Pyodide Runner - Lazy-loaded Python execution engine
 * Loads Pyodide only on first "Run" click (0KB initial page weight)
 */
(function () {
  'use strict';

  var PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/';
  var pyodide = null;
  var loading = false;
  var loadQueue = [];

  // Package name mapping (import name -> micropip/pyodide name)
  var PKG_MAP = {
    np: 'numpy', numpy: 'numpy',
    pd: 'pandas', pandas: 'pandas',
    plt: 'matplotlib', matplotlib: 'matplotlib',
    scipy: 'scipy', sklearn: 'scikit-learn',
    PIL: 'Pillow', cv2: 'opencv-python',
    sympy: 'sympy', networkx: 'networkx'
  };

  // Detect packages from code
  function detectPackages(code) {
    var pkgs = new Set();
    var importRe = /(?:^|\n)\s*(?:import|from)\s+([\w.]+)/g;
    var m;
    while ((m = importRe.exec(code)) !== null) {
      var mod = m[1].split('.')[0];
      if (PKG_MAP[mod]) pkgs.add(PKG_MAP[mod]);
    }
    return Array.from(pkgs);
  }

  // Load Pyodide runtime
  function loadPyodide() {
    return new Promise(function (resolve, reject) {
      if (pyodide) return resolve(pyodide);
      if (loading) {
        loadQueue.push({ resolve: resolve, reject: reject });
        return;
      }
      loading = true;
      var script = document.createElement('script');
      script.src = PYODIDE_CDN + 'pyodide.js';
      script.onload = function () {
        window.loadPyodide({ indexURL: PYODIDE_CDN }).then(function (py) {
          pyodide = py;
          loading = false;
          resolve(pyodide);
          loadQueue.forEach(function (q) { q.resolve(pyodide); });
          loadQueue = [];
        }).catch(function (err) {
          loading = false;
          reject(err);
          loadQueue.forEach(function (q) { q.reject(err); });
          loadQueue = [];
        });
      };
      script.onerror = function () {
        loading = false;
        var err = new Error('Failed to load Pyodide CDN');
        reject(err);
        loadQueue.forEach(function (q) { q.reject(err); });
        loadQueue = [];
      };
      document.head.appendChild(script);
    });
  }

  // Install packages via micropip
  function installPackages(py, pkgs) {
    if (!pkgs.length) return Promise.resolve();
    return py.loadPackagesFromImports(
      pkgs.map(function (p) { return 'import ' + p; }).join('\n'),
      { messageCallback: function () {} }
    ).catch(function () {
      // Fallback: try micropip
      return py.loadPackage('micropip').then(function () {
        return py.runPythonAsync(
          'import micropip\nawait micropip.install(' +
          JSON.stringify(pkgs) + ')'
        );
      });
    });
  }

  // Extract matplotlib plot as base64 PNG
  function extractPlot(py) {
    try {
      var result = py.runPython(
        'import io, base64\n' +
        'result = ""\n' +
        'try:\n' +
        '    import matplotlib.pyplot as plt\n' +
        '    fig = plt.gcf()\n' +
        '    if fig.get_axes():\n' +
        '        buf = io.BytesIO()\n' +
        '        fig.savefig(buf, format="png", dpi=100, bbox_inches="tight",\n' +
        '                    facecolor="#0d0d15", edgecolor="none")\n' +
        '        buf.seek(0)\n' +
        '        result = base64.b64encode(buf.read()).decode()\n' +
        '        plt.close("all")\n' +
        'except Exception as e:\n' +
        '    pass\n' +
        'result'
      );
      return result || '';
    } catch (e) {
      return '';
    }
  }

  // Run Python code, returns a Promise
  function runCode(code, outputEl, preloadPkgs) {
    outputEl.innerHTML = '<div class="pyrun-loading"><span class="pyrun-spinner"></span> Loading Python runtime...</div>';

    return loadPyodide().then(function (py) {
      outputEl.innerHTML = '<div class="pyrun-loading"><span class="pyrun-spinner"></span> Detecting packages...</div>';

      // Combine preload and detected packages
      var pkgs = detectPackages(code);
      if (preloadPkgs) {
        preloadPkgs.split(',').forEach(function (p) {
          p = p.trim();
          if (p && pkgs.indexOf(p) === -1) pkgs.push(p);
        });
      }

      var pkgPromise;
      if (pkgs.length) {
        outputEl.innerHTML = '<div class="pyrun-loading"><span class="pyrun-spinner"></span> Installing: ' +
          pkgs.join(', ') + '...</div>';
        pkgPromise = installPackages(py, pkgs);
      } else {
        pkgPromise = Promise.resolve();
      }

      return pkgPromise.then(function () {
        outputEl.innerHTML = '<div class="pyrun-loading"><span class="pyrun-spinner"></span> Running...</div>';

        // Set matplotlib to non-interactive backend before user code runs
        py.runPython(
          'import sys, io\n' +
          'try:\n' +
          '    import matplotlib\n' +
          '    matplotlib.use("Agg")\n' +
          '    import matplotlib.pyplot as plt\n' +
          '    _original_show = plt.show\n' +
          '    plt.show = lambda *a, **k: None\n' +
          'except ImportError:\n' +
          '    pass\n' +
          'sys.stdout = io.StringIO()\n' +
          'sys.stderr = io.StringIO()'
        );

        return py.runPythonAsync(code).then(function (result) {
          var out = py.runPython('sys.stdout.getvalue()');
          var err = py.runPython('sys.stderr.getvalue()');
          var plot = extractPlot(py);

          // Reset stdio
          py.runPython('sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__');

          renderOutput(outputEl, out, err, result, plot, null);
        });
      });
    }).catch(function (err) {
      // Try to get any captured output before the error
      var out = '', errOut = '';
      if (pyodide) {
        try {
          out = pyodide.runPython('sys.stdout.getvalue()');
          errOut = pyodide.runPython('sys.stderr.getvalue()');
          pyodide.runPython('sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__');
        } catch (e) { /* ignore */ }
      }
      renderOutput(outputEl, out, errOut, null, '', err);
    });
  }

  // Render output to DOM
  function renderOutput(el, stdout, stderr, result, plot, error) {
    var html = '';

    if (stdout) {
      html += '<pre class="pyrun-stdout">' + escapeHTML(stdout) + '</pre>';
    }

    if (stderr) {
      html += '<pre class="pyrun-stderr">' + escapeHTML(stderr) + '</pre>';
    }

    if (result !== null && result !== undefined && String(result) !== '' && String(result) !== 'undefined') {
      var resultStr = String(result);
      if (resultStr !== stdout.trim()) {
        html += '<pre class="pyrun-result">' + escapeHTML(resultStr) + '</pre>';
      }
    }

    if (plot) {
      html += '<div class="pyrun-plot"><img src="data:image/png;base64,' + plot + '" alt="matplotlib output" /></div>';
    }

    if (error) {
      var errMsg = error.message || String(error);
      // Clean up Pyodide stack traces
      var lines = errMsg.split('\n');
      var cleanLines = lines.filter(function (l) {
        return l.indexOf('pyodide.asm') === -1 && l.indexOf('wasm://') === -1;
      });
      html += '<pre class="pyrun-error">' + escapeHTML(cleanLines.join('\n')) + '</pre>';
    }

    if (!html) {
      html = '<div class="pyrun-empty">No output</div>';
    }

    el.innerHTML = html;
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Bind click events
  function init() {
    document.querySelectorAll('.pyrun-button').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';

      btn.addEventListener('click', function () {
        var container = btn.closest('.pyrun-container');
        var id = container.dataset.pyrunId;
        var preload = container.dataset.preload;
        var codeLines = container.querySelectorAll('td.code .line');
        var code = Array.prototype.map.call(codeLines, function(el) { return el.textContent; }).join('\n');
        var outputEl = document.getElementById(id + '-output');

        btn.disabled = true;
        btn.innerHTML = '<span class="pyrun-spinner"></span> Running...';

        runCode(code, outputEl, preload).then(function () {
          btn.disabled = false;
          btn.innerHTML = '<span class="pyrun-icon">▶</span> Run Python';
        });
      });
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
