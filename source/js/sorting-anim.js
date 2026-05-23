(function () {
  "use strict";

  var VERSION = "sorting-v1";

  if (window.SortingViz && window.SortingViz.version === VERSION) {
    window.SortingViz.initAll();
    return;
  }

  function createEl(tagName, className, text) {
    var el = document.createElement(tagName);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  var INVERSE_PAIR_OP_LINES = [
    { key: "split", text: "递归拆分区间" },
    { key: "base", text: "单元素区间返回 0" },
    { key: "compare", text: "比较左右有序区间头部" },
    { key: "count", text: "nums[i] > nums[j]，累加 mid - i + 1" },
    { key: "merge", text: "写入归并结果" },
    { key: "return", text: "返回区间逆序对数量" }
  ];

  function cell(value, options) {
    options = options || {};
    return {
      value: value,
      status: options.status || "",
      pointer: options.pointer || "",
      muted: !!options.muted
    };
  }

  function state(options) {
    return {
      desc: options.desc,
      hint: options.hint,
      op: options.op,
      rows: options.rows || [],
      pairs: options.pairs || [],
      total: options.total || 0
    };
  }

  function createInversePairStates() {
    return [
      state({
        desc: "示例数组 [7,5,6,4]。逆序对统计不能暴力枚举，先按归并排序递归拆分。",
        hint: "reversePairsNum(nums, 0, 3, temp)",
        op: "split",
        rows: [
          { label: "原数组", items: [cell("7"), cell("5"), cell("6"), cell("4")] },
          { label: "拆分", items: [cell("[7,5]", { status: "left" }), cell("[6,4]", { status: "right" })] }
        ],
        total: 0
      }),
      state({
        desc: "继续拆分到单元素区间。单个元素内部没有逆序对，递归返回 0。",
        hint: "if (left == right) return 0;",
        op: "base",
        rows: [
          { label: "叶子区间", items: [cell("[7]"), cell("[5]"), cell("[6]"), cell("[4]")] },
          { label: "内部计数", items: [cell("0"), cell("0"), cell("0"), cell("0")] }
        ],
        total: 0
      }),
      state({
        desc: "合并 [7] 和 [5]。7 > 5，左侧从 i 到 mid 的所有元素都大于 5。",
        hint: "count += mid - i + 1 = 1",
        op: "count",
        rows: [
          { label: "左区间", items: [cell("7", { pointer: "i", status: "left" })] },
          { label: "右区间", items: [cell("5", { pointer: "j", status: "right" })] },
          { label: "归并结果", items: [cell("5", { status: "done" }), cell("7")] }
        ],
        pairs: ["(7,5)"],
        total: 1
      }),
      state({
        desc: "合并 [6] 和 [4]。6 > 4，同样产生 1 个逆序对。",
        hint: "count += mid - i + 1 = 1",
        op: "count",
        rows: [
          { label: "左区间", items: [cell("6", { pointer: "i", status: "left" })] },
          { label: "右区间", items: [cell("4", { pointer: "j", status: "right" })] },
          { label: "归并结果", items: [cell("4", { status: "done" }), cell("6")] }
        ],
        pairs: ["(7,5)", "(6,4)"],
        total: 2
      }),
      state({
        desc: "回到最外层，左右两段已经分别有序：[5,7] 和 [4,6]。先比较 5 和 4。",
        hint: "temp[i] = 5, temp[j] = 4",
        op: "compare",
        rows: [
          { label: "左有序段", items: [cell("5", { pointer: "i", status: "left" }), cell("7", { status: "left" })] },
          { label: "右有序段", items: [cell("4", { pointer: "j", status: "right" }), cell("6", { status: "right" })] },
          { label: "归并结果", items: [cell("_", { muted: true }), cell("_", { muted: true }), cell("_", { muted: true }), cell("_", { muted: true })] }
        ],
        pairs: ["(7,5)", "(6,4)"],
        total: 2
      }),
      state({
        desc: "因为 5 > 4，左侧当前 i 到 mid 的 [5,7] 都大于 4，一次性新增 2 个逆序对。",
        hint: "count += mid - i + 1 = 2",
        op: "count",
        rows: [
          { label: "左有序段", items: [cell("5", { pointer: "i", status: "left" }), cell("7", { status: "left" })] },
          { label: "右有序段", items: [cell("4", { pointer: "j", status: "right" }), cell("6", { status: "right" })] },
          { label: "归并结果", items: [cell("4", { status: "done" }), cell("_", { muted: true }), cell("_", { muted: true }), cell("_", { muted: true })] }
        ],
        pairs: ["(7,5)", "(6,4)", "(5,4)", "(7,4)"],
        total: 4
      }),
      state({
        desc: "接着比较 5 和 6。5 <= 6，不产生跨区间逆序对，直接写入 5。",
        hint: "nums[k] = temp[i]; i++;",
        op: "merge",
        rows: [
          { label: "左有序段", items: [cell("5", { status: "done" }), cell("7", { pointer: "i", status: "left" })] },
          { label: "右有序段", items: [cell("4", { status: "done" }), cell("6", { pointer: "j", status: "right" })] },
          { label: "归并结果", items: [cell("4", { status: "done" }), cell("5", { status: "done" }), cell("_", { muted: true }), cell("_", { muted: true })] }
        ],
        pairs: ["(7,5)", "(6,4)", "(5,4)", "(7,4)"],
        total: 4
      }),
      state({
        desc: "再比较 7 和 6。7 > 6，新增 1 个跨区间逆序对。",
        hint: "count += mid - i + 1 = 1",
        op: "count",
        rows: [
          { label: "左有序段", items: [cell("5", { status: "done" }), cell("7", { pointer: "i", status: "left" })] },
          { label: "右有序段", items: [cell("4", { status: "done" }), cell("6", { pointer: "j", status: "right" })] },
          { label: "归并结果", items: [cell("4", { status: "done" }), cell("5", { status: "done" }), cell("6", { status: "done" }), cell("_", { muted: true })] }
        ],
        pairs: ["(7,5)", "(6,4)", "(5,4)", "(7,4)", "(7,6)"],
        total: 5
      }),
      state({
        desc: "右区间耗尽，把左区间剩余的 7 写入结果，整个数组变成 [4,5,6,7]。",
        hint: "return (leftCount + rightCount + mergeCount) % MOD;",
        op: "return",
        rows: [
          { label: "排序结果", items: [cell("4", { status: "done" }), cell("5", { status: "done" }), cell("6", { status: "done" }), cell("7", { status: "done" })] },
          { label: "逆序对", items: [cell("5 个", { status: "answer" })] }
        ],
        pairs: ["(7,5)", "(6,4)", "(5,4)", "(7,4)", "(7,6)"],
        total: 5
      })
    ];
  }

  function createPairList(pairs) {
    var wrap = createEl("div", "sort-viz__pairs");
    if (!pairs.length) {
      wrap.appendChild(createEl("span", "sort-viz__pair is-muted", "暂无逆序对"));
      return wrap;
    }
    pairs.forEach(function (pair) {
      wrap.appendChild(createEl("span", "sort-viz__pair", pair));
    });
    return wrap;
  }

  function createCell(item) {
    var cellEl = createEl("div", "sort-viz__cell");
    var pointer = createEl("div", "sort-viz__pointer", item.pointer || "");
    cellEl.appendChild(pointer);

    var value = createEl("div", "sort-viz__value", item.value);
    if (item.status) value.classList.add("is-" + item.status);
    if (item.muted) value.classList.add("is-muted");
    cellEl.appendChild(value);
    return cellEl;
  }

  function createRow(row) {
    var rowEl = createEl("div", "sort-viz__row");
    rowEl.appendChild(createEl("div", "sort-viz__row-label", row.label));
    var items = createEl("div", "sort-viz__items");
    row.items.forEach(function (item) {
      items.appendChild(createCell(item));
    });
    rowEl.appendChild(items);
    return rowEl;
  }

  function initializeInversePairs(root) {
    if (!root || root.dataset.sortReady === "true") return null;

    var states = createInversePairStates();
    var interval = Number(root.dataset.interval) || 1600;
    var shouldAutoplay = root.dataset.autoplay === "true" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.sortReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "计算数组逆序对归并排序动画");

    var header = createEl("div", "sort-viz__header");
    var titleWrap = createEl("div", "sort-viz__heading");
    var title = createEl("h3", "sort-viz__title", "计算数组中的逆序对：归并统计");
    var desc = createEl("div", "sort-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);
    var counter = createEl("div", "sort-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "sort-viz__hint");
    var stage = createEl("div", "sort-viz__stage");
    var rows = createEl("div", "sort-viz__rows");
    var summary = createEl("div", "sort-viz__summary");
    stage.appendChild(rows);
    stage.appendChild(summary);

    var code = createEl("div", "sort-viz__code");
    INVERSE_PAIR_OP_LINES.forEach(function (line) {
      var item = createEl("div", "sort-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "sort-viz__controls");
    var prevButton = createEl("button", "sort-viz__button", "上一步");
    var toggleButton = createEl("button", "sort-viz__button");
    var nextButton = createEl("button", "sort-viz__button", "下一步");
    var resetButton = createEl("button", "sort-viz__button", "重置");
    var rangeInput = createEl("input", "sort-viz__range");

    [prevButton, toggleButton, nextButton, resetButton].forEach(function (button) {
      button.type = "button";
    });
    rangeInput.type = "range";
    rangeInput.min = "0";
    rangeInput.max = String(states.length - 1);
    rangeInput.step = "1";
    rangeInput.value = "0";
    rangeInput.setAttribute("aria-label", "选择动画步骤");

    controls.appendChild(prevButton);
    controls.appendChild(toggleButton);
    controls.appendChild(nextButton);
    controls.appendChild(resetButton);
    controls.appendChild(rangeInput);
    root.replaceChildren(header, hint, stage, code, controls);

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

    function render() {
      var current = states[step];
      desc.textContent = current.desc;
      hint.textContent = current.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      rangeInput.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      rows.replaceChildren();
      current.rows.forEach(function (row) {
        rows.appendChild(createRow(row));
      });

      summary.replaceChildren();
      summary.appendChild(createEl("div", "sort-viz__total", "当前累计：" + current.total));
      summary.appendChild(createPairList(current.pairs));

      codeEls.forEach(function (line) {
        line.classList.toggle("is-active", line.dataset.op === current.op);
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
    rangeInput.addEventListener("input", function () {
      goTo(Number(rangeInput.value), true);
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

  function initialize(root) {
    if (!root) return null;
    if (root.dataset.algorithm === "inverse-pairs") {
      return initializeInversePairs(root);
    }
    return null;
  }

  function initAll() {
    var roots = document.querySelectorAll(".sort-viz[data-algorithm]");
    Array.prototype.forEach.call(roots, initialize);
  }

  window.SortingViz = {
    version: VERSION,
    initAll: initAll,
    initialize: initialize,
    createInversePairStates: createInversePairStates
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  document.addEventListener("pjax:complete", initAll);
})();
