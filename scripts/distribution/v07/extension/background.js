const logPrefix = "[Fortune Shrine V0.7 background]";

function focusXEditor(selectors) {
  function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none"
      && style.visibility !== "hidden"
      && rect.width > 0
      && rect.height > 0;
  }

  const textbox = selectors
    .flatMap((selector) => [...document.querySelectorAll(selector)])
    .find(isVisible);
  if (!textbox) return { ok: false, reason: "textbox-not-found" };

  const beforeFocus = {
    activeElementOuterHTML: document.activeElement instanceof Element
      ? document.activeElement.outerHTML
      : String(document.activeElement),
    activeElementTagName: document.activeElement?.tagName || null
  };
  textbox.click();
  textbox.focus();
  const afterFocus = {
    activeElementOuterHTML: document.activeElement instanceof Element
      ? document.activeElement.outerHTML
      : String(document.activeElement),
    activeElementTagName: document.activeElement?.tagName || null
  };
  return {
    ok: document.activeElement === textbox,
    activeElementIsTextbox: document.activeElement === textbox,
    beforeFocus,
    afterFocus
  };
}

function inspectXEditor(selectors) {
  function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none"
      && style.visibility !== "hidden"
      && rect.width > 0
      && rect.height > 0;
  }

  const textbox = selectors
    .flatMap((selector) => [...document.querySelectorAll(selector)])
    .find(isVisible);
  const activeElement = document.activeElement;

  function nodePath(element) {
    if (!(element instanceof Element)) return "";
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 12) {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        part += `#${current.id}`;
        parts.unshift(part);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = [...parent.children].filter((child) => child.tagName === current.tagName);
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
      parts.unshift(part);
      current = parent;
    }
    return parts.join(" > ");
  }

  function reactInfo(element) {
    if (!(element instanceof Element)) return null;
    const keys = Object.getOwnPropertyNames(element).filter((key) =>
      key.startsWith("__reactFiber$")
      || key.startsWith("__reactProps$")
      || key.startsWith("__reactEvents$")
      || key.startsWith("_reactRootContainer")
      || key === "_valueTracker"
    );
    return {
      detected: keys.length > 0,
      keys,
      fiber: keys
        .filter((key) => key.startsWith("__reactFiber$"))
        .map((key) => {
          const fiber = element[key];
          return {
            tag: fiber?.tag ?? null,
            elementType:
              typeof fiber?.elementType === "string"
                ? fiber.elementType
                : fiber?.elementType?.displayName || fiber?.elementType?.name || null,
            type:
              typeof fiber?.type === "string"
                ? fiber.type
                : fiber?.type?.displayName || fiber?.type?.name || null,
            memoizedPropsKeys:
              fiber?.memoizedProps && typeof fiber.memoizedProps === "object"
                ? Object.keys(fiber.memoizedProps).slice(0, 50)
                : []
          };
        })
    };
  }

  function editableSnapshot(element) {
    const path = nodePath(element);
    const role = element.getAttribute("role");
    const testId = element.getAttribute("data-testid");
    const ariaLabel = element.getAttribute("aria-label");
    const className = typeof element.className === "string" ? element.className : "";
    return {
      path,
      tagName: element.tagName,
      role,
      contentEditable: element.getAttribute("contenteditable"),
      ariaLabel,
      testId,
      className,
      uniqueAttributeIdentifier: [
        element.tagName,
        role,
        testId,
        ariaLabel,
        className,
        path
      ].filter(Boolean).join("|"),
      innerText: element.innerText || "",
      textContent: element.textContent || "",
      outerHTML: element.outerHTML,
      parentChain: (() => {
        const chain = [];
        let current = element.parentElement;
        while (current && chain.length < 10) {
          chain.push({
            tagName: current.tagName,
            role: current.getAttribute("role"),
            testId: current.getAttribute("data-testid"),
            className: typeof current.className === "string" ? current.className : ""
          });
          current = current.parentElement;
        }
        return chain;
      })(),
      react: reactInfo(element)
    };
  }

  return {
    textboxFound: Boolean(textbox),
    textboxInnerText: textbox?.innerText || "",
    textboxTextContent: textbox?.textContent || "",
    textboxOuterHTML: textbox?.outerHTML || "",
    textboxPath: nodePath(textbox),
    textboxReact: reactInfo(textbox),
    contentEditableTree: [...document.querySelectorAll('[contenteditable="true"]')]
      .map(editableSnapshot),
    activeElementPath: nodePath(activeElement),
    activeElementReact: reactInfo(activeElement),
    activeElementOuterHTML: activeElement instanceof Element
      ? activeElement.outerHTML
      : String(activeElement)
  };
}

function attachDebugger(target) {
  return new Promise((resolve, reject) => {
    console.info(logPrefix, "chrome.debugger.attach 调用", { target });
    chrome.debugger.attach(target, "1.3", () => {
      const runtimeLastError = chrome.runtime.lastError?.message || null;
      console.info(logPrefix, "chrome.debugger.attach 回调", {
        target,
        success: !runtimeLastError,
        runtimeLastError
      });
      if (runtimeLastError) reject(new Error(runtimeLastError));
      else resolve({ success: true, runtimeLastError: null });
    });
  });
}

function sendDebuggerCommand(target, method, params) {
  return new Promise((resolve, reject) => {
    console.info(logPrefix, "chrome.debugger.sendCommand 调用", {
      target,
      method,
      textLength: params?.text?.length || 0
    });
    chrome.debugger.sendCommand(target, method, params, (result) => {
      const runtimeLastError = chrome.runtime.lastError?.message || null;
      console.info(logPrefix, "chrome.debugger.sendCommand 回调", {
        target,
        method,
        success: !runtimeLastError,
        result,
        runtimeLastError
      });
      if (runtimeLastError) reject(new Error(runtimeLastError));
      else resolve({ result, runtimeLastError: null });
    });
  });
}

function detachDebugger(target) {
  return new Promise((resolve) => {
    chrome.debugger.detach(target, resolve);
  });
}

async function saveDomSample(sample) {
  const response = await fetch("http://127.0.0.1:4191/api/dom-samples", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sample)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "fortune-shrine-save-dom-sample") {
    saveDomSample(message.sample)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, reason: error.message }));
    return true;
  }
  if (message?.type !== "fortune-shrine-fill-draft" || !sender.tab?.id) return;
  const target = { tabId: sender.tab.id };
  const trace = {
    targetTabId: sender.tab.id,
    attachCalled: false,
    attachSucceeded: false,
    attachRuntimeLastError: null,
    inputInsertTextCalled: false,
    inputInsertTextResult: null,
    inputInsertTextRuntimeLastError: null,
    focusBefore: null,
    focusAfter: null,
    insertBefore: null,
    insertAfter: null,
    postWriteInspection: null
  };
  console.info(logPrefix, "收到草稿写入请求", {
    targetTabId: sender.tab.id,
    draftLength: message.draft?.length || 0
  });
  chrome.scripting.executeScript({
    target,
    world: "MAIN",
    func: focusXEditor,
    args: [message.selectors]
  }).then(async ([result]) => {
    const focusResult = result?.result;
    if (!focusResult?.ok) {
      sendResponse(focusResult || { ok: false, reason: "focus-failed" });
      return;
    }
    trace.focusBefore = focusResult.beforeFocus || null;
    trace.focusAfter = focusResult.afterFocus || null;

    let attached = false;
    try {
      trace.attachCalled = true;
      const attachResult = await attachDebugger(target);
      attached = true;
      trace.attachSucceeded = attachResult.success;
      trace.attachRuntimeLastError = attachResult.runtimeLastError;
      const [beforeInsertResult] = await chrome.scripting.executeScript({
        target,
        world: "MAIN",
        func: inspectXEditor,
        args: [message.selectors]
      });
      trace.insertBefore = beforeInsertResult?.result || null;
      trace.inputInsertTextCalled = true;
      const insertResult = await sendDebuggerCommand(
        target,
        "Input.insertText",
        { text: message.draft }
      );
      trace.inputInsertTextResult = insertResult.result;
      trace.inputInsertTextRuntimeLastError = insertResult.runtimeLastError;
      const [inspectionResult] = await chrome.scripting.executeScript({
        target,
        world: "MAIN",
        func: inspectXEditor,
        args: [message.selectors]
      });
      trace.insertAfter = inspectionResult?.result || null;
      trace.postWriteInspection = trace.insertAfter;
      console.info(logPrefix, "写入链路完整结果", trace);
      sendResponse({
        ok: true,
        method: "chrome.debugger Input.insertText",
        activeElementIsTextbox: true,
        trace
      });
    } catch (error) {
      if (!attached) trace.attachRuntimeLastError = error.message;
      else trace.inputInsertTextRuntimeLastError = error.message;
      console.error(logPrefix, "写入链路失败", { error: error.message, trace });
      sendResponse({ ok: false, reason: error.message, trace });
    } finally {
      if (attached) await detachDebugger(target);
    }
  }).catch((error) => {
    sendResponse({ ok: false, reason: error.message });
  });
  return true;
});
