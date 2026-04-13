import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserShell } from '../BrowserShell';
import { Sandbox } from '../Sandbox';
import { NewTab } from '../NewTab';
import { streamPageGeneration } from '../../services/geminiService';
import { Page, Breadcrumb, TokenCount, FormFieldState, GroundingSource, Tab, createTab } from '../../types';
import { siteNameFromPrompt, parsePageFromHref, extractTitleFromHtml, parseBreadcrumb } from '../../utils/urlHelpers';
import { cn } from '../../lib/utils';

export const BrowserApp: React.FC = () => {
  // Tab state
  const [tabs, setTabs] = useState<Tab[]>([createTab()]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Global controls (shared across tabs)
  const [isGrounded, setIsGrounded] = useState(false);

  // Abort controllers keyed by tab id
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const activeTab = tabs[activeTabIndex];
  const currentPage = activeTab.currentIndex >= 0 ? activeTab.history[activeTab.currentIndex] : null;

  // -- Helper to update the active tab immutably --
  const updateTab = useCallback((tabIndex: number, updater: (tab: Tab) => Tab) => {
    setTabs(prev => prev.map((t, i) => i === tabIndex ? updater(t) : t));
  }, []);

  // -- Core Generation Logic --
  const generate = useCallback(async (
    prompt: string,
    currentHtml: string | null,
    fallbackBreadcrumb: Breadcrumb,
    pushHistory: boolean = true,
    formState?: FormFieldState[]
  ) => {
    const tabIndex = activeTabIndex;
    const tabId = tabs[tabIndex].id;

    // Abort any in-flight request for this tab
    const existingController = abortControllersRef.current.get(tabId);
    if (existingController) {
      existingController.abort();
    }
    const controller = new AbortController();
    abortControllersRef.current.set(tabId, controller);

    updateTab(tabIndex, tab => ({
      ...tab,
      loading: true,
      loadingMessage: 'Streaming website from Gemini 3.1 Flash',
      generatedContent: '',
      tokenCount: null,
      groundingSources: [],
      searchEntryPointHtml: '',
      breadcrumb: { sitename: fallbackBreadcrumb.sitename, page: '' },
      ...(pushHistory ? { navigationId: tab.navigationId + 1 } : {}),
    }));

    let fullHtml = '';
    let pageTokenCount: TokenCount = { input: 0, output: 0 };
    let pageGroundingSources: GroundingSource[] = [];
    let pageSearchEntryPointHtml = '';
    let titleExtracted = false;

    try {
      const stream = streamPageGeneration(prompt, currentHtml, isGrounded, controller.signal, formState, window.innerWidth <= 768);

      for await (const chunk of stream) {
        if (controller.signal.aborted) break;

        // Live token count updates (estimated during streaming)
        if (chunk.startsWith('__TOKEN__')) {
          try {
            const tokenData = JSON.parse(chunk.replace('__TOKEN__', ''));
            updateTab(tabIndex, tab => ({ ...tab, tokenCount: tokenData }));
          } catch { }
          continue;
        }

        if (chunk.startsWith('__META__')) {
          try {
            const meta = JSON.parse(chunk.replace('__META__', ''));
            pageTokenCount = meta.tokenCount;
            // Update with confirmed (non-estimate) values
            updateTab(tabIndex, tab => ({ ...tab, tokenCount: pageTokenCount }));
            if (meta.groundingSources?.length) {
              pageGroundingSources = meta.groundingSources;
              updateTab(tabIndex, tab => ({ ...tab, groundingSources: meta.groundingSources }));
            }
            if (meta.searchEntryPointHtml) {
              pageSearchEntryPointHtml = meta.searchEntryPointHtml;
              updateTab(tabIndex, tab => ({ ...tab, searchEntryPointHtml: meta.searchEntryPointHtml }));
            }
          } catch { }
          continue;
        }
        fullHtml += chunk;

        const currentFullHtml = fullHtml;
        let extractedBreadcrumb: Breadcrumb | null = null;
        if (!titleExtracted && currentFullHtml.includes('</title>')) {
          extractedBreadcrumb = extractTitleFromHtml(currentFullHtml);
          if (extractedBreadcrumb) titleExtracted = true;
        }

        updateTab(tabIndex, tab => ({
          ...tab,
          generatedContent: currentFullHtml,
          loadingMessage: 'Streaming website from Gemini 3.1 Flash',
          ...(extractedBreadcrumb ? { breadcrumb: extractedBreadcrumb } : {}),
        }));
      }

      if (controller.signal.aborted) return;

      const finalBreadcrumb = titleExtracted
        ? (extractTitleFromHtml(fullHtml) || fallbackBreadcrumb)
        : fallbackBreadcrumb;

      const newPage: Page = {
        html: fullHtml,
        breadcrumb: finalBreadcrumb,
        scrollPosition: 0,
        timestamp: Date.now(),
        tokenCount: pageTokenCount,
        prompt,
        contextHtml: currentHtml,
        isGrounded,
        groundingSources: pageGroundingSources,
        searchEntryPointHtml: pageSearchEntryPointHtml,
      };

      updateTab(tabIndex, tab => {
        if (pushHistory) {
          const newHistory = [...tab.history.slice(0, tab.currentIndex + 1), newPage];
          return {
            ...tab,
            history: newHistory,
            currentIndex: newHistory.length - 1,
            breadcrumb: finalBreadcrumb,
            tokenCount: pageTokenCount,
          };
        } else {
          const updated = [...tab.history];
          if (tab.currentIndex >= 0) {
            updated[tab.currentIndex] = newPage;
          }
          return {
            ...tab,
            history: updated,
            breadcrumb: finalBreadcrumb,
            tokenCount: pageTokenCount,
          };
        }
      });

    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) return;
      console.error('Generation failed', e);
      updateTab(tabIndex, tab => ({
        ...tab,
        breadcrumb: fallbackBreadcrumb,
        generatedContent: `<div class="p-10"><h1>Error</h1><p>Failed to generate page</p></div>`,
      }));
    } finally {
      if (abortControllersRef.current.get(tabId) === controller) {
        updateTab(tabIndex, tab => ({
          ...tab,
          loading: false,
          loadingMessage: '',
        }));
        abortControllersRef.current.delete(tabId);
      }
    }
  }, [isGrounded, activeTabIndex, tabs, updateTab]);

  // -- Stop loading --
  const handleStop = useCallback(() => {
    const tabId = activeTab.id;
    const controller = abortControllersRef.current.get(tabId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(tabId);
    }
    updateTab(activeTabIndex, tab => ({
      ...tab,
      loading: false,
      loadingMessage: '',
    }));
  }, [activeTab, activeTabIndex, updateTab]);

  // ============================================================
  // ALL PAGE GENERATION TRIGGERS
  // ============================================================

  const handleCreate = useCallback((prompt: string) => {
    const fallback: Breadcrumb = { sitename: siteNameFromPrompt(prompt), page: 'Home' };
    generate(prompt, null, fallback, true);
  }, [generate]);

  const handleEdit = useCallback((prompt: string, formState?: FormFieldState[]) => {
    if (!currentPage) return;
    const fallback: Breadcrumb = { ...currentPage.breadcrumb };
    generate(prompt, currentPage.html, fallback, true, formState);
  }, [currentPage, generate]);

  const handleRefresh = useCallback(() => {
    if (!currentPage) return;
    generate(currentPage.prompt, currentPage.contextHtml, currentPage.breadcrumb, false);
  }, [currentPage, generate]);

  const handleNavigate = useCallback((type: 'create' | 'edit', prompt: string) => {
    if (type === 'create') handleCreate(prompt);
    else handleEdit(prompt);
  }, [handleCreate, handleEdit]);

  // ============================================================
  // BROWSER NAVIGATION
  // ============================================================

  const handleBack = useCallback(() => {
    if (activeTab.currentIndex > 0) {
      updateTab(activeTabIndex, tab => ({ ...tab, currentIndex: tab.currentIndex - 1 }));
    }
  }, [activeTab.currentIndex, activeTabIndex, updateTab]);

  const handleForward = useCallback(() => {
    if (activeTab.currentIndex < activeTab.history.length - 1) {
      updateTab(activeTabIndex, tab => ({ ...tab, currentIndex: tab.currentIndex + 1 }));
    }
  }, [activeTab.currentIndex, activeTab.history.length, activeTabIndex, updateTab]);

  const handleHome = useCallback(() => {
    updateTab(activeTabIndex, tab => ({
      ...tab,
      history: [],
      currentIndex: -1,
      generatedContent: '',
      breadcrumb: { sitename: '', page: '' },
      tokenCount: null,
      groundingSources: [],
      searchEntryPointHtml: '',
    }));
  }, [activeTabIndex, updateTab]);

  // ============================================================
  // TAB MANAGEMENT
  // ============================================================

  const handleNewTab = useCallback(() => {
    setTabs(prev => [...prev, createTab()]);
    setActiveTabIndex(tabs.length);
  }, [tabs.length]);

  const handleCloseTab = useCallback((index: number) => {
    if (tabs.length === 1) {
      handleHome();
      return;
    }
    const tabId = tabs[index].id;
    const controller = abortControllersRef.current.get(tabId);
    if (controller) controller.abort();
    abortControllersRef.current.delete(tabId);

    const newTabs = tabs.filter((_, i) => i !== index);
    setTabs(newTabs);
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(newTabs.length - 1);
    } else if (activeTabIndex === index && index > 0) {
      setActiveTabIndex(index - 1);
    }
  }, [activeTabIndex, handleHome, tabs]);

  const handleSwitchTab = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  // ============================================================
  // SANDBOX CALLBACKS
  // ============================================================

  const handleLinkClick = useCallback((href: string) => {
    const pageString = parsePageFromHref(href);
    const parsed = parseBreadcrumb(pageString);
    const prompt = `Navigate to the ${parsed.page} page of ${parsed.sitename}.`;
    generate(prompt, currentPage?.html || null, parsed, true);
  }, [currentPage, generate]);

  const handlePerformAction = useCallback((intent: string, payload?: string) => {
    const prompt = `Perform action: ${intent}${payload ? ` with data: ${payload}` : ''}`;
    handleEdit(prompt);
  }, [handleEdit]);

  const handleFormSubmit = useCallback((formState: FormFieldState[]) => {
    handleEdit("Process form submission", formState);
  }, [handleEdit]);

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden relative">
      <BrowserShell
        breadcrumb={activeTab.breadcrumb}
        isLoading={activeTab.loading}
        loadingMessage={activeTab.loadingMessage}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onRefresh={handleRefresh}
        onStop={handleStop}
        onHome={handleHome}
        canGoBack={activeTab.currentIndex > 0}
        canGoForward={activeTab.currentIndex < activeTab.history.length - 1}
        groundingSources={activeTab.groundingSources}
        searchEntryPointHtml={activeTab.searchEntryPointHtml}
        tabs={tabs}
        activeTabIndex={activeTabIndex}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onSwitchTab={handleSwitchTab}
        isGrounded={isGrounded}
        onToggleGrounding={() => setIsGrounded(!isGrounded)}
      >
        {activeTab.currentIndex === -1 && !activeTab.loading ? (
          <NewTab onCreatePage={handleCreate} />
        ) : (
          <Sandbox
            htmlContent={activeTab.generatedContent || currentPage?.html || ''}
            onNavigate={handleLinkClick}
            onAction={handlePerformAction}
          />
        )}
      </BrowserShell>

      {/* Token Count Overlay (Bottom Right) */}
      {activeTab.tokenCount && (
        <div className="absolute bottom-4 right-4 bg-[#1a1b1e]/80 backdrop-blur-md border border-[#3c4043] rounded-full px-4 py-1.5 flex items-center gap-3 z-50 pointer-events-none shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "material-symbols-outlined text-sm",
              activeTab.loading ? "animate-spin" : "text-[#81c995]"
            )}>
              {activeTab.loading ? 'sync' : 'check_circle'}
            </span>
            <span className="text-[11px] font-mono text-[#e8eaed]">
              {((activeTab.tokenCount.input || 0) + (activeTab.tokenCount.output || 0)).toLocaleString()} tokens
            </span>
          </div>
          <div className="w-px h-3 bg-[#3c4043]" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#9aa0a6]">
            Gemini 3.1 Flash
          </span>
        </div>
      )}
    </div>
  );
};
