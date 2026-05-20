(function () {
  "use strict";

  var VERSION = "reverse-list-v2";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULT_VALUES = ["1", "2", "3", "4", "5"];
  var OP_LINES = [
    { key: "temp", text: "temp = cur.next" },
    { key: "rewire", text: "cur.next = pre" },
    { key: "pre", text: "pre = cur" },
    { key: "cur", text: "cur = temp" }
  ];
  var instanceId = 0;

  if (window.LinkListViz && window.LinkListViz.version === VERSION) {
    window.LinkListViz.initAll();
    return;
  }

  function createEl(tagName, className, text) {
    var el = document.createElement(tagName);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function createSvgEl(tagName, attrs) {
    var el = document.createElementNS(SVG_NS, tagName);
    Object.keys(attrs || {}).forEach(function (key) {
      el.setAttribute(key, attrs[key]);
    });
    return el;
  }

  function parseValues(raw) {
    if (!raw) return DEFAULT_VALUES.slice();
    var values = raw.split(",").map(function (item) {
      return item.trim();
    }).filter(Boolean);
    return values.length ? values : DEFAULT_VALUES.slice();
  }

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function makeState(options) {
    return {
      pre: options.pre,
      cur: options.cur,
      temp: options.temp,
      rev: options.rev.slice(),
      tailToNull: options.tailToNull,
      desc: options.desc,
      hint: options.hint,
      op: options.op || "init",
      activeForward: options.activeForward,
      activeReverse: options.activeReverse
    };
  }

  function createReverseListStates(values) {
    var count = values.length;

    if (count === 0) {
      return [
        makeState({
          pre: null,
          cur: null,
          temp: null,
          rev: [],
          tailToNull: false,
          desc: "空链表直接返回",
          hint: "if (head == null) return null",
          op: "init"
        })
      ];
    }

    var states = [];
    var reversedEdges = [];
    var tailToNull = true;
    var pre = -1;

    states.push(makeState({
      pre: pre,
      cur: 0,
      temp: null,
      rev: reversedEdges,
      tailToNull: tailToNull,
      desc: "初始化：pre 指向 null，cur 指向头节点",
      hint: "ListNode pre = null; ListNode cur = head",
      op: "init"
    }));

    for (var cur = 0; cur < count; cur += 1) {
      var temp = cur + 1;
      var activeForward = cur === count - 1 ? "tail" : cur;

      states.push(makeState({
        pre: pre,
        cur: cur,
        temp: temp,
        rev: reversedEdges,
        tailToNull: tailToNull,
        desc: "保存后继节点，避免断链后丢失剩余链表",
        hint: "ListNode temp = cur.next",
        op: "temp",
        activeForward: activeForward
      }));

      var reverseEdge = cur === 0 ? -1 : cur - 1;
      reversedEdges = reversedEdges.concat(reverseEdge);
      if (cur === count - 1) tailToNull = false;

      states.push(makeState({
        pre: pre,
        cur: cur,
        temp: temp,
        rev: reversedEdges,
        tailToNull: tailToNull,
        desc: "反转当前节点的 next 指针",
        hint: "cur.next = pre",
        op: "rewire",
        activeReverse: reverseEdge
      }));

      pre = cur;

      states.push(makeState({
        pre: pre,
        cur: cur,
        temp: temp,
        rev: reversedEdges,
        tailToNull: tailToNull,
        desc: "pre 前进到当前节点，已反转区间扩大一位",
        hint: "pre = cur",
        op: "pre"
      }));

      states.push(makeState({
        pre: pre,
        cur: temp,
        temp: null,
        rev: reversedEdges,
        tailToNull: tailToNull,
        desc: temp === count ? "循环结束：pre 指向新的头节点" : "cur 前进到 temp，继续处理未反转区间",
        hint: temp === count ? "return pre" : "cur = temp",
        op: "cur"
      }));
    }

    return states;
  }

  function createGeometry(count) {
    var nodeW = 58;
    var nodeH = 40;
    var gap = 72;
    var listW = count > 0 ? count * nodeW + (count - 1) * gap : 0;
    var width = Math.max(620, listW + 156);
    var firstX = count > 0 ? (width - listW) / 2 : width / 2;
    var positions = [];

    for (var i = 0; i < count; i += 1) {
      positions.push(firstX + nodeW / 2 + i * (nodeW + gap));
    }

    return {
      width: width,
      height: 292,
      count: count,
      nodeW: nodeW,
      nodeH: nodeH,
      nodeY: 154,
      fwdY: 154,
      revY: 188,
      nullLeft: count > 0 ? Math.max(28, firstX - 50) : width / 2 - 72,
      nullRight: count > 0 ? Math.min(width - 28, firstX + listW + 50) : width / 2 + 72,
      positions: positions
    };
  }

  function xForTarget(target, geometry) {
    if (target === null || target === undefined) return null;
    if (target === -1) return geometry.nullLeft;
    if (target === geometry.count) return geometry.nullRight;
    if (target >= 0 && target < geometry.count) return geometry.positions[target];
    return null;
  }

  function createMarker(id, className) {
    var marker = createSvgEl("marker", {
      id: id,
      markerWidth: "10",
      markerHeight: "8",
      refX: "9.6",
      refY: "4",
      orient: "auto",
      markerUnits: "strokeWidth"
    });
    marker.appendChild(createSvgEl("path", {
      d: "M 0 0 L 10 4 L 0 8 z",
      class: className
    }));
    return marker;
  }

  function reversePath(fromX, toX, y) {
    var mid = (fromX + toX) / 2;
    return "M " + fromX + " " + y + " C " + mid + " " + (y + 30) + ", " + mid + " " + (y + 30) + ", " + toX + " " + y;
  }

  function createPointer(name, label, y) {
    var width = label.length > 3 ? 48 : 42;
    var group = createSvgEl("g", {
      class: "ll-pointer ll-pointer--" + name,
      "data-pointer": name
    });

    group.appendChild(createSvgEl("line", {
      class: "ll-pointer__line",
      x1: "0",
      y1: String(y + 9),
      x2: "0",
      y2: "128",
      "stroke-width": "1.6"
    }));
    group.appendChild(createSvgEl("rect", {
      class: "ll-pointer__badge",
      x: String(-width / 2),
      y: String(y - 17),
      width: String(width),
      height: "24",
      rx: "6"
    }));

    var text = createSvgEl("text", {
      class: "ll-pointer__text",
      x: "0",
      y: String(y - 1),
      "text-anchor": "middle"
    });
    text.textContent = label;
    group.appendChild(text);

    return group;
  }

  function createSvg(values, geometry, markerBase) {
    var svg = createSvgEl("svg", {
      class: "ll-viz__svg",
      viewBox: "0 0 " + geometry.width + " " + geometry.height,
      role: "img",
      "aria-label": "反转链表动画"
    });

    var defs = createSvgEl("defs");
    defs.appendChild(createMarker(markerBase + "-forward", "ll-marker--forward"));
    defs.appendChild(createMarker(markerBase + "-reverse", "ll-marker--reverse"));
    svg.appendChild(defs);

    var labels = createSvgEl("g", { class: "ll-labels" });
    [
      { x: geometry.nullLeft, text: "null" },
      { x: geometry.nullRight, text: "null" }
    ].forEach(function (item) {
      var label = createSvgEl("text", {
        class: "ll-null-label",
        x: String(item.x),
        y: "160",
        "text-anchor": "middle"
      });
      label.textContent = item.text;
      labels.appendChild(label);
    });
    svg.appendChild(labels);

    var forwardLinks = createSvgEl("g", { class: "ll-links ll-links--forward" });
    for (var i = 0; i < values.length - 1; i += 1) {
      forwardLinks.appendChild(createSvgEl("line", {
        class: "ll-link ll-link--forward",
        "data-forward-edge": String(i),
        x1: String(geometry.positions[i] + geometry.nodeW / 2 + 8),
        y1: String(geometry.fwdY),
        x2: String(geometry.positions[i + 1] - geometry.nodeW / 2 - 8),
        y2: String(geometry.fwdY),
        "stroke-width": "2.2",
        "stroke-linecap": "round",
        "marker-end": "url(#" + markerBase + "-forward)"
      }));
    }

    if (values.length > 0) {
      forwardLinks.appendChild(createSvgEl("line", {
        class: "ll-link ll-link--forward",
        "data-forward-edge": "tail",
        x1: String(geometry.positions[values.length - 1] + geometry.nodeW / 2 + 8),
        y1: String(geometry.fwdY),
        x2: String(geometry.nullRight - 24),
        y2: String(geometry.fwdY),
        "stroke-width": "2.2",
        "stroke-linecap": "round",
        "marker-end": "url(#" + markerBase + "-forward)"
      }));
    }
    svg.appendChild(forwardLinks);

    var reverseLinks = createSvgEl("g", { class: "ll-links ll-links--reverse" });
    if (values.length > 0) {
      reverseLinks.appendChild(createSvgEl("path", {
        class: "ll-link ll-link--reverse",
        "data-reverse-edge": "-1",
        d: reversePath(
          geometry.positions[0] - geometry.nodeW / 2 - 8,
          geometry.nullLeft + 24,
          geometry.revY
        ),
        fill: "none",
        "stroke-width": "2.6",
        "stroke-linecap": "round",
        "marker-end": "url(#" + markerBase + "-reverse)"
      }));
    }

    for (var r = 0; r < values.length - 1; r += 1) {
      reverseLinks.appendChild(createSvgEl("path", {
        class: "ll-link ll-link--reverse",
        "data-reverse-edge": String(r),
        d: reversePath(
          geometry.positions[r + 1] - geometry.nodeW / 2 - 8,
          geometry.positions[r] + geometry.nodeW / 2 + 8,
          geometry.revY
        ),
        fill: "none",
        "stroke-width": "2.6",
        "stroke-linecap": "round",
        "marker-end": "url(#" + markerBase + "-reverse)"
      }));
    }
    svg.appendChild(reverseLinks);

    var nodes = createSvgEl("g", { class: "ll-nodes" });
    values.forEach(function (value, index) {
      var node = createSvgEl("g", {
        class: "ll-node",
        "data-node-index": String(index)
      });
      node.appendChild(createSvgEl("rect", {
        class: "ll-node__box",
        x: String(geometry.positions[index] - geometry.nodeW / 2),
        y: String(geometry.nodeY - geometry.nodeH / 2),
        width: String(geometry.nodeW),
        height: String(geometry.nodeH),
        rx: "8",
        "stroke-width": "2"
      }));

      var text = createSvgEl("text", {
        class: "ll-node__text",
        x: String(geometry.positions[index]),
        y: String(geometry.nodeY + 6),
        "text-anchor": "middle"
      });
      text.textContent = value;
      node.appendChild(text);
      nodes.appendChild(node);
    });
    svg.appendChild(nodes);

    var pointers = createSvgEl("g", { class: "ll-pointers" });
    pointers.appendChild(createPointer("temp", "temp", 42));
    pointers.appendChild(createPointer("pre", "pre", 70));
    pointers.appendChild(createPointer("cur", "cur", 98));
    svg.appendChild(pointers);

    return svg;
  }

  function initialize(root) {
    if (!root || root.dataset.llReady === "true") return null;

    var values = parseValues(root.dataset.values);
    var states = createReverseListStates(values);
    var geometry = createGeometry(values.length);
    var markerBase = "ll-marker-" + (++instanceId);
    var interval = Number(root.dataset.interval) || 1600;
    var shouldAutoplay = root.dataset.autoplay !== "false" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.llReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "反转链表指针动画");

    var header = createEl("div", "ll-viz__header");
    var titleWrap = createEl("div", "ll-viz__heading");
    var title = createEl("h3", "ll-viz__title", "反转链表：指针流程");
    var desc = createEl("div", "ll-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);

    var counter = createEl("div", "ll-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "ll-viz__hint");
    var stage = createEl("div", "ll-viz__stage");
    var svg = createSvg(values, geometry, markerBase);
    stage.appendChild(svg);

    var code = createEl("div", "ll-viz__code");
    OP_LINES.forEach(function (line) {
      var item = createEl("div", "ll-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "ll-viz__controls");
    var prevButton = createEl("button", "ll-viz__button", "上一步");
    var toggleButton = createEl("button", "ll-viz__button");
    var nextButton = createEl("button", "ll-viz__button", "下一步");
    var resetButton = createEl("button", "ll-viz__button", "重置");
    var range = createEl("input", "ll-viz__range");

    [prevButton, toggleButton, nextButton, resetButton].forEach(function (button) {
      button.type = "button";
    });
    range.type = "range";
    range.min = "0";
    range.max = String(states.length - 1);
    range.step = "1";
    range.value = "0";
    range.setAttribute("aria-label", "选择动画步骤");

    controls.appendChild(prevButton);
    controls.appendChild(toggleButton);
    controls.appendChild(nextButton);
    controls.appendChild(resetButton);
    controls.appendChild(range);

    root.replaceChildren(header, hint, stage, code, controls);

    var pointerEls = {
      pre: svg.querySelector('[data-pointer="pre"]'),
      cur: svg.querySelector('[data-pointer="cur"]'),
      temp: svg.querySelector('[data-pointer="temp"]')
    };
    var nodeEls = Array.prototype.slice.call(svg.querySelectorAll(".ll-node"));
    var forwardEls = Array.prototype.slice.call(svg.querySelectorAll("[data-forward-edge]"));
    var reverseEls = Array.prototype.slice.call(svg.querySelectorAll("[data-reverse-edge]"));
    var codeEls = Array.prototype.slice.call(code.querySelectorAll("[data-op]"));

    function stopTimer() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function setPlaying(nextPlaying) {
      playing = nextPlaying;
      toggleButton.textContent = playing ? "暂停" : "播放";
      toggleButton.setAttribute("aria-label", playing ? "暂停动画" : "播放动画");
      if (playing) scheduleNext();
      else stopTimer();
    }

    function scheduleNext() {
      stopTimer();
      if (!playing) return;

      timer = window.setTimeout(function () {
        if (!document.documentElement.contains(root)) {
          stopTimer();
          return;
        }

        if (step < states.length - 1) {
          step += 1;
          render();
          scheduleNext();
        } else {
          setPlaying(false);
        }
      }, interval);
    }

    function movePointer(el, target) {
      var x = xForTarget(target, geometry);
      var visible = x !== null;
      el.classList.toggle("is-visible", visible);
      if (visible) {
        el.style.transform = "translate(" + x + "px, 0)";
      }
    }

    function isReversed(edge, state) {
      return state.rev.indexOf(edge) !== -1;
    }

    function render() {
      var state = states[step];
      var doneThrough = state.rev.length - 1;

      desc.textContent = state.desc;
      hint.textContent = state.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      range.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      movePointer(pointerEls.pre, state.pre);
      movePointer(pointerEls.cur, state.cur);
      movePointer(pointerEls.temp, state.temp);

      forwardEls.forEach(function (el) {
        var rawEdge = el.getAttribute("data-forward-edge");
        var edge = rawEdge === "tail" ? "tail" : Number(rawEdge);
        var visible = edge === "tail" ? state.tailToNull : !isReversed(edge, state);
        el.classList.toggle("is-visible", visible);
        el.classList.toggle("is-active", state.activeForward === edge);
      });

      reverseEls.forEach(function (el) {
        var edge = Number(el.getAttribute("data-reverse-edge"));
        var visible = isReversed(edge, state);
        el.classList.toggle("is-visible", visible);
        el.classList.toggle("is-active", state.activeReverse === edge);
      });

      nodeEls.forEach(function (node) {
        var index = Number(node.getAttribute("data-node-index"));
        node.classList.toggle("is-done", index <= doneThrough);
        node.classList.toggle("is-pre", index === state.pre);
        node.classList.toggle("is-temp", index === state.temp);
        node.classList.toggle("is-cur", index === state.cur);
      });

      codeEls.forEach(function (line) {
        line.classList.toggle("is-active", line.dataset.op === state.op);
      });
    }

    function goTo(nextStep, pause) {
      step = Math.max(0, Math.min(states.length - 1, nextStep));
      if (pause) setPlaying(false);
      render();
    }

    prevButton.addEventListener("click", function () {
      goTo(step - 1, true);
    });

    nextButton.addEventListener("click", function () {
      goTo(step + 1, true);
    });

    resetButton.addEventListener("click", function () {
      goTo(0, true);
    });

    toggleButton.addEventListener("click", function () {
      if (playing) {
        setPlaying(false);
      } else {
        if (step >= states.length - 1) step = 0;
        render();
        setPlaying(true);
      }
    });

    range.addEventListener("input", function () {
      goTo(Number(range.value), true);
    });

    render();
    if (playing) scheduleNext();

    return {
      root: root,
      states: states,
      render: render,
      stop: stopTimer
    };
  }

  function initAll() {
    var roots = document.querySelectorAll('.ll-viz[data-algorithm="reverse-list"]');
    Array.prototype.forEach.call(roots, initialize);
  }

  window.LinkListViz = {
    version: VERSION,
    initAll: initAll,
    initialize: initialize,
    createReverseListStates: createReverseListStates
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  document.addEventListener("pjax:complete", initAll);
})();
