(function () {
  "use strict";

  var VERSION = "link-list-v9";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULT_VALUES = ["1", "2", "3", "4", "5"];
  var REVERSE_LIST_OP_LINES = [
    { key: "temp", text: "temp = cur.next" },
    { key: "rewire", text: "cur.next = pre" },
    { key: "pre", text: "pre = cur" },
    { key: "cur", text: "cur = temp" }
  ];
  var REVERSE_BETWEEN_OP_LINES = [
    { key: "seek", text: "pre 移到 m 前一位" },
    { key: "cur", text: "cur = pre.next" },
    { key: "then", text: "then = cur.next" },
    { key: "cut", text: "cur.next = then.next" },
    { key: "link", text: "then.next = pre.next" },
    { key: "insert", text: "pre.next = then" },
    { key: "advance", text: "then = cur.next" }
  ];
  var REVERSE_K_OP_LINES = [
    { key: "check", text: "检查剩余节点 >= k" },
    { key: "cur", text: "start = pre.next" },
    { key: "then", text: "then = start.next" },
    { key: "cut", text: "start.next = then.next" },
    { key: "link", text: "then.next = pre.next" },
    { key: "insert", text: "pre.next = then" },
    { key: "advance", text: "pre = start" }
  ];
  var MERGE_SORTED_OP_LINES = [
    { key: "init", text: "cur = dummy" },
    { key: "compare", text: "比较 pHead1 和 pHead2" },
    { key: "take1", text: "cur.next = pHead1" },
    { key: "take2", text: "cur.next = pHead2" },
    { key: "advance", text: "cur = cur.next" },
    { key: "rest", text: "接上剩余链表" }
  ];
  var MERGE_K_OP_LINES = [
    { key: "divide", text: "divide(left, right)" },
    { key: "split", text: "mid = (left + right) / 2" },
    { key: "base", text: "left == right，返回单链表" },
    { key: "merge", text: "Merge(leftList, rightList)" },
    { key: "compare", text: "比较两个链表头节点" },
    { key: "append", text: "接入较小节点" },
    { key: "return", text: "返回合并结果" }
  ];
  var DETECT_CYCLE_OP_LINES = [
    { key: "init", text: "slow = fast = head" },
    { key: "guard", text: "fast != null && fast.next != null" },
    { key: "move", text: "slow 走 1 步，fast 走 2 步" },
    { key: "meet", text: "fast == slow，存在环" },
    { key: "null", text: "fast 到达 null，无环" }
  ];
  var CYCLE_ENTRY_OP_LINES = [
    { key: "detect", text: "先找到相遇点 C" },
    { key: "meet", text: "slow == fast，得到 C" },
    { key: "reset", text: "p1 = head, p2 = C" },
    { key: "walk", text: "p1 和 p2 同速前进" },
    { key: "entry", text: "p1 == p2，入口 B" },
    { key: "proof", text: "C 到 B 的距离 = A 到 B" }
  ];
  var INTERSECTION_OP_LINES = [
    { key: "count", text: "分别统计两个链表长度" },
    { key: "align", text: "长链表先走差值步" },
    { key: "walk", text: "两个指针同步前进" },
    { key: "meet", text: "p1 == p2，找到公共节点" }
  ];
  var SORT_LIST_OP_LINES = [
    { key: "split", text: "快慢指针找到中点并断开" },
    { key: "recurse", text: "递归排序左右链表" },
    { key: "compare", text: "比较两个有序链表头" },
    { key: "merge", text: "接入较小节点" },
    { key: "return", text: "返回合并后的有序链表" }
  ];
  var ODD_EVEN_OP_LINES = [
    { key: "init", text: "odd=head, even=head.next" },
    { key: "odd", text: "odd.next = even.next" },
    { key: "even", text: "even.next = odd.next" },
    { key: "advance", text: "odd/even 向后移动" },
    { key: "connect", text: "odd.next = evenHead" }
  ];
  var DELETE_DUP_ALL_OP_LINES = [
    { key: "init", text: "dummy + pre/start/then" },
    { key: "compare", text: "比较 start 和 then" },
    { key: "skip", text: "跳过重复 then，flag=1" },
    { key: "delete", text: "删除重复段 start" },
    { key: "keep", text: "当前值唯一，整体后移" },
    { key: "tail", text: "处理尾部重复段" }
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

  function parseListGroup(raw) {
    if (!raw) {
      return [["1", "2"], ["1", "4", "5"], ["6"]];
    }
    var lists = raw.split("|").map(function (part) {
      return part.split(",").map(function (item) {
        return item.trim();
      }).filter(Boolean);
    });
    return lists.filter(function (list) { return list.length > 0; });
  }

  function valueForCompare(value) {
    var number = Number(value);
    return Number.isNaN(number) ? value : number;
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

  function clampRange(count, m, n) {
    var start = Math.max(1, Math.min(count, Number(m) || 1));
    var end = Math.max(1, Math.min(count, Number(n) || count));
    if (start > end) {
      var temp = start;
      start = end;
      end = temp;
    }
    return { start: start - 1, end: end - 1, m: start, n: end };
  }

  function createEdgesFromOrder(order, count) {
    var edges = [];
    for (var i = 0; i < order.length - 1; i += 1) {
      edges.push({ from: order[i], to: order[i + 1] });
    }
    if (order.length > 0) {
      edges.push({ from: order[order.length - 1], to: count });
    }
    return edges;
  }

  function makeBetweenState(options) {
    return {
      pre: options.pre,
      cur: options.cur,
      then: options.then,
      edges: options.edges.slice(),
      extraEdges: (options.extraEdges || []).slice(),
      done: (options.done || []).slice(),
      order: (options.order || []).slice(),
      check: options.check,
      start: options.start,
      windowNodes: (options.windowNodes || []).slice(),
      windowStart: options.windowStart,
      windowEnd: options.windowEnd,
      windowStartSlot: options.windowStartSlot,
      windowEndSlot: options.windowEndSlot,
      groupIndex: options.groupIndex,
      desc: options.desc,
      hint: options.hint,
      op: options.op || "seek",
      activeEdge: options.activeEdge || null
    };
  }

  function createReverseBetweenStates(values, m, n) {
    var count = values.length;
    var range = clampRange(count, m, n);
    var states = [];
    var order = values.map(function (_, index) { return index; });
    var pre = range.start - 1;
    var cur = range.start;
    var then = cur + 1 <= range.end ? cur + 1 : null;
    var windowStart = range.start;
    var windowEnd = range.end;

    if (count === 0) {
      return [
        makeBetweenState({
          pre: null,
          cur: null,
          then: null,
          edges: [],
          order: [],
          windowStart: 0,
          windowEnd: 0,
          desc: "空链表没有可反转区间",
          hint: "if (head == null) return null",
          op: "seek"
        })
      ];
    }

    states.push(makeBetweenState({
      pre: pre,
      cur: null,
      then: null,
      edges: createEdgesFromOrder(order, count),
      order: order,
      windowStart: windowStart,
      windowEnd: windowEnd,
      desc: "先让 pre 停在反转区间的前一个节点",
      hint: "for (int i = 0; i < m - 1; i++) pre = pre.next",
      op: "seek"
    }));

    states.push(makeBetweenState({
      pre: pre,
      cur: cur,
      then: null,
      edges: createEdgesFromOrder(order, count),
      order: order,
      windowStart: windowStart,
      windowEnd: windowEnd,
      desc: "cur 固定在区间第一个节点，它会成为反转后区间的尾部",
      hint: "ListNode cur = pre.next",
      op: "cur"
    }));

    if (range.start === range.end) {
      states.push(makeBetweenState({
        pre: pre,
        cur: cur,
        then: null,
        edges: createEdgesFromOrder(order, count),
        order: order,
        windowStart: windowStart,
        windowEnd: windowEnd,
        desc: "m 与 n 相同，不需要调整指针",
        hint: "if (m == n) return head",
        op: "advance"
      }));
      return states;
    }

    states.push(makeBetweenState({
      pre: pre,
      cur: cur,
      then: then,
      edges: createEdgesFromOrder(order, count),
      order: order,
      windowStart: windowStart,
      windowEnd: windowEnd,
      desc: "then 指向 cur 后面的节点，每轮把 then 头插到区间最前面",
      hint: "ListNode then = cur.next",
      op: "then",
      activeEdge: { from: cur, to: then }
    }));

    for (var i = 0; i < range.end - range.start; i += 1) {
      var curPos = order.indexOf(cur);
      var thenNode = order[curPos + 1];
      var afterThen = curPos + 2 < order.length ? order[curPos + 2] : count;
      var headOfWindow = order[range.start];
      var detachedOrder = order.slice();
      detachedOrder.splice(curPos + 1, 1);

      states.push(makeBetweenState({
        pre: pre,
        cur: cur,
        then: thenNode,
        edges: createEdgesFromOrder(detachedOrder, count),
        order: order,
        done: order.slice(range.start, curPos).filter(function (node) { return node !== cur; }),
        windowStart: windowStart,
        windowEnd: windowEnd,
        desc: "先让 cur 越过 then，保住区间后半段",
        hint: "cur.next = then.next",
        op: "cut",
        activeEdge: { from: cur, to: afterThen }
      }));

      states.push(makeBetweenState({
        pre: pre,
        cur: cur,
        then: thenNode,
        edges: createEdgesFromOrder(detachedOrder, count),
        extraEdges: [{ from: thenNode, to: headOfWindow, type: "pending" }],
        order: order,
        done: order.slice(range.start, curPos).filter(function (node) { return node !== cur; }),
        windowStart: windowStart,
        windowEnd: windowEnd,
        desc: "再让 then 指向当前区间头，准备插入到 pre 后面",
        hint: "then.next = pre.next",
        op: "link",
        activeEdge: { from: thenNode, to: headOfWindow, type: "pending" }
      }));

      order = detachedOrder;
      order.splice(range.start, 0, thenNode);

      states.push(makeBetweenState({
        pre: pre,
        cur: cur,
        then: thenNode,
        edges: createEdgesFromOrder(order, count),
        order: order,
        done: order.slice(range.start, order.indexOf(cur)),
        windowStart: windowStart,
        windowEnd: windowEnd,
        desc: "pre 接上 then，完成一次头插",
        hint: "pre.next = then",
        op: "insert",
        activeEdge: { from: pre, to: thenNode }
      }));

      curPos = order.indexOf(cur);
      then = curPos + 1 < order.length ? order[curPos + 1] : null;

      states.push(makeBetweenState({
        pre: pre,
        cur: cur,
        then: then,
        edges: createEdgesFromOrder(order, count),
        order: order,
        done: order.slice(range.start, curPos),
        windowStart: windowStart,
        windowEnd: windowEnd,
        desc: then === null || i === range.end - range.start - 1 ? "区间反转完成，链表其他部分保持连接" : "then 前进到 cur 后面的下一个待头插节点",
        hint: then === null || i === range.end - range.start - 1 ? "return dummy.next" : "then = cur.next",
        op: "advance",
        activeEdge: then === null ? null : { from: cur, to: then }
      }));
    }

    return states;
  }

  function clampGroupSize(count, k) {
    if (count <= 0) return 1;
    return Math.max(1, Math.min(count, Number(k) || 2));
  }

  function createReverseKStates(values, k) {
    var count = values.length;
    var groupSize = clampGroupSize(count, k);
    var states = [];
    var order = values.map(function (_, index) { return index; });
    var pre = -1;
    var groupIndex = 1;
    var completed = [];

    function groupWindow(startSlot, size) {
      return order.slice(startSlot, Math.min(count, startSlot + size));
    }

    function makeState(options) {
      var startSlot = options.windowStartSlot;
      var size = options.windowSize || groupSize;
      return makeBetweenState({
        pre: options.pre,
        cur: options.start,
        start: options.start,
        then: options.then,
        check: options.check,
        edges: options.edges || createEdgesFromOrder(options.order || order, count),
        extraEdges: options.extraEdges,
        done: options.done || completed,
        order: options.order || order,
        windowNodes: options.windowNodes || (startSlot === null || startSlot === undefined ? [] : groupWindow(startSlot, size)),
        windowStart: 0,
        windowEnd: count - 1,
        windowStartSlot: startSlot,
        windowEndSlot: startSlot === null || startSlot === undefined ? null : Math.min(count - 1, startSlot + size - 1),
        groupIndex: groupIndex,
        desc: options.desc,
        hint: options.hint,
        op: options.op,
        activeEdge: options.activeEdge
      });
    }

    if (count === 0) {
      return [
        makeState({
          pre: null,
          start: null,
          then: null,
          check: null,
          order: [],
          edges: [],
          windowStartSlot: null,
          windowSize: 0,
          desc: "空链表没有可以反转的分组",
          hint: "if (head == null) return null",
          op: "check"
        })
      ];
    }

    if (groupSize === 1) {
      return [
        makeState({
          pre: -1,
          start: 0,
          then: null,
          check: 0,
          windowStartSlot: 0,
          windowSize: 1,
          desc: "k = 1 时每组只有一个节点，链表保持不变",
          hint: "if (k <= 1) return head",
          op: "check"
        })
      ];
    }

    while (true) {
      var groupStartSlot = pre === -1 ? 0 : order.indexOf(pre) + 1;
      var remaining = count - groupStartSlot;
      var check = remaining > 0 ? order[Math.min(count - 1, groupStartSlot + groupSize - 1)] : count;

      states.push(makeState({
        pre: pre,
        start: remaining > 0 ? order[groupStartSlot] : null,
        then: null,
        check: check,
        windowStartSlot: remaining > 0 ? groupStartSlot : null,
        windowSize: remaining >= groupSize ? groupSize : remaining,
        desc: remaining >= groupSize ? "第 " + groupIndex + " 组节点数量足够，准备反转这一组" : "剩余节点不足 " + groupSize + " 个，尾部保持原顺序",
        hint: "while (check != null && cnt < k) check = check.next",
        op: "check"
      }));

      if (remaining < groupSize) break;

      var start = order[groupStartSlot];
      var then = order[groupStartSlot + 1];

      states.push(makeState({
        pre: pre,
        start: start,
        then: null,
        check: check,
        windowStartSlot: groupStartSlot,
        desc: "start 固定在本组第一个节点，它会变成本组反转后的尾部",
        hint: "ListNode start = pre.next",
        op: "cur"
      }));

      states.push(makeState({
        pre: pre,
        start: start,
        then: then,
        check: check,
        windowStartSlot: groupStartSlot,
        desc: "then 指向 start 后面的节点，每轮把 then 头插到本组最前面",
        hint: "ListNode then = start.next",
        op: "then",
        activeEdge: { from: start, to: then }
      }));

      for (var i = 1; i < groupSize; i += 1) {
        var startPos = order.indexOf(start);
        var thenNode = order[startPos + 1];
        var afterThen = startPos + 2 < order.length ? order[startPos + 2] : count;
        var headOfGroup = order[groupStartSlot];
        var detachedOrder = order.slice();
        detachedOrder.splice(startPos + 1, 1);

        states.push(makeState({
          pre: pre,
          start: start,
          then: thenNode,
          check: check,
          edges: createEdgesFromOrder(detachedOrder, count),
          order: order,
          windowStartSlot: groupStartSlot,
          desc: "先让 start 越过 then，保住本组后半段",
          hint: "start.next = then.next",
          op: "cut",
          activeEdge: { from: start, to: afterThen }
        }));

        states.push(makeState({
          pre: pre,
          start: start,
          then: thenNode,
          check: check,
          edges: createEdgesFromOrder(detachedOrder, count),
          extraEdges: [{ from: thenNode, to: headOfGroup, type: "pending" }],
          order: order,
          windowStartSlot: groupStartSlot,
          desc: "让 then 指向当前组头，准备插入到 pre 后面",
          hint: "then.next = pre.next",
          op: "link",
          activeEdge: { from: thenNode, to: headOfGroup, type: "pending" }
        }));

        order = detachedOrder;
        order.splice(groupStartSlot, 0, thenNode);
        startPos = order.indexOf(start);
        then = i < groupSize - 1 ? order[startPos + 1] : null;

        states.push(makeState({
          pre: pre,
          start: start,
          then: thenNode,
          check: check,
          order: order,
          windowStartSlot: groupStartSlot,
          desc: "pre 接上 then，本组完成一次头插",
          hint: "pre.next = then",
          op: "insert",
          activeEdge: { from: pre, to: thenNode }
        }));

        states.push(makeState({
          pre: pre,
          start: start,
          then: then,
          check: check,
          order: order,
          windowStartSlot: groupStartSlot,
          desc: then === null ? "本组反转完成，准备把 pre 移到本组尾部" : "then 前进到 start 后面的下一个待头插节点",
          hint: then === null ? "pre = start" : "then = start.next",
          op: "advance",
          activeEdge: then === null ? null : { from: start, to: then }
        }));
      }

      completed = order.slice(0, groupStartSlot + groupSize);
      pre = start;

      states.push(makeState({
        pre: pre,
        start: null,
        then: null,
        check: null,
        done: completed,
        order: order,
        windowStartSlot: groupStartSlot,
        desc: "第 " + groupIndex + " 组完成，pre 移到本组尾部，继续检查下一组",
        hint: "pre = start",
        op: "advance"
      }));

      groupIndex += 1;
    }

    return states;
  }

  function makeMergeState(options) {
    return {
      i: options.i,
      j: options.j,
      result: (options.result || []).slice(),
      selected: options.selected || null,
      appended: options.appended || null,
      desc: options.desc,
      hint: options.hint,
      op: options.op || "init"
    };
  }

  function createMergeSortedStates(listA, listB) {
    var states = [];
    var i = 0;
    var j = 0;
    var result = [];

    states.push(makeMergeState({
      i: i,
      j: j,
      result: result,
      desc: "创建 dummy 和 cur，cur 用来连接结果链表的尾部",
      hint: "ListNode dummy = new ListNode(0); ListNode cur = dummy;",
      op: "init"
    }));

    while (i < listA.length && j < listB.length) {
      var aValue = listA[i];
      var bValue = listB[j];
      var takeA = valueForCompare(aValue) <= valueForCompare(bValue);

      states.push(makeMergeState({
        i: i,
        j: j,
        result: result,
        selected: takeA ? "a" : "b",
        desc: "比较 " + aValue + " 和 " + bValue + "，选择较小的节点",
        hint: "if (pHead1.val <= pHead2.val)",
        op: "compare"
      }));

      if (takeA) {
        result = result.concat({ list: "a", index: i, value: aValue });
        states.push(makeMergeState({
          i: i,
          j: j,
          result: result,
          selected: "a",
          appended: "a:" + i,
          desc: aValue + " 更小，把它接到结果链表尾部",
          hint: "cur.next = pHead1; pHead1 = pHead1.next;",
          op: "take1"
        }));
        i += 1;
      } else {
        result = result.concat({ list: "b", index: j, value: bValue });
        states.push(makeMergeState({
          i: i,
          j: j,
          result: result,
          selected: "b",
          appended: "b:" + j,
          desc: bValue + " 更小，把它接到结果链表尾部",
          hint: "cur.next = pHead2; pHead2 = pHead2.next;",
          op: "take2"
        }));
        j += 1;
      }

      states.push(makeMergeState({
        i: i,
        j: j,
        result: result,
        appended: result.length ? result[result.length - 1].list + ":" + result[result.length - 1].index : null,
        desc: "cur 前进到结果链表尾部，继续比较两个链表当前节点",
        hint: "cur = cur.next;",
        op: "advance"
      }));
    }

    if (i < listA.length || j < listB.length) {
      var restList = i < listA.length ? "a" : "b";
      var restValues = i < listA.length ? listA.slice(i) : listB.slice(j);
      var start = i < listA.length ? i : j;
      var restItems = restValues.map(function (value, offset) {
        return { list: restList, index: start + offset, value: value };
      });
      result = result.concat(restItems);
      states.push(makeMergeState({
        i: i,
        j: j,
        result: result,
        selected: restList,
        appended: restItems.length ? restItems[0].list + ":" + restItems[0].index : null,
        desc: "其中一个链表已经遍历完，直接接上另一个链表的剩余部分",
        hint: "cur.next = pHead1 != null ? pHead1 : pHead2;",
        op: "rest"
      }));
    }

    states.push(makeMergeState({
      i: listA.length,
      j: listB.length,
      result: result,
      desc: "合并完成，返回 dummy.next",
      hint: "return dummy.next;",
      op: "rest"
    }));

    return states;
  }

  function intervalKey(left, right) {
    return String(left) + "-" + String(right);
  }

  function formatList(values) {
    return "{" + values.join(",") + "}";
  }

  function makeMergeKState(options) {
    return {
      active: options.active || null,
      done: (options.done || []).slice(),
      mergeLeft: (options.mergeLeft || []).slice(),
      mergeRight: (options.mergeRight || []).slice(),
      result: (options.result || []).slice(),
      i: options.i || 0,
      j: options.j || 0,
      selected: options.selected || null,
      desc: options.desc,
      hint: options.hint,
      op: options.op || "divide"
    };
  }

  function mergeValuesForK(leftValues, rightValues, context, states, doneKeys) {
    var i = 0;
    var j = 0;
    var result = [];

    states.push(makeMergeKState({
      active: context.key,
      done: doneKeys,
      mergeLeft: leftValues,
      mergeRight: rightValues,
      result: result,
      i: i,
      j: j,
      desc: "开始合并区间 [" + context.left + "," + context.mid + "] 和 [" + (context.mid + 1) + "," + context.right + "]",
      hint: "return Merge(leftList, rightList);",
      op: "merge"
    }));

    while (i < leftValues.length && j < rightValues.length) {
      var leftValue = leftValues[i];
      var rightValue = rightValues[j];
      var takeLeft = valueForCompare(leftValue) <= valueForCompare(rightValue);

      states.push(makeMergeKState({
        active: context.key,
        done: doneKeys,
        mergeLeft: leftValues,
        mergeRight: rightValues,
        result: result,
        i: i,
        j: j,
        selected: takeLeft ? "left" : "right",
        desc: "比较 " + leftValue + " 和 " + rightValue + "，选择较小节点",
        hint: "if (pHead1.val <= pHead2.val)",
        op: "compare"
      }));

      if (takeLeft) {
        result = result.concat(leftValue);
        i += 1;
      } else {
        result = result.concat(rightValue);
        j += 1;
      }

      states.push(makeMergeKState({
        active: context.key,
        done: doneKeys,
        mergeLeft: leftValues,
        mergeRight: rightValues,
        result: result,
        i: i,
        j: j,
        selected: takeLeft ? "left" : "right",
        desc: "把 " + result[result.length - 1] + " 接到当前合并结果的尾部",
        hint: "cur.next = smaller; cur = cur.next;",
        op: "append"
      }));
    }

    if (i < leftValues.length || j < rightValues.length) {
      result = result.concat(i < leftValues.length ? leftValues.slice(i) : rightValues.slice(j));
      states.push(makeMergeKState({
        active: context.key,
        done: doneKeys,
        mergeLeft: leftValues,
        mergeRight: rightValues,
        result: result,
        i: leftValues.length,
        j: rightValues.length,
        desc: "一侧已经合并完，直接接上另一侧剩余节点",
        hint: "cur.next = pHead1 != null ? pHead1 : pHead2;",
        op: "append"
      }));
    }

    return result;
  }

  function createMergeKStates(lists) {
    var states = [];
    var doneKeys = [];

    function solve(left, right, depth) {
      var key = intervalKey(left, right);
      states.push(makeMergeKState({
        active: key,
        done: doneKeys,
        desc: "进入递归区间 [" + left + "," + right + "]",
        hint: "divideList(lists, " + left + ", " + right + ")",
        op: "divide"
      }));

      if (left === right) {
        doneKeys = doneKeys.concat(key);
        states.push(makeMergeKState({
          active: key,
          done: doneKeys,
          result: lists[left],
          desc: "区间 [" + left + "," + right + "] 只有一个链表，直接返回 " + formatList(lists[left]),
          hint: "if (left == right) return lists.get(left);",
          op: "base"
        }));
        return lists[left].slice();
      }

      var mid = Math.floor((left + right) / 2);
      states.push(makeMergeKState({
        active: key,
        done: doneKeys,
        desc: "把区间 [" + left + "," + right + "] 拆成 [" + left + "," + mid + "] 和 [" + (mid + 1) + "," + right + "]",
        hint: "int mid = (left + right) / 2;",
        op: "split"
      }));

      var leftResult = solve(left, mid, depth + 1);
      var rightResult = solve(mid + 1, right, depth + 1);
      var merged = mergeValuesForK(leftResult, rightResult, {
        key: key,
        left: left,
        mid: mid,
        right: right
      }, states, doneKeys);

      doneKeys = doneKeys.concat(key);
      states.push(makeMergeKState({
        active: key,
        done: doneKeys,
        result: merged,
        desc: "区间 [" + left + "," + right + "] 合并完成，返回 " + formatList(merged),
        hint: "return mergedHead;",
        op: "return"
      }));
      return merged;
    }

    if (!lists.length) {
      return [
        makeMergeKState({
          desc: "没有输入链表，直接返回 null",
          hint: "if (lists == null || lists.size() == 0) return null;",
          op: "base"
        })
      ];
    }

    solve(0, lists.length - 1, 0);
    return states;
  }

  function makeCycleState(options) {
    return {
      slow: options.slow,
      fast: options.fast,
      meet: options.meet || false,
      noCycle: options.noCycle || false,
      desc: options.desc,
      hint: options.hint,
      op: options.op || "init"
    };
  }

  function createDetectCycleStates(values, cycleStart) {
    var count = values.length;
    var start = Number(cycleStart);
    var hasCycle = count > 0 && start >= 0 && start < count;
    var states = [];
    var slow = count > 0 ? 0 : null;
    var fast = count > 0 ? 0 : null;

    function next(node) {
      if (node === null || node === undefined) return null;
      if (node === count - 1) return hasCycle ? start : null;
      return node + 1;
    }

    states.push(makeCycleState({
      slow: slow,
      fast: fast,
      desc: hasCycle ? "初始化：slow 和 fast 都从 head 出发，尾节点会连回节点 " + values[start] : "初始化：slow 和 fast 都从 head 出发",
      hint: "ListNode slow = head; ListNode fast = head;",
      op: "init"
    }));

    if (count < 2) {
      states.push(makeCycleState({
        slow: slow,
        fast: fast,
        noCycle: true,
        desc: "链表长度小于 2，不可能形成可检测的追击过程",
        hint: "if (head == null || head.next == null) return false;",
        op: "null"
      }));
      return states;
    }

    var limit = hasCycle ? count * 3 + 2 : count + 2;
    for (var step = 0; step < limit; step += 1) {
      states.push(makeCycleState({
        slow: slow,
        fast: fast,
        desc: "先检查 fast 和 fast.next，确保 fast 可以安全走两步",
        hint: "while (fast != null && fast.next != null)",
        op: "guard"
      }));

      if (fast === null || next(fast) === null) {
        states.push(makeCycleState({
          slow: slow,
          fast: fast,
          noCycle: true,
          desc: "fast 到达链表末尾 null，没有环",
          hint: "return false;",
          op: "null"
        }));
        break;
      }

      slow = next(slow);
      fast = next(next(fast));

      states.push(makeCycleState({
        slow: slow,
        fast: fast,
        desc: "slow 前进一步，fast 前进两步；如果有环，fast 会在环里追上 slow",
        hint: "slow = slow.next; fast = fast.next.next;",
        op: "move"
      }));

      if (slow === fast) {
        states.push(makeCycleState({
          slow: slow,
          fast: fast,
          meet: true,
          desc: "slow 和 fast 在节点 " + values[slow] + " 相遇，说明链表存在环",
          hint: "if (fast == slow) return true;",
          op: "meet"
        }));
        break;
      }
    }

    return states;
  }

  function makeCycleEntryState(options) {
    return {
      slow: options.slow,
      fast: options.fast,
      pHead: options.pHead,
      pMeet: options.pMeet,
      meetNode: options.meetNode,
      entry: options.entry,
      phase: options.phase || "detect",
      desc: options.desc,
      hint: options.hint,
      op: options.op || "detect",
      proof: options.proof || "detect"
    };
  }

  function createCycleEntryStates(values, cycleStart) {
    var count = values.length;
    var start = Math.max(0, Math.min(count - 1, Number(cycleStart) || 0));
    var hasCycle = count > 0 && start >= 0 && start < count;
    var states = [];
    var slow = count > 0 ? 0 : null;
    var fast = count > 0 ? 0 : null;
    var meetNode = null;

    function next(node) {
      if (node === null || node === undefined) return null;
      if (node === count - 1) return hasCycle ? start : null;
      return node + 1;
    }

    states.push(makeCycleEntryState({
      slow: slow,
      fast: fast,
      entry: start,
      phase: "detect",
      desc: "第一段：slow 和 fast 都从头结点 A 出发，先用快慢指针找到环内相遇点 C。",
      hint: "slow = head; fast = head;",
      op: "detect",
      proof: "x"
    }));

    if (count < 2 || !hasCycle) {
      states.push(makeCycleEntryState({
        slow: slow,
        fast: fast,
        entry: null,
        phase: "none",
        desc: "没有可追击的环，入口不存在。",
        hint: "if (meet == null) return null;",
        op: "detect",
        proof: "x"
      }));
      return states;
    }

    var limit = count * 3 + 2;
    for (var step = 0; step < limit; step += 1) {
      slow = next(slow);
      fast = next(next(fast));

      states.push(makeCycleEntryState({
        slow: slow,
        fast: fast,
        entry: start,
        phase: "detect",
        desc: "slow 每次走 1 步，fast 每次走 2 步；fast 会在环里追上 slow。",
        hint: "slow = slow.next; fast = fast.next.next;",
        op: "detect",
        proof: "y"
      }));

      if (slow === fast) {
        meetNode = slow;
        states.push(makeCycleEntryState({
          slow: slow,
          fast: fast,
          meetNode: meetNode,
          entry: start,
          phase: "meet",
          desc: "slow 和 fast 在节点 " + values[meetNode] + " 相遇，这个位置记作 C。",
          hint: "if (slow == fast) meet = slow;",
          op: "meet",
          proof: "y"
        }));
        break;
      }
    }

    if (meetNode === null) return states;

    states.push(makeCycleEntryState({
      slow: null,
      fast: null,
      pHead: 0,
      pMeet: meetNode,
      meetNode: meetNode,
      entry: start,
      phase: "proof",
      desc: "相遇时 slow 走了 X+Y，fast 走了 2(X+Y)，两者差值正好是整圈。",
      hint: "2(X + Y) - (X + Y) = nL",
      op: "proof",
      proof: "circle"
    }));

    states.push(makeCycleEntryState({
      slow: null,
      fast: null,
      pHead: 0,
      pMeet: meetNode,
      meetNode: meetNode,
      entry: start,
      phase: "reset",
      desc: "由 X = nL - Y 可知：从 C 再走 X 步，刚好回到入口 B；所以把 p1 放到 head，p2 留在 C。",
      hint: "p1 = head; p2 = meet;",
      op: "reset",
      proof: "cb"
    }));

    var pHead = 0;
    var pMeet = meetNode;
    var walkLimit = count * 2 + 2;
    for (var walk = 0; walk < walkLimit && pHead !== pMeet; walk += 1) {
      pHead = next(pHead);
      pMeet = next(pMeet);

      states.push(makeCycleEntryState({
        slow: null,
        fast: null,
        pHead: pHead,
        pMeet: pMeet,
        meetNode: meetNode,
        entry: start,
        phase: pHead === pMeet ? "entry" : "walk",
        desc: pHead === pMeet
          ? "p1 和 p2 在节点 " + values[pHead] + " 相遇，这里就是环入口 B。"
          : "p1 从 A 向 B 走，p2 从 C 沿环向 B 走；两者每轮都只走 1 步。",
        hint: pHead === pMeet ? "return p1;" : "p1 = p1.next; p2 = p2.next;",
        op: pHead === pMeet ? "entry" : "walk",
        proof: "cb"
      }));
    }

    return states;
  }

  function panelItem(value, options) {
    options = options || {};
    return {
      value: value,
      key: options.key || String(value),
      pointers: options.pointers || [],
      status: options.status || "",
      empty: !!options.empty
    };
  }

  function panelState(options) {
    return {
      desc: options.desc,
      hint: options.hint,
      op: options.op,
      rows: options.rows || [],
      metrics: options.metrics || []
    };
  }

  function createIntersectionStates() {
    function rows(p1, p2, done) {
      return [
        {
          label: "链表 A",
          items: [
            panelItem("", { key: "a-blank", empty: true }),
            panelItem("1", { key: "a1", pointers: p1 === "a1" ? ["p1"] : [] }),
            panelItem("2", { key: "a2", pointers: p1 === "a2" ? ["p1"] : [] }),
            panelItem("6", { key: "c6", pointers: p1 === "c6" ? ["p1"] : [], status: done ? "done" : "common" }),
            panelItem("7", { key: "c7", status: "common" })
          ]
        },
        {
          label: "链表 B",
          items: [
            panelItem("3", { key: "b3", pointers: p2 === "b3" ? ["p2"] : [] }),
            panelItem("4", { key: "b4", pointers: p2 === "b4" ? ["p2"] : [] }),
            panelItem("5", { key: "b5", pointers: p2 === "b5" ? ["p2"] : [] }),
            panelItem("6", { key: "c6-b", pointers: p2 === "c6" ? ["p2"] : [], status: done ? "done" : "common" }),
            panelItem("7", { key: "c7-b", status: "common" })
          ]
        }
      ];
    }

    return [
      panelState({
        desc: "先分别遍历两个链表，得到长度：A 有 4 个节点，B 有 5 个节点。",
        hint: "lenA = 4; lenB = 5;",
        op: "count",
        rows: rows("a1", "b3", false),
        metrics: ["公共尾部是同一批节点：6 -> 7", "长度差 diff = 1"]
      }),
      panelState({
        desc: "B 更长，让 p2 先走 1 步，使 p1 和 p2 到尾部的距离相同。",
        hint: "while (diff-- > 0) p2 = p2.next;",
        op: "align",
        rows: rows("a1", "b4", false),
        metrics: ["p1 到尾部剩 4 个节点", "p2 到尾部也剩 4 个节点"]
      }),
      panelState({
        desc: "同步比较：节点 1 和节点 4 不是同一个节点，两个指针一起后移。",
        hint: "if (p1 != p2) { p1 = p1.next; p2 = p2.next; }",
        op: "walk",
        rows: rows("a1", "b4", false)
      }),
      panelState({
        desc: "继续同步比较：节点 2 和节点 5 仍然不是同一个节点。",
        hint: "p1 = p1.next; p2 = p2.next;",
        op: "walk",
        rows: rows("a2", "b5", false)
      }),
      panelState({
        desc: "p1 和 p2 同时指向节点 6，且是同一个节点对象，所以第一个公共节点就是 6。",
        hint: "if (p1 == p2) return p1;",
        op: "meet",
        rows: rows("c6", "c6", true),
        metrics: ["返回值：6"]
      })
    ];
  }

  function createSortListStates() {
    return [
      panelState({
        desc: "对链表 4 -> 2 -> 1 -> 3 做归并排序，先用快慢指针找到中点并断开。",
        hint: "mid = slow.next; slow.next = null;",
        op: "split",
        rows: [
          { label: "当前链表", items: [panelItem("4", { pointers: ["slow"] }), panelItem("2"), panelItem("1", { pointers: ["fast"] }), panelItem("3")] },
          { label: "递归式", items: [panelItem("sort([4,2,1,3])")] }
        ],
        metrics: ["拆成 [4,2] 和 [1,3]"]
      }),
      panelState({
        desc: "递归处理左半部分 [4,2]，继续拆到单节点。",
        hint: "sort([4,2]) -> Merge(sort([4]), sort([2]))",
        op: "recurse",
        rows: [
          { label: "左半部分", items: [panelItem("4", { status: "window" }), panelItem("2", { status: "window" })] },
          { label: "拆分结果", items: [panelItem("[4]"), panelItem("[2]")] }
        ]
      }),
      panelState({
        desc: "合并 [4] 和 [2]：比较 4 与 2，先接入较小的 2。",
        hint: "2 < 4, cur.next = node(2);",
        op: "compare",
        rows: [
          { label: "左有序链", items: [panelItem("4", { pointers: ["L"] })] },
          { label: "右有序链", items: [panelItem("2", { pointers: ["R"], status: "cur" })] },
          { label: "合并结果", items: [panelItem("2", { status: "done" }), panelItem("4")] }
        ]
      }),
      panelState({
        desc: "左半部分返回有序链表 [2,4]。",
        hint: "return [2,4];",
        op: "return",
        rows: [
          { label: "左半返回", items: [panelItem("2", { status: "done" }), panelItem("4", { status: "done" })] }
        ]
      }),
      panelState({
        desc: "递归处理右半部分 [1,3]，它拆成 [1] 和 [3] 后已经天然有序。",
        hint: "sort([1,3]) -> Merge([1], [3])",
        op: "recurse",
        rows: [
          { label: "右半部分", items: [panelItem("1", { status: "window" }), panelItem("3", { status: "window" })] },
          { label: "右半返回", items: [panelItem("1", { status: "done" }), panelItem("3", { status: "done" })] }
        ]
      }),
      panelState({
        desc: "最后合并 [2,4] 和 [1,3]，先比较头节点 2 和 1。",
        hint: "1 < 2, cur.next = node(1);",
        op: "compare",
        rows: [
          { label: "左链", items: [panelItem("2", { pointers: ["L"] }), panelItem("4")] },
          { label: "右链", items: [panelItem("1", { pointers: ["R"], status: "cur" }), panelItem("3")] },
          { label: "结果", items: [panelItem("1", { status: "done" })] }
        ]
      }),
      panelState({
        desc: "继续比较 2 和 3，接入 2；再比较 4 和 3，接入 3。",
        hint: "append 2; append 3;",
        op: "merge",
        rows: [
          { label: "左链", items: [panelItem("2", { status: "done" }), panelItem("4", { pointers: ["L"] })] },
          { label: "右链", items: [panelItem("1", { status: "done" }), panelItem("3", { status: "done" })] },
          { label: "结果", items: [panelItem("1", { status: "done" }), panelItem("2", { status: "done" }), panelItem("3", { status: "done" })] }
        ]
      }),
      panelState({
        desc: "右链耗尽，把左链剩余的 4 接到结果后面，排序完成。",
        hint: "cur.next = leftRest;",
        op: "return",
        rows: [
          { label: "最终结果", items: [panelItem("1", { status: "done" }), panelItem("2", { status: "done" }), panelItem("3", { status: "done" }), panelItem("4", { status: "done" })] }
        ],
        metrics: ["返回值：1 -> 2 -> 3 -> 4"]
      })
    ];
  }

  function createOddEvenStates() {
    return [
      panelState({
        desc: "初始化：odd 指向第 1 个节点，even 和 evenHead 指向第 2 个节点。",
        hint: "odd = head; even = head.next; evenHead = even;",
        op: "init",
        rows: [
          { label: "当前链表", items: [panelItem("1", { pointers: ["odd"] }), panelItem("2", { pointers: ["even", "evenHead"] }), panelItem("3"), panelItem("4"), panelItem("5")] }
        ]
      }),
      panelState({
        desc: "把节点 3 接到奇数链后面：odd.next = even.next。",
        hint: "odd.next = even.next;",
        op: "odd",
        rows: [
          { label: "奇数链", items: [panelItem("1", { status: "done" }), panelItem("3", { pointers: ["odd"], status: "cur" })] },
          { label: "偶数链", items: [panelItem("2", { pointers: ["even", "evenHead"] }), panelItem("4"), panelItem("5")] }
        ]
      }),
      panelState({
        desc: "把节点 4 接到偶数链后面：even.next = odd.next。",
        hint: "even.next = odd.next;",
        op: "even",
        rows: [
          { label: "奇数链", items: [panelItem("1", { status: "done" }), panelItem("3", { pointers: ["odd"] }), panelItem("5")] },
          { label: "偶数链", items: [panelItem("2", { status: "done" }), panelItem("4", { pointers: ["even"], status: "cur" })] }
        ]
      }),
      panelState({
        desc: "继续一轮：节点 5 接到奇数链，偶数链已经到末尾。",
        hint: "odd = odd.next; even = even.next;",
        op: "advance",
        rows: [
          { label: "奇数链", items: [panelItem("1", { status: "done" }), panelItem("3", { status: "done" }), panelItem("5", { pointers: ["odd"], status: "cur" })] },
          { label: "偶数链", items: [panelItem("2", { pointers: ["evenHead"] }), panelItem("4", { pointers: ["even"], status: "done" })] }
        ]
      }),
      panelState({
        desc: "最后把偶数链表头 evenHead 接到奇数链尾部，得到 1 -> 3 -> 5 -> 2 -> 4。",
        hint: "odd.next = evenHead;",
        op: "connect",
        rows: [
          { label: "最终链表", items: [panelItem("1", { status: "done" }), panelItem("3", { status: "done" }), panelItem("5", { status: "done" }), panelItem("2", { status: "done" }), panelItem("4", { status: "done" })] }
        ],
        metrics: ["返回值：1 -> 3 -> 5 -> 2 -> 4"]
      })
    ];
  }

  function createDeleteDuplicateAllStates() {
    return [
      panelState({
        desc: "使用 dummy 保护头节点，pre 指向重复段前一位，start/then 扫描当前值。",
        hint: "pre = dummy; start = pre.next; then = start.next;",
        op: "init",
        rows: [
          { label: "当前链表", items: [panelItem("dummy", { pointers: ["pre"] }), panelItem("1", { pointers: ["start"] }), panelItem("2", { pointers: ["then"] }), panelItem("2"), panelItem("3"), panelItem("3"), panelItem("4"), panelItem("5"), panelItem("5")] }
        ]
      }),
      panelState({
        desc: "1 和 2 不相等，说明 1 是唯一值，pre/start/then 整体后移。",
        hint: "flag == 0, pre = pre.next;",
        op: "keep",
        rows: [
          { label: "保留链", items: [panelItem("dummy"), panelItem("1", { pointers: ["pre"], status: "done" }), panelItem("2", { pointers: ["start"] }), panelItem("2", { pointers: ["then"] }), panelItem("3"), panelItem("3"), panelItem("4"), panelItem("5"), panelItem("5")] }
        ]
      }),
      panelState({
        desc: "发现 2 和 2 相等，跳过 then，标记当前 start 所在的值是重复值。",
        hint: "start.next = then.next; flag = 1;",
        op: "skip",
        rows: [
          { label: "扫描中", items: [panelItem("1", { status: "done" }), panelItem("2", { pointers: ["start"], status: "cur" }), panelItem("2", { pointers: ["then"], status: "removed" }), panelItem("3"), panelItem("3"), panelItem("4"), panelItem("5"), panelItem("5")] },
          { label: "删除段", items: [panelItem("2", { status: "removed" })] }
        ],
        metrics: ["flag = 1"]
      }),
      panelState({
        desc: "start=2 已确认重复，遇到 3 时删除整个 2 段，让 pre.next 直接指向 3。",
        hint: "if (flag == 1) pre.next = then;",
        op: "delete",
        rows: [
          { label: "保留链", items: [panelItem("1", { pointers: ["pre"], status: "done" }), panelItem("3", { pointers: ["start"] }), panelItem("3", { pointers: ["then"] }), panelItem("4"), panelItem("5"), panelItem("5")] },
          { label: "已删除", items: [panelItem("2", { status: "removed" }), panelItem("2", { status: "removed" })] }
        ]
      }),
      panelState({
        desc: "同理发现 3 和 3 重复，跳过 then 并准备删除整个 3 段。",
        hint: "start.next = then.next; flag = 1;",
        op: "skip",
        rows: [
          { label: "扫描中", items: [panelItem("1", { status: "done" }), panelItem("3", { pointers: ["start"], status: "cur" }), panelItem("3", { pointers: ["then"], status: "removed" }), panelItem("4"), panelItem("5"), panelItem("5")] },
          { label: "已删除", items: [panelItem("2", { status: "removed" }), panelItem("2", { status: "removed" }), panelItem("3", { status: "removed" })] }
        ]
      }),
      panelState({
        desc: "删除整个 3 段后，4 与 5 不相等，4 是唯一值，保留。",
        hint: "flag = 0; pre/start/then 后移;",
        op: "keep",
        rows: [
          { label: "保留链", items: [panelItem("1", { status: "done" }), panelItem("4", { pointers: ["pre"], status: "done" }), panelItem("5", { pointers: ["start"] }), panelItem("5", { pointers: ["then"] })] },
          { label: "已删除", items: [panelItem("2", { status: "removed" }), panelItem("2", { status: "removed" }), panelItem("3", { status: "removed" }), panelItem("3", { status: "removed" })] }
        ]
      }),
      panelState({
        desc: "尾部 5 和 5 重复，循环结束后还要根据 flag 删除最后这个重复段。",
        hint: "if (flag == 1) pre.next = then;",
        op: "tail",
        rows: [
          { label: "最终链表", items: [panelItem("1", { status: "done" }), panelItem("4", { status: "done" })] },
          { label: "已删除", items: [panelItem("2", { status: "removed" }), panelItem("2", { status: "removed" }), panelItem("3", { status: "removed" }), panelItem("3", { status: "removed" }), panelItem("5", { status: "removed" }), panelItem("5", { status: "removed" })] }
        ],
        metrics: ["返回值：1 -> 4"]
      })
    ];
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

  function slotForTarget(target, geometry, order) {
    if (target === null || target === undefined) return null;
    if (target === -1) return -1;
    if (target === geometry.count) return geometry.count;
    if (target >= 0 && target < geometry.count) {
      if (order && order.length === geometry.count) {
        var slot = order.indexOf(target);
        if (slot !== -1) return slot;
      }
      return target;
    }
    return null;
  }

  function xForTarget(target, geometry, order) {
    var slot = slotForTarget(target, geometry, order);
    if (slot === null) return null;
    if (slot === -1) return geometry.nullLeft;
    if (slot === geometry.count) return geometry.nullRight;
    return geometry.positions[slot];
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

  function edgeKey(edge) {
    if (!edge) return "";
    return String(edge.from) + "->" + String(edge.to) + ":" + (edge.type || "");
  }

  function dynamicEdgePath(edge, geometry, order) {
    var from = edge.from;
    var to = edge.to;
    var fromSlot = slotForTarget(from, geometry, order);
    var toSlot = slotForTarget(to, geometry, order);
    var fromCenter = xForTarget(from, geometry, order);
    var toCenter = xForTarget(to, geometry, order);
    var movesRight = to === geometry.count || toSlot > fromSlot;
    var fromX = movesRight
      ? fromCenter + geometry.nodeW / 2 + 8
      : fromCenter - geometry.nodeW / 2 - 8;
    var toX = to === geometry.count
      ? geometry.nullRight - 24
      : movesRight
        ? toCenter - geometry.nodeW / 2 - 8
        : toCenter + geometry.nodeW / 2 + 8;
    var y = movesRight ? geometry.fwdY : geometry.revY;

    if (to === geometry.count || Math.abs(toSlot - fromSlot) === 1) {
      return "M " + fromX + " " + y + " L " + toX + " " + y;
    }

    var mid = (fromX + toX) / 2;
    var lift = movesRight ? -48 : 38;
    return "M " + fromX + " " + y + " C " + mid + " " + (y + lift) + ", " + mid + " " + (y + lift) + ", " + toX + " " + y;
  }

  function createDynamicEdge(edge, geometry, markerBase, activeEdge, order) {
    var fromSlot = slotForTarget(edge.from, geometry, order);
    var toSlot = slotForTarget(edge.to, geometry, order);
    var type = edge.type || (edge.to === geometry.count || toSlot > fromSlot ? "forward" : "reverse");
    var marker = type === "pending" ? "pending" : type === "reverse" ? "reverse" : "forward";
    var el = createSvgEl("path", {
      class: "ll-link ll-link--dynamic ll-link--" + type + " is-visible" + (edgeKey(edge) === edgeKey(activeEdge) ? " is-active" : ""),
      d: dynamicEdgePath(edge, geometry, order),
      fill: "none",
      "stroke-width": type === "pending" ? "2.4" : "2.2",
      "stroke-linecap": "round",
      "marker-end": "url(#" + markerBase + "-" + marker + ")"
    });
    return el;
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

  function createCyclePointer(name, label, side) {
    var width = label.length > 3 ? 54 : 44;
    var isTop = side !== "bottom";
    var badgeY = isTop ? -72 : 48;
    var textY = badgeY + 16;
    var lineStart = isTop ? badgeY + 28 : 26;
    var lineEnd = isTop ? -24 : badgeY;
    var group = createSvgEl("g", {
      class: "ll-pointer ll-pointer--" + name + " ll-pointer--cycle",
      "data-pointer": name
    });

    group.appendChild(createSvgEl("line", {
      class: "ll-pointer__line",
      x1: "0",
      y1: String(lineStart),
      x2: "0",
      y2: String(lineEnd),
      "stroke-width": "1.6"
    }));
    group.appendChild(createSvgEl("rect", {
      class: "ll-pointer__badge",
      x: String(-width / 2),
      y: String(badgeY),
      width: String(width),
      height: "24",
      rx: "6"
    }));

    var text = createSvgEl("text", {
      class: "ll-pointer__text",
      x: "0",
      y: String(textY),
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

  function createReverseBetweenSvg(values, geometry, markerBase, range) {
    var svg = createSvgEl("svg", {
      class: "ll-viz__svg",
      viewBox: "0 0 " + geometry.width + " " + geometry.height,
      role: "img",
      "aria-label": "链表内指定区间反转动画"
    });

    var defs = createSvgEl("defs");
    defs.appendChild(createMarker(markerBase + "-forward", "ll-marker--forward"));
    defs.appendChild(createMarker(markerBase + "-reverse", "ll-marker--reverse"));
    defs.appendChild(createMarker(markerBase + "-pending", "ll-marker--pending"));
    svg.appendChild(defs);

    var labels = createSvgEl("g", { class: "ll-labels" });
    [
      { x: geometry.nullLeft, text: "dummy" },
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

    if (values.length > 0) {
      var left = geometry.positions[range.start] - geometry.nodeW / 2 - 14;
      var right = geometry.positions[range.end] + geometry.nodeW / 2 + 14;
      svg.appendChild(createSvgEl("rect", {
        class: "ll-window",
        "data-window": "true",
        x: String(left),
        y: String(geometry.nodeY - geometry.nodeH / 2 - 18),
        width: String(right - left),
        height: String(geometry.nodeH + 36),
        rx: "8"
      }));
      var windowLabel = createSvgEl("text", {
        class: "ll-window__label",
        "data-window-label": "true",
        x: String((left + right) / 2),
        y: String(geometry.nodeY - geometry.nodeH / 2 - 26),
        "text-anchor": "middle"
      });
      windowLabel.textContent = "m=" + range.m + " ... n=" + range.n;
      svg.appendChild(windowLabel);
    }

    svg.appendChild(createSvgEl("g", {
      class: "ll-links ll-links--dynamic",
      "data-dynamic-links": "true"
    }));

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
    pointers.appendChild(createPointer("then", "then", 42));
    pointers.appendChild(createPointer("pre", "pre", 70));
    pointers.appendChild(createPointer("cur", "cur", 98));
    svg.appendChild(pointers);

    return svg;
  }

  function createReverseKSvg(values, geometry, markerBase, k) {
    var svg = createReverseBetweenSvg(values, geometry, markerBase, {
      start: 0,
      end: Math.max(0, Math.min(values.length - 1, k - 1)),
      m: 1,
      n: k
    });
    svg.setAttribute("aria-label", "链表每 k 个节点一组反转动画");

    var windowLabel = svg.querySelector("[data-window-label]");
    if (windowLabel) {
      windowLabel.textContent = "k=" + k + " group";
    }

    var pointers = svg.querySelector(".ll-pointers");
    if (pointers) {
      pointers.replaceChildren(
        createPointer("temp", "check", 36),
        createPointer("then", "then", 64),
        createPointer("pre", "pre", 92),
        createPointer("cur", "start", 120)
      );
    }

    return svg;
  }

  function createMergeGeometry(count) {
    var nodeW = 50;
    var nodeH = 34;
    var gap = 22;
    var maxNodes = Math.max(1, count);
    var width = Math.max(620, 142 + maxNodes * nodeW + (maxNodes - 1) * gap + 76);
    var startX = 126;

    return {
      width: width,
      height: 330,
      nodeW: nodeW,
      nodeH: nodeH,
      gap: gap,
      startX: startX,
      rows: {
        a: 72,
        b: 150,
        result: 250
      }
    };
  }

  function mergeNodeX(geometry, slot) {
    return geometry.startX + slot * (geometry.nodeW + geometry.gap);
  }

  function createMergeNode(value, list, index, x, y, ghost) {
    var node = createSvgEl("g", {
      class: "ll-node ll-merge-node" + (ghost ? " ll-merge-node--ghost" : ""),
      "data-merge-node": list + ":" + index
    });
    node.appendChild(createSvgEl("rect", {
      class: "ll-node__box",
      x: String(x - 25),
      y: String(y - 17),
      width: "50",
      height: "34",
      rx: "8",
      "stroke-width": "2"
    }));

    var text = createSvgEl("text", {
      class: "ll-node__text",
      x: String(x),
      y: String(y + 6),
      "text-anchor": "middle"
    });
    text.textContent = value;
    node.appendChild(text);
    return node;
  }

  function createMergeSortedSvg(listA, listB, geometry) {
    var svg = createSvgEl("svg", {
      class: "ll-viz__svg ll-merge-svg",
      viewBox: "0 0 " + geometry.width + " " + geometry.height,
      role: "img",
      "aria-label": "合并两个有序链表动画"
    });

    [
      { key: "a", text: "pHead1", y: geometry.rows.a },
      { key: "b", text: "pHead2", y: geometry.rows.b },
      { key: "result", text: "result", y: geometry.rows.result }
    ].forEach(function (row) {
      var label = createSvgEl("text", {
        class: "ll-null-label ll-merge-row-label",
        x: "58",
        y: String(row.y + 5),
        "text-anchor": "middle"
      });
      label.textContent = row.text;
      svg.appendChild(label);
    });

    var sourceGroup = createSvgEl("g", { class: "ll-merge-source" });
    listA.forEach(function (value, index) {
      sourceGroup.appendChild(createMergeNode(value, "a", index, mergeNodeX(geometry, index), geometry.rows.a, false));
    });
    listB.forEach(function (value, index) {
      sourceGroup.appendChild(createMergeNode(value, "b", index, mergeNodeX(geometry, index), geometry.rows.b, false));
    });
    svg.appendChild(sourceGroup);

    svg.appendChild(createSvgEl("g", {
      class: "ll-merge-result",
      "data-merge-result": "true"
    }));

    var pointers = createSvgEl("g", { class: "ll-pointers" });
    pointers.appendChild(createPointer("pre", "p1", 18));
    pointers.appendChild(createPointer("then", "p2", 96));
    pointers.appendChild(createPointer("cur", "cur", 196));
    svg.appendChild(pointers);

    return svg;
  }

  function createMergeKGeometry(lists) {
    var total = lists.reduce(function (sum, list) { return sum + list.length; }, 0);
    var mergeGeometry = createMergeGeometry(Math.max(total, 6));
    mergeGeometry.height = 470;
    mergeGeometry.rows = {
      tree: 42,
      a: 218,
      b: 292,
      result: 392
    };
    return mergeGeometry;
  }

  function buildMergeKTreeNodes(left, right, depth, slots, nodes) {
    var key = intervalKey(left, right);
    var x = (slots[left] + slots[right]) / 2;
    var y = 42 + depth * 54;
    var node = {
      key: key,
      left: left,
      right: right,
      depth: depth,
      x: x,
      y: y,
      label: left === right ? "L" + left : "[" + left + "," + right + "]"
    };
    nodes.push(node);

    if (left < right) {
      var mid = Math.floor((left + right) / 2);
      var leftChild = buildMergeKTreeNodes(left, mid, depth + 1, slots, nodes);
      var rightChild = buildMergeKTreeNodes(mid + 1, right, depth + 1, slots, nodes);
      node.children = [leftChild.key, rightChild.key];
    } else {
      node.children = [];
    }

    return node;
  }

  function createMergeKTreeData(lists, geometry) {
    var slots = [];
    var treeWidth = Math.max(260, (lists.length - 1) * 168);
    var start = (geometry.width - treeWidth) / 2;
    for (var i = 0; i < lists.length; i += 1) {
      slots.push(start + i * (lists.length === 1 ? 0 : treeWidth / (lists.length - 1)));
    }
    var nodes = [];
    if (lists.length) buildMergeKTreeNodes(0, lists.length - 1, 0, slots, nodes);
    return nodes;
  }

  function createMergeKSvg(lists, geometry) {
    var svg = createSvgEl("svg", {
      class: "ll-viz__svg ll-merge-svg ll-merge-k-svg",
      viewBox: "0 0 " + geometry.width + " " + geometry.height,
      role: "img",
      "aria-label": "合并 k 个有序链表的分治递归动画"
    });

    var treeNodes = createMergeKTreeData(lists, geometry);
    var treeGroup = createSvgEl("g", {
      class: "ll-merge-k-tree",
      "data-merge-k-tree": "true"
    });

    treeNodes.forEach(function (node) {
      node.children.forEach(function (childKey) {
        var child = treeNodes.filter(function (item) { return item.key === childKey; })[0];
        treeGroup.appendChild(createSvgEl("line", {
          class: "ll-merge-k-tree-edge",
          x1: String(node.x),
          y1: String(node.y + 18),
          x2: String(child.x),
          y2: String(child.y - 18)
        }));
      });
    });

    treeNodes.forEach(function (node) {
      var group = createSvgEl("g", {
        class: "ll-merge-k-tree-node",
        "data-tree-key": node.key
      });
      group.appendChild(createSvgEl("rect", {
        class: "ll-merge-k-tree-box",
        x: String(node.x - 38),
        y: String(node.y - 18),
        width: "76",
        height: "36",
        rx: "8"
      }));
      var text = createSvgEl("text", {
        class: "ll-merge-k-tree-text",
        x: String(node.x),
        y: String(node.y + 5),
        "text-anchor": "middle"
      });
      text.textContent = node.label;
      group.appendChild(text);
      treeGroup.appendChild(group);
    });
    svg.appendChild(treeGroup);

    [
      { text: "left", y: geometry.rows.a },
      { text: "right", y: geometry.rows.b },
      { text: "merged", y: geometry.rows.result }
    ].forEach(function (row) {
      var label = createSvgEl("text", {
        class: "ll-null-label ll-merge-row-label",
        x: "58",
        y: String(row.y + 5),
        "text-anchor": "middle"
      });
      label.textContent = row.text;
      svg.appendChild(label);
    });

    svg.appendChild(createSvgEl("g", { class: "ll-merge-k-left", "data-merge-k-left": "true" }));
    svg.appendChild(createSvgEl("g", { class: "ll-merge-k-right", "data-merge-k-right": "true" }));
    svg.appendChild(createSvgEl("g", { class: "ll-merge-k-result", "data-merge-k-result": "true" }));

    return svg;
  }

  function createCycleGeometry(count, cycleStart) {
    var width = 660;
    var height = 320;
    var positions = [];
    var start = Math.max(0, Math.min(count - 1, Number(cycleStart) || 0));
    var cycleCount = Math.max(1, count - start);
    var centerX = 420;
    var centerY = 168;
    var radiusX = 145;
    var radiusY = 82;

    for (var i = 0; i < count; i += 1) {
      if (i < start) {
        positions.push({
          x: 86 + i * 92,
          y: centerY
        });
      } else {
        var angle = -Math.PI / 2 + ((i - start) / cycleCount) * Math.PI * 2;
        positions.push({
          x: centerX + Math.cos(angle) * radiusX,
          y: centerY + Math.sin(angle) * radiusY
        });
      }
    }

    return {
      width: width,
      height: height,
      positions: positions,
      cycleStart: start,
      nodeW: 54,
      nodeH: 38
    };
  }

  function cycleEdgePath(from, to, geometry) {
    var a = geometry.positions[from];
    var b = geometry.positions[to];
    if (!a || !b) return "";
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    var fromX = a.x + (dx / len) * 36;
    var fromY = a.y + (dy / len) * 24;
    var toX = b.x - (dx / len) * 36;
    var toY = b.y - (dy / len) * 24;

    if (to <= from) {
      var midX = (fromX + toX) / 2;
      var midY = Math.max(fromY, toY) + 88;
      return "M " + fromX + " " + fromY + " Q " + midX + " " + midY + " " + toX + " " + toY;
    }

    return "M " + fromX + " " + fromY + " L " + toX + " " + toY;
  }

  function createDetectCycleSvg(values, geometry, markerBase) {
    var svg = createSvgEl("svg", {
      class: "ll-viz__svg ll-cycle-svg",
      viewBox: "0 0 " + geometry.width + " " + geometry.height,
      role: "img",
      "aria-label": "判断链表是否有环动画"
    });

    var defs = createSvgEl("defs");
    defs.appendChild(createMarker(markerBase + "-forward", "ll-marker--forward"));
    svg.appendChild(defs);

    var links = createSvgEl("g", { class: "ll-links ll-cycle-links" });
    values.forEach(function (_, index) {
      var target = index === values.length - 1 ? geometry.cycleStart : index + 1;
      links.appendChild(createSvgEl("path", {
        class: "ll-link ll-link--forward is-visible" + (target <= index ? " ll-cycle-link--back" : ""),
        d: cycleEdgePath(index, target, geometry),
        fill: "none",
        "stroke-width": target <= index ? "2.8" : "2.2",
        "stroke-linecap": "round",
        "marker-end": "url(#" + markerBase + "-forward)"
      }));
    });
    svg.appendChild(links);

    var nodes = createSvgEl("g", { class: "ll-nodes" });
    values.forEach(function (value, index) {
      var pos = geometry.positions[index];
      var node = createSvgEl("g", {
        class: "ll-node",
        "data-cycle-node": String(index)
      });
      node.appendChild(createSvgEl("rect", {
        class: "ll-node__box",
        x: String(pos.x - geometry.nodeW / 2),
        y: String(pos.y - geometry.nodeH / 2),
        width: String(geometry.nodeW),
        height: String(geometry.nodeH),
        rx: "8",
        "stroke-width": "2"
      }));
      var text = createSvgEl("text", {
        class: "ll-node__text",
        x: String(pos.x),
        y: String(pos.y + 6),
        "text-anchor": "middle"
      });
      text.textContent = value;
      node.appendChild(text);
      nodes.appendChild(node);
    });
    svg.appendChild(nodes);

    var pointers = createSvgEl("g", { class: "ll-pointers" });
    pointers.appendChild(createCyclePointer("pre", "slow", "top"));
    pointers.appendChild(createCyclePointer("cur", "fast", "bottom"));
    svg.appendChild(pointers);

    return svg;
  }

  function createCycleEntrySvg(values, geometry, markerBase) {
    var svg = createSvgEl("svg", {
      class: "ll-viz__svg ll-cycle-svg",
      viewBox: "0 0 " + geometry.width + " " + geometry.height,
      role: "img",
      "aria-label": "链表中环入口节点动画"
    });

    var defs = createSvgEl("defs");
    defs.appendChild(createMarker(markerBase + "-forward", "ll-marker--forward"));
    svg.appendChild(defs);

    var proof = createSvgEl("g", { class: "ll-cycle-proof" });
    proof.appendChild(createSvgEl("rect", {
      class: "ll-cycle-proof__box",
      x: "16",
      y: "14",
      width: "250",
      height: "104",
      rx: "8"
    }));
    [
      { key: "x", text: "A -> B = X" },
      { key: "y", text: "B -> C = Y" },
      { key: "circle", text: "fast - slow = nL" },
      { key: "cb", text: "C -> B = nL - Y = X" }
    ].forEach(function (row, index) {
      var line = createSvgEl("text", {
        class: "ll-cycle-proof__line",
        "data-proof-row": row.key,
        x: "32",
        y: String(40 + index * 22)
      });
      line.textContent = row.text;
      proof.appendChild(line);
    });
    svg.appendChild(proof);

    var links = createSvgEl("g", { class: "ll-links ll-cycle-links" });
    values.forEach(function (_, index) {
      var target = index === values.length - 1 ? geometry.cycleStart : index + 1;
      links.appendChild(createSvgEl("path", {
        class: "ll-link ll-link--forward is-visible" + (target <= index ? " ll-cycle-link--back" : ""),
        "data-cycle-edge": index + "-" + target,
        d: cycleEdgePath(index, target, geometry),
        fill: "none",
        "stroke-width": target <= index ? "2.8" : "2.2",
        "stroke-linecap": "round",
        "marker-end": "url(#" + markerBase + "-forward)"
      }));
    });
    svg.appendChild(links);

    var labels = createSvgEl("g", { class: "ll-cycle-labels" });
    [
      { key: "head", text: "A / head" },
      { key: "entry", text: "B / 入口" },
      { key: "meet", text: "C / 相遇点" }
    ].forEach(function (item) {
      var label = createSvgEl("text", {
        class: "ll-cycle-label ll-cycle-label--" + item.key,
        "data-cycle-label": item.key,
        x: "0",
        y: "0",
        "text-anchor": "middle"
      });
      label.textContent = item.text;
      labels.appendChild(label);
    });
    svg.appendChild(labels);

    var nodes = createSvgEl("g", { class: "ll-nodes" });
    values.forEach(function (value, index) {
      var pos = geometry.positions[index];
      var node = createSvgEl("g", {
        class: "ll-node",
        "data-cycle-node": String(index)
      });
      node.appendChild(createSvgEl("rect", {
        class: "ll-node__box",
        x: String(pos.x - geometry.nodeW / 2),
        y: String(pos.y - geometry.nodeH / 2),
        width: String(geometry.nodeW),
        height: String(geometry.nodeH),
        rx: "8",
        "stroke-width": "2"
      }));
      var text = createSvgEl("text", {
        class: "ll-node__text",
        x: String(pos.x),
        y: String(pos.y + 6),
        "text-anchor": "middle"
      });
      text.textContent = value;
      node.appendChild(text);
      nodes.appendChild(node);
    });
    svg.appendChild(nodes);

    var pointers = createSvgEl("g", { class: "ll-pointers" });
    pointers.appendChild(createCyclePointer("pre", "slow", "top"));
    pointers.appendChild(createCyclePointer("cur", "fast", "bottom"));
    pointers.appendChild(createCyclePointer("temp", "p1", "top"));
    pointers.appendChild(createCyclePointer("then", "p2", "bottom"));
    svg.appendChild(pointers);

    return svg;
  }

  function initializeReverseList(root) {
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
    REVERSE_LIST_OP_LINES.forEach(function (line) {
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

  function initializeReverseBetween(root) {
    if (!root || root.dataset.llReady === "true") return null;

    var values = parseValues(root.dataset.values);
    var range = clampRange(values.length, root.dataset.m, root.dataset.n);
    var states = createReverseBetweenStates(values, range.m, range.n);
    var geometry = createGeometry(values.length);
    var markerBase = "ll-marker-" + (++instanceId);
    var interval = Number(root.dataset.interval) || 1700;
    var shouldAutoplay = root.dataset.autoplay === "true" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.llReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "链表内指定区间反转指针动画");

    var header = createEl("div", "ll-viz__header");
    var titleWrap = createEl("div", "ll-viz__heading");
    var title = createEl("h3", "ll-viz__title", "链表区间反转：头插法");
    var desc = createEl("div", "ll-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);

    var counter = createEl("div", "ll-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "ll-viz__hint");
    var stage = createEl("div", "ll-viz__stage");
    var svg = createReverseBetweenSvg(values, geometry, markerBase, range);
    stage.appendChild(svg);

    var code = createEl("div", "ll-viz__code ll-viz__code--between");
    REVERSE_BETWEEN_OP_LINES.forEach(function (line) {
      var item = createEl("div", "ll-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "ll-viz__controls");
    var prevButton = createEl("button", "ll-viz__button", "上一步");
    var toggleButton = createEl("button", "ll-viz__button");
    var nextButton = createEl("button", "ll-viz__button", "下一步");
    var resetButton = createEl("button", "ll-viz__button", "重置");
    var rangeInput = createEl("input", "ll-viz__range");

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

    var pointerEls = {
      pre: svg.querySelector('[data-pointer="pre"]'),
      cur: svg.querySelector('[data-pointer="cur"]'),
      then: svg.querySelector('[data-pointer="then"]')
    };
    var nodeEls = Array.prototype.slice.call(svg.querySelectorAll(".ll-node"));
    var dynamicLinks = svg.querySelector("[data-dynamic-links]");
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

    function movePointer(el, target, order) {
      var x = xForTarget(target, geometry, order);
      var visible = x !== null;
      el.classList.toggle("is-visible", visible);
      if (visible) {
        el.style.transform = "translate(" + x + "px, 0)";
      }
    }

    function renderEdges(state) {
      dynamicLinks.replaceChildren();
      state.edges.concat(state.extraEdges || []).forEach(function (edge) {
        dynamicLinks.appendChild(createDynamicEdge(edge, geometry, markerBase, state.activeEdge, state.order));
      });
    }

    function moveNode(node, index, order) {
      var x = xForTarget(index, geometry, order);
      var baseX = geometry.positions[index];
      var delta = x === null ? 0 : x - baseX;
      node.style.transform = delta === 0 ? "" : "translate(" + delta + "px, 0)";
    }

    function render() {
      var state = states[step];

      desc.textContent = state.desc;
      hint.textContent = state.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      rangeInput.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      movePointer(pointerEls.pre, state.pre, state.order);
      movePointer(pointerEls.cur, state.cur, state.order);
      movePointer(pointerEls.then, state.then, state.order);
      renderEdges(state);

      nodeEls.forEach(function (node) {
        var index = Number(node.getAttribute("data-node-index"));
        moveNode(node, index, state.order);
        node.classList.toggle("is-window", index >= state.windowStart && index <= state.windowEnd);
        node.classList.toggle("is-done", state.done.indexOf(index) !== -1);
        node.classList.toggle("is-pre", index === state.pre);
        node.classList.toggle("is-cur", index === state.cur);
        node.classList.toggle("is-then", index === state.then);
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

  function initializeReverseK(root) {
    if (!root || root.dataset.llReady === "true") return null;

    var values = parseValues(root.dataset.values);
    var k = clampGroupSize(values.length, root.dataset.k);
    var states = createReverseKStates(values, k);
    var geometry = createGeometry(values.length);
    var markerBase = "ll-marker-" + (++instanceId);
    var interval = Number(root.dataset.interval) || 1700;
    var shouldAutoplay = root.dataset.autoplay === "true" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.llReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "链表每 k 个节点一组反转指针动画");

    var header = createEl("div", "ll-viz__header");
    var titleWrap = createEl("div", "ll-viz__heading");
    var title = createEl("h3", "ll-viz__title", "K 个一组反转：分组头插法");
    var desc = createEl("div", "ll-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);

    var counter = createEl("div", "ll-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "ll-viz__hint");
    var stage = createEl("div", "ll-viz__stage");
    var svg = createReverseKSvg(values, geometry, markerBase, k);
    stage.appendChild(svg);

    var code = createEl("div", "ll-viz__code ll-viz__code--between");
    REVERSE_K_OP_LINES.forEach(function (line) {
      var item = createEl("div", "ll-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "ll-viz__controls");
    var prevButton = createEl("button", "ll-viz__button", "上一步");
    var toggleButton = createEl("button", "ll-viz__button");
    var nextButton = createEl("button", "ll-viz__button", "下一步");
    var resetButton = createEl("button", "ll-viz__button", "重置");
    var rangeInput = createEl("input", "ll-viz__range");

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

    var pointerEls = {
      check: svg.querySelector('[data-pointer="temp"]'),
      pre: svg.querySelector('[data-pointer="pre"]'),
      start: svg.querySelector('[data-pointer="cur"]'),
      then: svg.querySelector('[data-pointer="then"]')
    };
    var nodeEls = Array.prototype.slice.call(svg.querySelectorAll(".ll-node"));
    var dynamicLinks = svg.querySelector("[data-dynamic-links]");
    var windowEl = svg.querySelector("[data-window]");
    var windowLabel = svg.querySelector("[data-window-label]");
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

    function movePointer(el, target, order) {
      var x = xForTarget(target, geometry, order);
      var visible = x !== null;
      el.classList.toggle("is-visible", visible);
      if (visible) {
        el.style.transform = "translate(" + x + "px, 0)";
      }
    }

    function moveNode(node, index, order) {
      var x = xForTarget(index, geometry, order);
      var baseX = geometry.positions[index];
      var delta = x === null ? 0 : x - baseX;
      node.style.transform = delta === 0 ? "" : "translate(" + delta + "px, 0)";
    }

    function renderEdges(state) {
      dynamicLinks.replaceChildren();
      state.edges.concat(state.extraEdges || []).forEach(function (edge) {
        dynamicLinks.appendChild(createDynamicEdge(edge, geometry, markerBase, state.activeEdge, state.order));
      });
    }

    function renderWindow(state) {
      var visible = windowEl &&
        state.windowStartSlot !== null &&
        state.windowStartSlot !== undefined &&
        state.windowEndSlot !== null &&
        state.windowEndSlot !== undefined &&
        state.windowStartSlot <= state.windowEndSlot;
      if (windowEl) windowEl.classList.toggle("is-visible", visible);
      if (windowLabel) windowLabel.classList.toggle("is-visible", visible);
      if (!visible) return;

      var left = geometry.positions[state.windowStartSlot] - geometry.nodeW / 2 - 14;
      var right = geometry.positions[state.windowEndSlot] + geometry.nodeW / 2 + 14;
      windowEl.setAttribute("x", String(left));
      windowEl.setAttribute("width", String(right - left));
      windowLabel.setAttribute("x", String((left + right) / 2));
      windowLabel.textContent = state.windowNodes.length < k ? "剩余 " + state.windowNodes.length + " < k" : "第 " + state.groupIndex + " 组 / k=" + k;
    }

    function render() {
      var state = states[step];

      desc.textContent = state.desc;
      hint.textContent = state.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      rangeInput.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      movePointer(pointerEls.check, state.check, state.order);
      movePointer(pointerEls.pre, state.pre, state.order);
      movePointer(pointerEls.start, state.start, state.order);
      movePointer(pointerEls.then, state.then, state.order);
      renderEdges(state);
      renderWindow(state);

      nodeEls.forEach(function (node) {
        var index = Number(node.getAttribute("data-node-index"));
        moveNode(node, index, state.order);
        node.classList.toggle("is-window", state.windowNodes.indexOf(index) !== -1);
        node.classList.toggle("is-done", state.done.indexOf(index) !== -1);
        node.classList.toggle("is-pre", index === state.pre);
        node.classList.toggle("is-cur", index === state.start);
        node.classList.toggle("is-then", index === state.then);
        node.classList.toggle("is-temp", index === state.check);
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

  function initializeMergeSorted(root) {
    if (!root || root.dataset.llReady === "true") return null;

    var listA = parseValues(root.dataset.valuesA || root.dataset.a || "1,3,5");
    var listB = parseValues(root.dataset.valuesB || root.dataset.b || "2,4,6");
    var states = createMergeSortedStates(listA, listB);
    var geometry = createMergeGeometry(listA.length + listB.length);
    var interval = Number(root.dataset.interval) || 1500;
    var shouldAutoplay = root.dataset.autoplay === "true" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.llReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "合并两个有序链表动画");

    var header = createEl("div", "ll-viz__header");
    var titleWrap = createEl("div", "ll-viz__heading");
    var title = createEl("h3", "ll-viz__title", "合并有序链表：双指针");
    var desc = createEl("div", "ll-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);

    var counter = createEl("div", "ll-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "ll-viz__hint");
    var stage = createEl("div", "ll-viz__stage");
    var svg = createMergeSortedSvg(listA, listB, geometry);
    stage.appendChild(svg);

    var code = createEl("div", "ll-viz__code ll-viz__code--between");
    MERGE_SORTED_OP_LINES.forEach(function (line) {
      var item = createEl("div", "ll-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "ll-viz__controls");
    var prevButton = createEl("button", "ll-viz__button", "上一步");
    var toggleButton = createEl("button", "ll-viz__button");
    var nextButton = createEl("button", "ll-viz__button", "下一步");
    var resetButton = createEl("button", "ll-viz__button", "重置");
    var rangeInput = createEl("input", "ll-viz__range");

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

    var pointerEls = {
      a: svg.querySelector('[data-pointer="pre"]'),
      b: svg.querySelector('[data-pointer="then"]'),
      cur: svg.querySelector('[data-pointer="cur"]')
    };
    var sourceNodes = Array.prototype.slice.call(svg.querySelectorAll("[data-merge-node]"));
    var resultGroup = svg.querySelector("[data-merge-result]");
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

    function movePointer(el, list, index) {
      var visible = index !== null && index !== undefined && index >= 0;
      el.classList.toggle("is-visible", visible);
      if (visible) {
        el.style.transform = "translate(" + mergeNodeX(geometry, index) + "px, 0)";
      }
      if (list === "cur" && visible) {
        el.style.transform = "translate(" + mergeNodeX(geometry, Math.max(0, index)) + "px, 100px)";
      }
    }

    function renderResult(state) {
      resultGroup.replaceChildren();
      state.result.forEach(function (item, index) {
        var node = createMergeNode(item.value, "r", index, mergeNodeX(geometry, index), geometry.rows.result, false);
        node.classList.toggle("is-done", true);
        node.classList.toggle("is-cur", state.appended === item.list + ":" + item.index);
        resultGroup.appendChild(node);
      });
    }

    function render() {
      var state = states[step];
      var resultTail = state.result.length - 1;

      desc.textContent = state.desc;
      hint.textContent = state.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      rangeInput.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      movePointer(pointerEls.a, "a", state.i < listA.length ? state.i : null);
      movePointer(pointerEls.b, "b", state.j < listB.length ? state.j : null);
      movePointer(pointerEls.cur, "cur", resultTail >= 0 ? resultTail : 0);
      pointerEls.cur.classList.toggle("is-visible", state.result.length > 0);

      sourceNodes.forEach(function (node) {
        var key = node.getAttribute("data-merge-node");
        var parts = key.split(":");
        var list = parts[0];
        var index = Number(parts[1]);
        var consumed = list === "a" ? index < state.i : index < state.j;
        var current = list === "a" ? index === state.i : index === state.j;
        var selected = state.selected === list && current;
        node.classList.toggle("is-done", consumed);
        node.classList.toggle("is-window", current);
        node.classList.toggle("is-cur", selected);
      });

      renderResult(state);

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

  function initializeMergeK(root) {
    if (!root || root.dataset.llReady === "true") return null;

    var lists = parseListGroup(root.dataset.lists);
    var states = createMergeKStates(lists);
    var geometry = createMergeKGeometry(lists);
    var interval = Number(root.dataset.interval) || 1600;
    var shouldAutoplay = root.dataset.autoplay === "true" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.llReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "合并 k 个有序链表递归动画");

    var header = createEl("div", "ll-viz__header");
    var titleWrap = createEl("div", "ll-viz__heading");
    var title = createEl("h3", "ll-viz__title", "合并 K 个有序链表：分治递归");
    var desc = createEl("div", "ll-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);

    var counter = createEl("div", "ll-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "ll-viz__hint");
    var stage = createEl("div", "ll-viz__stage");
    var svg = createMergeKSvg(lists, geometry);
    stage.appendChild(svg);

    var code = createEl("div", "ll-viz__code ll-viz__code--between");
    MERGE_K_OP_LINES.forEach(function (line) {
      var item = createEl("div", "ll-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "ll-viz__controls");
    var prevButton = createEl("button", "ll-viz__button", "上一步");
    var toggleButton = createEl("button", "ll-viz__button");
    var nextButton = createEl("button", "ll-viz__button", "下一步");
    var resetButton = createEl("button", "ll-viz__button", "重置");
    var rangeInput = createEl("input", "ll-viz__range");

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

    var treeNodes = Array.prototype.slice.call(svg.querySelectorAll("[data-tree-key]"));
    var leftGroup = svg.querySelector("[data-merge-k-left]");
    var rightGroup = svg.querySelector("[data-merge-k-right]");
    var resultGroup = svg.querySelector("[data-merge-k-result]");
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

    function renderValues(group, values, y, prefix, selectedIndex) {
      group.replaceChildren();
      values.forEach(function (value, index) {
        var node = createMergeNode(value, prefix, index, mergeNodeX(geometry, index), y, false);
        node.classList.toggle("is-window", index === selectedIndex);
        group.appendChild(node);
      });
    }

    function render() {
      var state = states[step];

      desc.textContent = state.desc;
      hint.textContent = state.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      rangeInput.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      treeNodes.forEach(function (node) {
        var key = node.getAttribute("data-tree-key");
        node.classList.toggle("is-active", key === state.active);
        node.classList.toggle("is-done", state.done.indexOf(key) !== -1);
      });

      renderValues(leftGroup, state.mergeLeft, geometry.rows.a, "mk-left", state.selected === "left" ? state.i : null);
      renderValues(rightGroup, state.mergeRight, geometry.rows.b, "mk-right", state.selected === "right" ? state.j : null);
      renderValues(resultGroup, state.result, geometry.rows.result, "mk-result", state.result.length - 1);

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

  function initializeDetectCycle(root) {
    if (!root || root.dataset.llReady === "true") return null;

    var values = parseValues(root.dataset.values);
    var cycleStart = Number(root.dataset.cycleStart || root.dataset.pos || 1);
    var states = createDetectCycleStates(values, cycleStart);
    var geometry = createCycleGeometry(values.length, cycleStart);
    var markerBase = "ll-marker-" + (++instanceId);
    var interval = Number(root.dataset.interval) || 1500;
    var shouldAutoplay = root.dataset.autoplay === "true" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.llReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "判断链表是否有环快慢指针动画");

    var header = createEl("div", "ll-viz__header");
    var titleWrap = createEl("div", "ll-viz__heading");
    var title = createEl("h3", "ll-viz__title", "判断链表是否有环：快慢指针");
    var desc = createEl("div", "ll-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);

    var counter = createEl("div", "ll-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "ll-viz__hint");
    var stage = createEl("div", "ll-viz__stage");
    var svg = createDetectCycleSvg(values, geometry, markerBase);
    stage.appendChild(svg);

    var code = createEl("div", "ll-viz__code ll-viz__code--between");
    DETECT_CYCLE_OP_LINES.forEach(function (line) {
      var item = createEl("div", "ll-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "ll-viz__controls");
    var prevButton = createEl("button", "ll-viz__button", "上一步");
    var toggleButton = createEl("button", "ll-viz__button");
    var nextButton = createEl("button", "ll-viz__button", "下一步");
    var resetButton = createEl("button", "ll-viz__button", "重置");
    var rangeInput = createEl("input", "ll-viz__range");

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

    var pointerEls = {
      slow: svg.querySelector('[data-pointer="pre"]'),
      fast: svg.querySelector('[data-pointer="cur"]')
    };
    var nodeEls = Array.prototype.slice.call(svg.querySelectorAll("[data-cycle-node]"));
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
      var visible = target !== null && target !== undefined && geometry.positions[target];
      el.classList.toggle("is-visible", !!visible);
      if (visible) {
        var pos = geometry.positions[target];
        el.style.transform = "translate(" + pos.x + "px, " + pos.y + "px)";
      }
    }

    function render() {
      var state = states[step];

      desc.textContent = state.desc;
      hint.textContent = state.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      rangeInput.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      movePointer(pointerEls.slow, state.slow);
      movePointer(pointerEls.fast, state.fast);

      nodeEls.forEach(function (node) {
        var index = Number(node.getAttribute("data-cycle-node"));
        var isSlow = index === state.slow;
        var isFast = index === state.fast;
        node.classList.toggle("is-pre", isSlow);
        node.classList.toggle("is-cur", isFast);
        node.classList.toggle("is-then", state.meet && isSlow && isFast);
        node.classList.toggle("is-window", index >= geometry.cycleStart);
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

  function initializeCycleEntry(root) {
    if (!root || root.dataset.llReady === "true") return null;

    var values = parseValues(root.dataset.values);
    var cycleStart = Number(root.dataset.cycleStart || root.dataset.pos || 1);
    var states = createCycleEntryStates(values, cycleStart);
    var geometry = createCycleGeometry(values.length, cycleStart);
    var markerBase = "ll-marker-" + (++instanceId);
    var interval = Number(root.dataset.interval) || 1600;
    var shouldAutoplay = root.dataset.autoplay === "true" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.llReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "链表中环入口节点动画");

    var header = createEl("div", "ll-viz__header");
    var titleWrap = createEl("div", "ll-viz__heading");
    var title = createEl("h3", "ll-viz__title", "链表中环的入口节点：相遇点到入口");
    var desc = createEl("div", "ll-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);

    var counter = createEl("div", "ll-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "ll-viz__hint");
    var stage = createEl("div", "ll-viz__stage");
    var svg = createCycleEntrySvg(values, geometry, markerBase);
    stage.appendChild(svg);

    var code = createEl("div", "ll-viz__code ll-viz__code--between");
    CYCLE_ENTRY_OP_LINES.forEach(function (line) {
      var item = createEl("div", "ll-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "ll-viz__controls");
    var prevButton = createEl("button", "ll-viz__button", "上一步");
    var toggleButton = createEl("button", "ll-viz__button");
    var nextButton = createEl("button", "ll-viz__button", "下一步");
    var resetButton = createEl("button", "ll-viz__button", "重置");
    var rangeInput = createEl("input", "ll-viz__range");

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

    var pointerEls = {
      slow: svg.querySelector('[data-pointer="pre"]'),
      fast: svg.querySelector('[data-pointer="cur"]'),
      pHead: svg.querySelector('[data-pointer="temp"]'),
      pMeet: svg.querySelector('[data-pointer="then"]')
    };
    var nodeEls = Array.prototype.slice.call(svg.querySelectorAll("[data-cycle-node]"));
    var edgeEls = Array.prototype.slice.call(svg.querySelectorAll("[data-cycle-edge]"));
    var codeEls = Array.prototype.slice.call(code.querySelectorAll("[data-op]"));
    var proofEls = Array.prototype.slice.call(svg.querySelectorAll("[data-proof-row]"));
    var labelEls = {
      head: svg.querySelector('[data-cycle-label="head"]'),
      entry: svg.querySelector('[data-cycle-label="entry"]'),
      meet: svg.querySelector('[data-cycle-label="meet"]')
    };

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
      if (!el) return;
      var visible = target !== null && target !== undefined && geometry.positions[target];
      el.classList.toggle("is-visible", !!visible);
      if (visible) {
        var pos = geometry.positions[target];
        el.style.transform = "translate(" + pos.x + "px, " + pos.y + "px)";
      }
    }

    function moveLabel(el, target, xOffset, yOffset, anchor) {
      if (!el) return;
      var visible = target !== null && target !== undefined && geometry.positions[target];
      el.classList.toggle("is-visible", !!visible);
      if (visible) {
        var pos = geometry.positions[target];
        el.setAttribute("x", String(pos.x + (xOffset || 0)));
        el.setAttribute("y", String(pos.y + yOffset));
        el.setAttribute("text-anchor", anchor || "middle");
      }
    }

    function pathKeysFromMeetToEntry(state) {
      var keys = {};
      if (state.meetNode === null || state.meetNode === undefined || state.entry === null || state.entry === undefined) {
        return keys;
      }
      var cursor = state.meetNode;
      var guard = 0;
      while (guard < values.length + 1 && cursor !== state.entry) {
        var target = cursor === values.length - 1 ? geometry.cycleStart : cursor + 1;
        keys[cursor + "-" + target] = true;
        cursor = target;
        guard += 1;
      }
      return keys;
    }

    function render() {
      var state = states[step];
      var activeProof = state.proof;
      var cToBKeys = pathKeysFromMeetToEntry(state);

      desc.textContent = state.desc;
      hint.textContent = state.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      rangeInput.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      movePointer(pointerEls.slow, state.slow);
      movePointer(pointerEls.fast, state.fast);
      movePointer(pointerEls.pHead, state.pHead);
      movePointer(pointerEls.pMeet, state.pMeet);

      moveLabel(labelEls.head, 0, 0, 58, "middle");
      moveLabel(labelEls.entry, state.entry, 44, 5, "start");
      moveLabel(labelEls.meet, state.meetNode, 0, 58, "middle");

      nodeEls.forEach(function (node) {
        var index = Number(node.getAttribute("data-cycle-node"));
        node.classList.toggle("is-window", index >= geometry.cycleStart);
        node.classList.toggle("is-pre", index === state.slow);
        node.classList.toggle("is-cur", index === state.fast);
        node.classList.toggle("is-temp", index === state.pHead);
        node.classList.toggle("is-then", index === state.pMeet || (state.phase === "meet" && index === state.meetNode));
        node.classList.toggle("is-done", (state.phase === "entry" || state.phase === "reset" || state.phase === "walk") && index === state.entry);
      });

      edgeEls.forEach(function (edge) {
        var key = edge.getAttribute("data-cycle-edge");
        var isHeadToEntry = activeProof === "x" && key === "0-" + geometry.cycleStart;
        var isMeetToEntry = (activeProof === "cb" || state.phase === "entry") && cToBKeys[key];
        edge.classList.toggle("is-active", !!(isHeadToEntry || isMeetToEntry));
      });

      proofEls.forEach(function (line) {
        var key = line.getAttribute("data-proof-row");
        line.classList.toggle("is-active", key === activeProof || (activeProof === "cb" && key === "x"));
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

  function initializePanelAnimation(root, config) {
    if (!root || root.dataset.llReady === "true") return null;

    var states = config.createStates();
    var interval = Number(root.dataset.interval) || 1500;
    var shouldAutoplay = root.dataset.autoplay === "true" && !prefersReducedMotion();
    var step = 0;
    var playing = shouldAutoplay;
    var timer = null;

    root.dataset.llReady = "true";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", config.ariaLabel);

    var header = createEl("div", "ll-viz__header");
    var titleWrap = createEl("div", "ll-viz__heading");
    var title = createEl("h3", "ll-viz__title", config.title);
    var desc = createEl("div", "ll-viz__desc");
    desc.setAttribute("aria-live", "polite");
    titleWrap.appendChild(title);
    titleWrap.appendChild(desc);

    var counter = createEl("div", "ll-viz__counter");
    header.appendChild(titleWrap);
    header.appendChild(counter);

    var hint = createEl("div", "ll-viz__hint");
    var stage = createEl("div", "ll-viz__stage");
    var panel = createEl("div", "ll-panel-viz");
    stage.appendChild(panel);

    var code = createEl("div", "ll-viz__code ll-viz__code--between");
    config.opLines.forEach(function (line) {
      var item = createEl("div", "ll-viz__code-line", line.text);
      item.dataset.op = line.key;
      code.appendChild(item);
    });

    var controls = createEl("div", "ll-viz__controls");
    var prevButton = createEl("button", "ll-viz__button", "上一步");
    var toggleButton = createEl("button", "ll-viz__button");
    var nextButton = createEl("button", "ll-viz__button", "下一步");
    var resetButton = createEl("button", "ll-viz__button", "重置");
    var rangeInput = createEl("input", "ll-viz__range");

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

    function renderPointer(pointer) {
      var el = createEl("span", "ll-panel-pointer ll-panel-pointer--" + pointer, pointer);
      return el;
    }

    function renderItem(item) {
      var cell = createEl("div", "ll-panel-cell");
      if (item.empty) {
        cell.classList.add("is-empty");
        return cell;
      }

      var pointers = createEl("div", "ll-panel-pointers");
      (item.pointers || []).forEach(function (pointer) {
        pointers.appendChild(renderPointer(pointer));
      });
      cell.appendChild(pointers);

      var node = createEl("div", "ll-panel-node", item.value);
      if (item.status) node.classList.add("is-" + item.status);
      cell.appendChild(node);
      return cell;
    }

    function renderRow(row) {
      var rowEl = createEl("div", "ll-panel-row");
      rowEl.appendChild(createEl("div", "ll-panel-row__label", row.label));
      var track = createEl("div", "ll-panel-track");
      row.items.forEach(function (item, index) {
        track.appendChild(renderItem(item));
        if (index < row.items.length - 1) {
          var arrow = createEl("span", "ll-panel-arrow", "->");
          if (item.empty || row.items[index + 1].empty) arrow.classList.add("is-muted");
          track.appendChild(arrow);
        }
      });
      rowEl.appendChild(track);
      return rowEl;
    }

    function renderMetrics(metrics) {
      if (!metrics || !metrics.length) return null;
      var wrap = createEl("div", "ll-panel-metrics");
      metrics.forEach(function (metric) {
        wrap.appendChild(createEl("div", "ll-panel-metric", metric));
      });
      return wrap;
    }

    function render() {
      var state = states[step];
      desc.textContent = state.desc;
      hint.textContent = state.hint;
      counter.textContent = (step + 1) + " / " + states.length;
      rangeInput.value = String(step);
      toggleButton.textContent = playing ? "暂停" : "播放";

      panel.replaceChildren();
      state.rows.forEach(function (row) {
        panel.appendChild(renderRow(row));
      });
      var metrics = renderMetrics(state.metrics);
      if (metrics) panel.appendChild(metrics);

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

  function initializeIntersection(root) {
    return initializePanelAnimation(root, {
      title: "两个链表的第一个公共节点：长度对齐",
      ariaLabel: "两个链表第一个公共节点动画",
      opLines: INTERSECTION_OP_LINES,
      createStates: createIntersectionStates
    });
  }

  function initializeSortList(root) {
    return initializePanelAnimation(root, {
      title: "单链表排序：归并排序",
      ariaLabel: "单链表归并排序动画",
      opLines: SORT_LIST_OP_LINES,
      createStates: createSortListStates
    });
  }

  function initializeOddEven(root) {
    return initializePanelAnimation(root, {
      title: "链表奇偶重排：拆成两条链再拼接",
      ariaLabel: "链表奇偶重排动画",
      opLines: ODD_EVEN_OP_LINES,
      createStates: createOddEvenStates
    });
  }

  function initializeDeleteDuplicatesAll(root) {
    return initializePanelAnimation(root, {
      title: "删除有序链表重复元素 II：整段删除",
      ariaLabel: "删除有序链表所有重复元素动画",
      opLines: DELETE_DUP_ALL_OP_LINES,
      createStates: createDeleteDuplicateAllStates
    });
  }

  function initialize(root) {
    if (!root) return null;
    if (root.dataset.algorithm === "intersection") {
      return initializeIntersection(root);
    }
    if (root.dataset.algorithm === "sort-list") {
      return initializeSortList(root);
    }
    if (root.dataset.algorithm === "odd-even") {
      return initializeOddEven(root);
    }
    if (root.dataset.algorithm === "delete-duplicates-all") {
      return initializeDeleteDuplicatesAll(root);
    }
    if (root.dataset.algorithm === "cycle-entry") {
      return initializeCycleEntry(root);
    }
    if (root.dataset.algorithm === "detect-cycle") {
      return initializeDetectCycle(root);
    }
    if (root.dataset.algorithm === "merge-k-sorted") {
      return initializeMergeK(root);
    }
    if (root.dataset.algorithm === "merge-sorted") {
      return initializeMergeSorted(root);
    }
    if (root.dataset.algorithm === "reverse-between") {
      return initializeReverseBetween(root);
    }
    if (root.dataset.algorithm === "reverse-k") {
      return initializeReverseK(root);
    }
    return initializeReverseList(root);
  }

  function initAll() {
    var roots = document.querySelectorAll(".ll-viz[data-algorithm]");
    Array.prototype.forEach.call(roots, initialize);
  }

  window.LinkListViz = {
    version: VERSION,
    initAll: initAll,
    initialize: initialize,
    createReverseListStates: createReverseListStates,
    createReverseBetweenStates: createReverseBetweenStates,
    createReverseKStates: createReverseKStates,
    createMergeSortedStates: createMergeSortedStates,
    createMergeKStates: createMergeKStates,
    createDetectCycleStates: createDetectCycleStates,
    createCycleEntryStates: createCycleEntryStates,
    createIntersectionStates: createIntersectionStates,
    createSortListStates: createSortListStates,
    createOddEvenStates: createOddEvenStates,
    createDeleteDuplicateAllStates: createDeleteDuplicateAllStates
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  document.addEventListener("pjax:complete", initAll);
})();
