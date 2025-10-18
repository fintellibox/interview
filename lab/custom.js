setTimeout(() => {
  (function () {
    const kill = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return false;
    };

    // 1) 鼠标/指针触发：在捕获阶段截断
    [
      "contextmenu",
      "mousedown",
      "mouseup",
      "pointerdown",
      "pointerup",
      "auxclick",
    ].forEach((type) => {
      window.addEventListener(
        type,
        (e) => {
          // 拦默认右键 & 中键；contextmenu 事件无论来源都拦
          if (type === "contextmenu" || e.button === 2 || e.button === 1)
            kill(e);
        },
        { capture: true, passive: false }
      );
    });

    // 2) 键盘触发：Shift+F10、菜单键
    window.addEventListener(
      "keydown",
      (e) => {
        if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") kill(e);
      },
      { capture: true }
    );

    // 3) 可选：移动端 Safari 的长按呼出菜单
    const style = document.createElement("style");
    style.textContent = `
    html, body { -webkit-touch-callout: none; }
  `;
    document.head.appendChild(style);
  })();

  (() => {
    const LIST_SELECTOR = 'li[class*="jp-DirListing-item"]'; // 文件项的选择器
    const TARGET_NAME = "interview.ipynb"; // 目标文件名：始终保留的文件

    // 获取文件名（从 title 属性的 Name: 行解析）
    const getName = (li) => {
      const title = li.getAttribute("title") || "";
      const match = title.match(/(?:^|\n)Name:\s*(.+?)(?:\n|$)/);
      return match ? match[1].trim() : "";
    };

    // 判断该文件是否是目标文件
    const isTarget = (li) =>
      getName(li).toLowerCase() === TARGET_NAME.toLowerCase();

    // 删除所有非 interview.ipynb 的文件
    const purge = (root = document) => {
      const items = Array.from(root.querySelectorAll(LIST_SELECTOR));
      let targetFound = false;
      items.forEach((li) => {
        if (isTarget(li)) {
          targetFound = true; // 找到 interview.ipynb
        } else {
          li.remove(); // 删除非目标文件
        }
      });

      // 如果没有找到 interview.ipynb，则强制插入
      if (!targetFound) {
        insertInterview(root);
      }
    };

    // 强制插入 interview.ipynb
    const insertInterview = (root) => {
      // 先检查是否已经存在 interview.ipynb
      const existing = root.querySelector(`li[title*="Name: ${TARGET_NAME}"]`);
      if (!existing) {
        const li = document.createElement("li");
        li.setAttribute("class", "jp-DirListing-item");
        li.setAttribute(
          "title",
          `Name: ${TARGET_NAME}\nSize: N/A\nCreated: N/A\nModified: N/A\nWritable: true`
        );
        const textNode = document.createTextNode(TARGET_NAME);
        li.appendChild(textNode);
        root.appendChild(li); // 插入到文件列表末尾
      }
    };

    // 获取文件列表容器（兼容不同版本）
    const container =
      document.querySelector(".jp-DirListing-content") ||
      document.querySelector(".jp-DirListing") ||
      document.body;

    // 初始清理，移除所有非 interview.ipynb 文件
    purge(container);

    // 监听文件列表的变化，动态删除不符合条件的项
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        purge(container);
      });
    };

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (
          m.type === "childList" &&
          (m.addedNodes.length || m.removedNodes.length)
        ) {
          // 监听到新增或移除的文件项时触发
          // 只处理新增的 <li>，并清理不符合要求的项
          m.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.matches(LIST_SELECTOR)) {
              // 每次新增文件项时，检查是否是 interview.ipynb
              if (!isTarget(node)) node.remove(); // 如果不是 interview.ipynb，删除它
            }
          });
          schedule();
          break;
        }

        if (m.type === "attributes" && m.attributeName === "title") {
          // 如果 title 发生变化，也需要重新清理
          schedule();
          break;
        }
      }
    });

    // 开始观察文件列表
    obs.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["title"],
    });

    console.log(
      '[cleanup] will continuously remove all items except "interview.ipynb"'
    );
  })();
}, 100);
