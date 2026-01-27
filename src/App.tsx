import React, { useMemo, useState, useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";

import esbLogo from "./assets/esb_logo.png";
import esbMeta from "./assets/esb_meta.png";

const STORAGE_KEY = "ai-excel-spreadsheets";
const API_KEY_STORAGE_KEY = "ai-excel-api-key";

type Spreadsheet = {
  id: string;
  name: string;
  lastUpdated: string;
  rows: string[][];
};

const seedSheets: Spreadsheet[] = [
  {
    id: "market-insights",
    name: "Market Insights",
    lastUpdated: "Today · 2:14 PM",
    rows: [
      ["Segment", "Revenue", "Growth", "Notes"],
      ["SMB", "$180,000", "12%", "High retention"],
      ["Mid-Market", "$420,000", "18%", "Upsell ready"],
      ["Enterprise", "$960,000", "9%", "Longer sales cycle"]
    ]
  },
  {
    id: "campaign-tracker",
    name: "Campaign Tracker",
    lastUpdated: "Yesterday · 6:47 PM",
    rows: [
      ["Channel", "Spend", "Leads", "CPA"],
      ["LinkedIn", "$24,000", "210", "$114"],
      ["Search", "$18,500", "300", "$62"],
      ["Events", "$12,400", "85", "$146"]
    ]
  }
];

const featurePills = [
  "Scrape & clean web data",
  "Auto-format tables",
  "Generate charts",
  "Animate insights",
  "Export CSV / PDF"
];

const suggestions = [
  "Build a competitor pricing table for SaaS CRM tools",
  "Create a weekly budget tracker with chart",
  "Summarize Q1 performance by region"
];

const App = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<"chat" | "sheet">("chat");
  const [expandedPanel, setExpandedPanel] = useState<"split" | "chat" | "sheet">("split");
  const [sheets, setSheets] = useState<Spreadsheet[]>(seedSheets);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSheets(JSON.parse(stored) as Spreadsheet[]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  }, [sheets]);

  useEffect(() => {
    const storedKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } else {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }, [apiKey]);

  const hasStarted = messages.length > 0;

  const activeSheet = useMemo(() => sheets[0], [sheets]);

  const handleSend = () => {
    if (!input.trim()) {
      return;
    }
    setMessages((prev) => [...prev, input.trim()]);
    setInput("");
  };

  const handleStartWithPrompt = (prompt: string) => {
    setMessages((prev) => [...prev, prompt]);
  };

  const panelStyles = useMemo(() => {
    if (expandedPanel === "chat") {
      return { chat: styles.panelWide, sheet: styles.panelNarrow };
    }
    if (expandedPanel === "sheet") {
      return { chat: styles.panelNarrow, sheet: styles.panelWide };
    }
    return { chat: styles.panelSplit, sheet: styles.panelSplit };
  }, [expandedPanel]);

  return (
    <View style={styles.appShell}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={esbLogo} style={styles.brandLogo} />
          <View>
            <Text style={styles.brandTitle}>AI Excel Spreadsheet Builder</Text>
            <Text style={styles.brandSubtitle}>
              Local-first AI spreadsheets with export-ready CSV + PDF
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.apiKeyCard}>
            <Text style={styles.apiKeyLabel}>AI API key</Text>
            <TextInput
              placeholder="Paste API key (stored locally)"
              placeholderTextColor="#94a3b8"
              value={apiKey}
              onChangeText={setApiKey}
              style={styles.apiKeyInput}
              secureTextEntry
            />
          </View>
          <View style={styles.headerBadges}>
            <Text style={styles.headerBadge}>No auth required</Text>
            <Text style={styles.headerBadgeSecondary}>Payments + auth coming soon</Text>
          </View>
        </View>
      </View>

      {!hasStarted ? (
        <View style={styles.centerStage}>
          <Image source={esbMeta} style={styles.heroLogo} />
          <Text style={styles.heroTitle}>Build a spreadsheet in one chat.</Text>
          <Text style={styles.heroBody}>
            Ask the AI to scrape, format, chart, and animate data. Everything stays saved locally
            on your device, with one-click downloads to CSV or PDF.
          </Text>
          <View style={styles.chatInputWrap}>
            <TextInput
              placeholder="Describe the spreadsheet you want..."
              placeholderTextColor="#94a3b8"
              value={input}
              onChangeText={setInput}
              style={styles.chatInput}
            />
            <Pressable style={styles.primaryButton} onPress={handleSend}>
              <Text style={styles.primaryButtonText}>Generate</Text>
            </Pressable>
          </View>
          <View style={styles.pillRow}>
            {featurePills.map((pill) => (
              <View key={pill} style={styles.pill}>
                <Text style={styles.pillText}>{pill}</Text>
              </View>
            ))}
          </View>
          <View style={styles.suggestionBlock}>
            <Text style={styles.sectionTitle}>Try a prompt</Text>
            <View style={styles.suggestionRow}>
              {suggestions.map((prompt) => (
                <Pressable
                  key={prompt}
                  style={styles.suggestionChip}
                  onPress={() => handleStartWithPrompt(prompt)}
                >
                  <Text style={styles.suggestionText}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.workspace}>
          {!isMobile && (
            <View style={styles.workspaceControls}>
              <Text style={styles.sectionTitle}>Workspace layout</Text>
              <View style={styles.controlButtons}>
                <Pressable
                  style={[
                    styles.ghostButton,
                    expandedPanel === "chat" && styles.ghostButtonActive
                  ]}
                  onPress={() => setExpandedPanel("chat")}
                >
                  <Text style={styles.ghostButtonText}>Expand chat</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.ghostButton,
                    expandedPanel === "split" && styles.ghostButtonActive
                  ]}
                  onPress={() => setExpandedPanel("split")}
                >
                  <Text style={styles.ghostButtonText}>Split view</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.ghostButton,
                    expandedPanel === "sheet" && styles.ghostButtonActive
                  ]}
                  onPress={() => setExpandedPanel("sheet")}
                >
                  <Text style={styles.ghostButtonText}>Expand canvas</Text>
                </Pressable>
              </View>
            </View>
          )}
          <View style={styles.workspaceBody}>
            {(!isMobile || viewMode === "chat") && (
              <View style={[styles.panel, panelStyles.chat]}>
                <Text style={styles.panelTitle}>AI chat</Text>
                <ScrollView style={styles.chatStream}>
                  {messages.map((message, index) => (
                    <View
                      key={`${message}-${index}`}
                      style={[
                        styles.messageBubble,
                        index % 2 === 0 ? styles.messageUser : styles.messageBot
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          index % 2 === 0 && styles.messageUserText
                        ]}
                      >
                        {message}
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.messageBubble, styles.messageBot]}>
                    <Text style={styles.messageText}>
                      I can scrape, tabulate, and chart the data. Tell me what to add or edit in the
                      sheet.
                    </Text>
                  </View>
                </ScrollView>
                <View style={styles.chatComposer}>
                  <TextInput
                    placeholder="Ask for updates, formatting, or exports"
                    placeholderTextColor="#94a3b8"
                    value={input}
                    onChangeText={setInput}
                    style={styles.chatInput}
                  />
                  <Pressable style={styles.primaryButton} onPress={handleSend}>
                    <Text style={styles.primaryButtonText}>Send</Text>
                  </Pressable>
                </View>
                <View style={styles.savedBlock}>
                  <Text style={styles.sectionTitle}>Saved locally</Text>
                  {sheets.map((sheet) => (
                    <View key={sheet.id} style={styles.savedRow}>
                      <Text style={styles.savedName}>{sheet.name}</Text>
                      <Text style={styles.savedMeta}>{sheet.lastUpdated}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {(!isMobile || viewMode === "sheet") && (
              <View style={[styles.panel, panelStyles.sheet]}>
                <View style={styles.canvasHeader}>
                  <Text style={styles.panelTitle}>Spreadsheet canvas</Text>
                  <View style={styles.exportRow}>
                    <Pressable style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Download CSV</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Download PDF</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.canvasBody}>
                  <View style={styles.sheetCard}>
                    <Text style={styles.sheetTitle}>{activeSheet.name}</Text>
                    <Text style={styles.sheetMeta}>Last updated {activeSheet.lastUpdated}</Text>
                    <View style={styles.table}>
                      {activeSheet.rows.map((row, rowIndex) => (
                        <View
                          key={`row-${rowIndex}`}
                          style={[
                            styles.tableRow,
                            rowIndex === 0 && styles.tableHeaderRow
                          ]}
                        >
                          {row.map((cell, cellIndex) => (
                            <View
                              key={`cell-${rowIndex}-${cellIndex}`}
                              style={[
                                styles.tableCell,
                                rowIndex === 0 && styles.tableHeaderCell
                              ]}
                            >
                              <Text
                                style={rowIndex === 0 ? styles.tableHeaderText : styles.tableText}
                              >
                                {cell}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.insightsRow}>
                    <View style={styles.insightCard}>
                      <Text style={styles.insightTitle}>Chart preview</Text>
                      <Text style={styles.insightBody}>
                        Auto-generated bar chart with animated growth markers.
                      </Text>
                      <View style={styles.chartBars}>
                        {[72, 88, 56, 80].map((value, index) => (
                          <View key={`bar-${index}`} style={styles.chartBarWrap}>
                            <View style={[styles.chartBar, { height: value }]} />
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.insightCard}>
                      <Text style={styles.insightTitle}>AI actions</Text>
                      <Text style={styles.insightBody}>• Highlight top growth rows</Text>
                      <Text style={styles.insightBody}>• Add a summary tab</Text>
                      <Text style={styles.insightBody}>• Animate KPI cards</Text>
                      <Text style={styles.insightBody}>• Insert forecast chart</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
          {isMobile && (
            <View style={styles.mobileToggle}>
              <Pressable
                style={[
                  styles.mobileToggleButton,
                  viewMode === "chat" && styles.mobileToggleActive
                ]}
                onPress={() => setViewMode("chat")}
              >
                <Text
                  style={[
                    styles.mobileToggleText,
                    viewMode === "chat" && styles.mobileToggleTextActive
                  ]}
                >
                  Chat
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.mobileToggleButton,
                  viewMode === "sheet" && styles.mobileToggleActive
                ]}
                onPress={() => setViewMode("sheet")}
              >
                <Text
                  style={[
                    styles.mobileToggleText,
                    viewMode === "sheet" && styles.mobileToggleTextActive
                  ]}
                >
                  Preview
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    minHeight: "100vh",
    backgroundColor: "#f8fafc"
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  brandLogo: {
    width: 58,
    height: 58
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a"
  },
  brandSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748b"
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  apiKeyCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 240
  },
  apiKeyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6
  },
  apiKeyInput: {
    fontSize: 13,
    color: "#0f172a",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  headerBadges: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center"
  },
  headerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    color: "#15803d",
    fontWeight: "600",
    fontSize: 12
  },
  headerBadgeSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
    color: "#0ea5e9",
    fontWeight: "600",
    fontSize: 12
  },
  centerStage: {
    flex: 1,
    alignItems: "center",
    padding: 32
  },
  heroLogo: {
    width: 210,
    height: 210,
    marginBottom: 16
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center"
  },
  heroBody: {
    marginTop: 12,
    maxWidth: 680,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: "#475569"
  },
  chatInputWrap: {
    marginTop: 24,
    width: "100%",
    maxWidth: 720,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    gap: 12
  },
  chatInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 16,
    color: "#0f172a"
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600"
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
    justifyContent: "center"
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9"
  },
  pillText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "600"
  },
  suggestionBlock: {
    marginTop: 28,
    width: "100%",
    maxWidth: 780
  },
  suggestionRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  suggestionChip: {
    backgroundColor: "#e0f2fe",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  suggestionText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600"
  },
  workspace: {
    flex: 1
  },
  workspaceControls: {
    paddingHorizontal: 32,
    paddingTop: 24
  },
  controlButtons: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap"
  },
  ghostButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    backgroundColor: "#ffffff"
  },
  ghostButtonActive: {
    borderColor: "#0f172a",
    backgroundColor: "#e2e8f0"
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a"
  },
  workspaceBody: {
    flex: 1,
    flexDirection: "row",
    padding: 24,
    gap: 20
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    shadowColor: "#1e293b",
    shadowOpacity: 0.08,
    shadowRadius: 12
  },
  panelSplit: {
    flex: 1
  },
  panelWide: {
    flex: 1.4
  },
  panelNarrow: {
    flex: 0.6
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a"
  },
  chatStream: {
    marginTop: 16,
    flex: 1
  },
  messageBubble: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: "88%"
  },
  messageUser: {
    backgroundColor: "#0f172a",
    alignSelf: "flex-end"
  },
  messageBot: {
    backgroundColor: "#f1f5f9",
    alignSelf: "flex-start"
  },
  messageText: {
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 20
  },
  messageUserText: {
    color: "#ffffff"
  },
  chatComposer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12
  },
  savedBlock: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16
  },
  savedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8
  },
  savedName: {
    fontWeight: "600",
    color: "#0f172a"
  },
  savedMeta: {
    color: "#64748b",
    fontSize: 12
  },
  canvasHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  exportRow: {
    flexDirection: "row",
    gap: 8
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5f5"
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a"
  },
  canvasBody: {
    marginTop: 16,
    flex: 1
  },
  sheetCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a"
  },
  sheetMeta: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12
  },
  table: {
    marginTop: 12
  },
  tableRow: {
    flexDirection: "row"
  },
  tableHeaderRow: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  tableHeaderCell: {
    borderBottomWidth: 0
  },
  tableHeaderText: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: 12
  },
  tableText: {
    color: "#334155",
    fontSize: 12
  },
  insightsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    flexWrap: "wrap"
  },
  insightCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16
  },
  insightTitle: {
    fontWeight: "700",
    color: "#0f172a"
  },
  insightBody: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13
  },
  chartBars: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
    height: 90
  },
  chartBarWrap: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#e2e8f0",
    borderRadius: 12
  },
  chartBar: {
    backgroundColor: "#22c55e",
    borderRadius: 12
  },
  mobileToggle: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 6,
    gap: 8
  },
  mobileToggleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 999
  },
  mobileToggleActive: {
    backgroundColor: "#0f172a"
  },
  mobileToggleText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  mobileToggleTextActive: {
    color: "#ffffff"
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: 14
  }
});

export default App;
