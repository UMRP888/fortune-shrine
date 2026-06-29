(() => {
  const logPrefix = "[Fortune Shrine V0.7]";
  const marker = "fortune-shrine-draft=";
  const storedDraftKey = "fortune-shrine-v07-pending-draft";
  const storedTargetUrlKey = "fortune-shrine-v07-target-url";
  const diagnosticSamplesKey = "fortune-shrine-v07-dom-samples";
  const encodedHash = location.hash.startsWith(`#${marker}`)
    ? location.hash.slice(marker.length + 1)
    : "";

  function decodeDraft(value) {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  }

  function log(message, details = {}) {
    console.info(logPrefix, message, details);
  }

  function warn(message, details = {}) {
    console.warn(logPrefix, message, details);
  }

  function banner(message, tone = "safe") {
    const element = document.createElement("div");
    element.textContent = message;
    Object.assign(element.style, {
      position: "fixed",
      zIndex: "2147483647",
      top: "14px",
      left: "50%",
      transform: "translateX(-50%)",
      maxWidth: "680px",
      padding: "12px 16px",
      borderRadius: "10px",
      border: `1px solid ${tone === "safe" ? "#8b6b3f" : "#9f4f4f"}`,
      background: "#171411",
      color: "#f2e6d2",
      font: "14px/1.4 system-ui, sans-serif",
      boxShadow: "0 10px 30px rgba(0,0,0,.45)"
    });
    document.documentElement.append(element);
    setTimeout(() => element.remove(), 8_000);
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none"
      && style.visibility !== "hidden"
      && rect.width > 0
      && rect.height > 0;
  }

  const textboxSelectors = [
    '[role="dialog"] [data-testid="tweetTextarea_0"][contenteditable="true"]',
    '[role="dialog"] [role="textbox"][contenteditable="true"]',
    '[data-testid="tweetTextarea_0"][contenteditable="true"]',
    '[role="textbox"][contenteditable="true"]',
    '.public-DraftEditor-content[contenteditable="true"]'
  ];

  function findTextbox() {
    const selectorCounts = Object.fromEntries(
      textboxSelectors.map((selector) => [selector, document.querySelectorAll(selector).length])
    );
    for (const selector of textboxSelectors) {
      const matches = [...document.querySelectorAll(selector)];
      const textbox = matches.find(isVisible);
      if (textbox) return { textbox, selector, selectorCounts };
    }
    return { textbox: null, selector: null, selectorCounts };
  }

  async function waitForTextbox(timeout = 15_000) {
    const existing = findTextbox();
    if (existing.textbox) return existing;
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const found = findTextbox();
        if (!found.textbox) return;
        observer.disconnect();
        resolve(found);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(findTextbox());
      }, timeout);
    });
  }

  async function waitForReplyButton(timeout = 12_000) {
    const find = () => [...document.querySelectorAll('[data-testid="reply"]')].find(isVisible) || null;
    const existing = find();
    if (existing) return existing;
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const found = find();
        if (!found) return;
        observer.disconnect();
        resolve(found);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(find());
      }, timeout);
    });
  }

  function readTextbox(textbox) {
    return textbox.innerText || textbox.textContent || "";
  }

  function describeElement(element) {
    if (!(element instanceof Element)) return String(element);
    return {
      tagName: element.tagName,
      role: element.getAttribute("role"),
      testId: element.getAttribute("data-testid"),
      contentEditable: element.getAttribute("contenteditable"),
      className: typeof element.className === "string" ? element.className : ""
    };
  }

  function inspectReactControl(element) {
    if (!(element instanceof Element)) {
      return {
        reactControlledMarkersFound: false,
        reactInternalKeys: []
      };
    }
    const reactInternalKeys = Object.getOwnPropertyNames(element)
      .filter((key) =>
        key.startsWith("__reactFiber$")
        || key.startsWith("__reactProps$")
        || key.startsWith("__reactEvents$")
        || key.startsWith("_reactRootContainer")
        || key === "_valueTracker"
      );
    return {
      reactControlledMarkersFound: reactInternalKeys.length > 0,
      reactInternalKeys
    };
  }

  function textboxContents(textbox) {
    return {
      innerText: textbox.innerText,
      textContent: textbox.textContent,
      innerHTML: textbox.innerHTML
    };
  }

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

  function localEditableTree() {
    return [...document.querySelectorAll('[contenteditable="true"]')].map((element) => ({
      path: nodePath(element),
      tagName: element.tagName,
      role: element.getAttribute("role"),
      contentEditable: element.getAttribute("contenteditable"),
      ariaLabel: element.getAttribute("aria-label"),
      testId: element.getAttribute("data-testid"),
      className: typeof element.className === "string" ? element.className : "",
      innerText: element.innerText || "",
      textContent: element.textContent || "",
      outerHTML: element.outerHTML,
      parentChain: (() => {
        const chain = [];
        let current = element.parentElement;
        while (current && chain.length < 10) {
          chain.push(describeElement(current));
          current = current.parentElement;
        }
        return chain;
      })(),
      react: inspectReactControl(element)
    }));
  }

  function localStageSnapshot(textbox) {
    const activeElement = document.activeElement;
    return {
      capturedAt: new Date().toISOString(),
      activeElement: {
        path: nodePath(activeElement),
        outerHTML: activeElement instanceof Element ? activeElement.outerHTML : String(activeElement),
        tagName: activeElement?.tagName || null,
        role: activeElement instanceof Element ? activeElement.getAttribute("role") : null,
        contentEditable:
          activeElement instanceof HTMLElement ? activeElement.contentEditable : null
      },
      editor: {
        path: nodePath(textbox),
        outerHTML: textbox.outerHTML,
        innerHTML: textbox.innerHTML,
        innerText: textbox.innerText || "",
        textContent: textbox.textContent || "",
        role: textbox.getAttribute("role"),
        contentEditable: textbox.getAttribute("contenteditable"),
        ariaLabel: textbox.getAttribute("aria-label"),
        testId: textbox.getAttribute("data-testid"),
        className: typeof textbox.className === "string" ? textbox.className : "",
        uniqueAttributeIdentifier: [
          textbox.tagName,
          textbox.getAttribute("role"),
          textbox.getAttribute("data-testid"),
          textbox.getAttribute("aria-label"),
          typeof textbox.className === "string" ? textbox.className : "",
          nodePath(textbox)
        ].filter(Boolean).join("|")
      },
      contentEditableTree: localEditableTree()
    };
  }

  async function saveDiagnosticSample(outcome, textbox, insertion, details) {
    const activeElement = document.activeElement;
    const sample = {
      sampleId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      capturedAt: new Date().toISOString(),
      outcome,
      locationHref: location.href,
      targetTweetUrl: sessionStorage.getItem(storedTargetUrlKey) || location.href,
      replyText: details.draft,
      focusData: {
        beforeFocus: insertion?.attempts?.[0]?.response?.trace?.focusBefore || null,
        afterFocus: insertion?.attempts?.[0]?.response?.trace?.focusAfter || null,
        beforeInsert: insertion?.attempts?.[0]?.response?.trace?.insertBefore || null,
        afterInsert: insertion?.attempts?.[0]?.response?.trace?.insertAfter || null,
        beforeValidation: details.beforeValidation,
        afterValidation: details.afterValidation
      },
      validation: {
        beforeReadTextLength: details.beforeReadTextLength,
        afterReadTextLength: details.afterReadTextLength,
        validationTextLength: details.validationTextLength,
        finalDetectedResult: outcome
      },
      activeElement: {
        path: nodePath(activeElement),
        outerHTML: activeElement instanceof Element ? activeElement.outerHTML : String(activeElement),
        react: inspectReactControl(activeElement)
      },
      editor: {
        path: nodePath(textbox),
        outerHTML: textbox.outerHTML,
        innerText: textbox.innerText || "",
        textContent: textbox.textContent || "",
        innerHTML: textbox.innerHTML,
        react: inspectReactControl(textbox)
      },
      contentEditableTree: localEditableTree(),
      mainWorldInspection:
        insertion?.attempts?.[0]?.response?.trace?.postWriteInspection || null
    };

    try {
      const samples = JSON.parse(localStorage.getItem(diagnosticSamplesKey) || "[]");
      samples.push(sample);
      localStorage.setItem(diagnosticSamplesKey, JSON.stringify(samples));
      const counts = samples.reduce((result, item) => {
        result[item.outcome] = (result[item.outcome] || 0) + 1;
        return result;
      }, {});
      log("DOM诊断样本已保存", {
        sampleId: sample.sampleId,
        outcome,
        storageKey: diagnosticSamplesKey,
        total: samples.length,
        counts
      });
      const exportResult = await chrome.runtime.sendMessage({
        type: "fortune-shrine-save-dom-sample",
        sample
      });
      log("DOM诊断样本已导出", exportResult);
    } catch (error) {
      console.error(logPrefix, "DOM诊断样本保存失败", error);
    }
  }

  function debugTextbox(textbox, delayMs) {
    const activeElement = document.activeElement;
    log(`写入后 ${delayMs}ms 文本框快照`, {
      textboxDOM: describeElement(textbox),
      textboxOuterHTML: textbox.outerHTML.slice(0, 500),
      textboxContentEditable: textbox.contentEditable,
      textboxRole: textbox.getAttribute("role"),
      textboxAriaLabel: textbox.getAttribute("aria-label"),
      textboxInnerText: textbox.innerText,
      textboxTextContent: textbox.textContent,
      textboxInnerHTML: textbox.innerHTML,
      reactControlInspection: inspectReactControl(textbox),
      activeElementOuterHTML: activeElement instanceof Element
        ? activeElement.outerHTML.slice(0, 500)
        : String(activeElement)
    });
  }

  function placeCaret(textbox) {
    textbox.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textbox);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    return document.activeElement === textbox || textbox.contains(document.activeElement);
  }

  function dispatchInput(textbox, type, draft) {
    textbox.dispatchEvent(new InputEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: type === "beforeinput",
      inputType: "insertText",
      data: draft
    }));
  }

  function waitForReact() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 120)));
    });
  }

  function recordAttempt(attempts, details) {
    attempts.push(details);
    log("写入尝试", details);
  }

  async function insertDraft(textbox, draft) {
    const response = await chrome.runtime.sendMessage({
      type: "fortune-shrine-fill-draft",
      draft,
      selectors: textboxSelectors
    });
    log("chrome.debugger 完整链路", {
      ok: response?.ok === true,
      reason: response?.reason || null,
      targetTabId: response?.trace?.targetTabId ?? null,
      attachCalled: response?.trace?.attachCalled ?? false,
      attachSucceeded: response?.trace?.attachSucceeded ?? false,
      attachRuntimeLastError: response?.trace?.attachRuntimeLastError ?? null,
      inputInsertTextCalled: response?.trace?.inputInsertTextCalled ?? false,
      inputInsertTextResult: response?.trace?.inputInsertTextResult ?? null,
      inputInsertTextRuntimeLastError:
        response?.trace?.inputInsertTextRuntimeLastError ?? null,
      postWriteActiveElementOuterHTML:
        response?.trace?.postWriteInspection?.activeElementOuterHTML || "",
      postWriteTextboxInnerText:
        response?.trace?.postWriteInspection?.textboxInnerText || ""
    });
    await waitForReact();
    const loadedText = readTextbox(textbox);
    return {
      focusExecuted: response?.activeElementIsTextbox === true,
      insertTextResult: response?.ok === true,
      loadedText,
      loadedSuccessfully: response?.ok === true && loadedText.trim().length > 0,
      attempts: [{
        method: "Chrome MAIN world native editor input",
        response,
        textboxContents: textboxContents(textbox)
      }]
    };
  }

  async function fill() {
    let draft = "";
    if (encodedHash) {
      draft = decodeDraft(encodedHash);
      sessionStorage.setItem(storedDraftKey, draft);
      sessionStorage.setItem(storedTargetUrlKey, `${location.origin}${location.pathname}${location.search}`);
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    } else {
      draft = sessionStorage.getItem(storedDraftKey) || "";
    }

    log("草稿读取", {
      source: encodedHash ? "URL hash" : "sessionStorage",
      draftRead: Boolean(draft),
      draftLength: draft.length,
      pathname: location.pathname
    });
    if (!draft) return;

    let result = findTextbox();
    if (!result.textbox) {
      const replyButton = await waitForReplyButton();
      log("回复按钮定位", {
        found: Boolean(replyButton),
        selector: '[data-testid="reply"]'
      });
      if (!replyButton) {
        warn("未找到回复按钮", { pathname: location.pathname });
        banner("未找到回复按钮。草稿已保留在剪贴板，请人工定位回复框。", "warning");
        await navigator.clipboard.writeText(draft).catch(() => {});
        return;
      }
      replyButton.click();
      result = await waitForTextbox();
    }

    log("文本框定位", {
      found: Boolean(result.textbox),
      selector: result.selector,
      textboxLength: result.textbox ? 1 : 0,
      selectorCounts: result.selectorCounts
    });
    if (!result.textbox) {
      warn("未找到回复框", { selectorCounts: result.selectorCounts });
      banner("未找到回复框。草稿已保留在剪贴板，请人工粘贴。", "warning");
      await navigator.clipboard.writeText(draft).catch(() => {});
      return;
    }

    const beforeReadTextLength = readTextbox(result.textbox).trim().length;
    const insertion = await insertDraft(result.textbox, draft);
    debugTextbox(result.textbox, 0);
    setTimeout(() => debugTextbox(result.textbox, 100), 100);
    setTimeout(() => debugTextbox(result.textbox, 500), 500);
    setTimeout(() => debugTextbox(result.textbox, 1000), 1000);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const beforeValidation = localStageSnapshot(result.textbox);
    const finalResult = findTextbox();
    const finalTextbox = finalResult.textbox || result.textbox;
    const finalText = readTextbox(finalTextbox);
    const finalTextLength = finalText.trim().length;
    const verifiedLoaded = finalTextLength > 0;
    const afterValidation = localStageSnapshot(finalTextbox);
    const debuggerTrace = insertion?.attempts?.[0]?.response?.trace || {};
    log("写入诊断汇总", {
      locationHref: location.href,
      foundElement: {
        selector: finalResult.selector || result.selector,
        tagName: finalTextbox.tagName,
        role: finalTextbox.getAttribute("role"),
        contentEditable: finalTextbox.getAttribute("contenteditable"),
        testId: finalTextbox.getAttribute("data-testid"),
        className: typeof finalTextbox.className === "string"
          ? finalTextbox.className
          : ""
      },
      activeElement: describeElement(document.activeElement),
      activeElementIsFinalTextbox:
        document.activeElement === finalTextbox
        || finalTextbox.contains(document.activeElement),
      textLengths: {
        beforeWrite: beforeReadTextLength,
        afterInsertTextCommand: insertion.loadedText.trim().length,
        beforeValidation:
          beforeValidation.editor.innerText.trim().length,
        afterValidation:
          afterValidation.editor.innerText.trim().length,
        xEditorFinalCharacterCount: finalTextLength
      },
      inputInsertTextDispatch: {
        called: debuggerTrace.inputInsertTextCalled === true,
        commandReturned:
          debuggerTrace.inputInsertTextRuntimeLastError == null
          && debuggerTrace.inputInsertTextCalled === true,
        result: debuggerTrace.inputInsertTextResult ?? null,
        runtimeLastError: debuggerTrace.inputInsertTextRuntimeLastError ?? null
      },
      xEditorAcceptedText: verifiedLoaded
    });
    log("草稿填入", {
      selector: finalResult.selector || result.selector,
      draftRead: true,
      draftLength: draft.length,
      textboxFocusExecuted: insertion.focusExecuted,
      execCommandResult: insertion.insertTextResult,
      textboxInnerTextLoaded: verifiedLoaded,
      textboxInnerTextLength: finalTextLength,
      textboxInnerText: finalText,
      activeElement: describeElement(document.activeElement),
      attempts: insertion.attempts
    });
    if (!verifiedLoaded) {
      await saveDiagnosticSample("failure", finalTextbox, insertion, {
        draft,
        beforeReadTextLength,
        afterReadTextLength: insertion.loadedText.trim().length,
        validationTextLength: finalTextLength,
        beforeValidation,
        afterValidation
      });
      warn("回复框存在，但草稿未写入", {
        selector: finalResult.selector || result.selector,
        textboxInnerTextLength: finalTextLength,
        textboxInnerText: finalText,
        activeElement: describeElement(document.activeElement),
        attempts: insertion.attempts
      });
      banner("已找到回复框，但草稿未写入。草稿已复制，请人工粘贴。", "warning");
      await navigator.clipboard.writeText(draft).catch(() => {});
      return;
    }

    await saveDiagnosticSample("success", finalTextbox, insertion, {
      draft,
      beforeReadTextLength,
      afterReadTextLength: insertion.loadedText.trim().length,
      validationTextLength: finalTextLength,
      beforeValidation,
      afterValidation
    });
    sessionStorage.removeItem(storedDraftKey);
    banner("草稿已填入。请逐字检查；只有你可以点击 Reply 或使用发送快捷键。");
  }

  fill().catch((error) => {
    console.error(logPrefix, "草稿填入异常", error);
    banner("草稿填入失败。请返回审核页复制后人工粘贴。", "warning");
  });
})();
