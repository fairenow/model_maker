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
} from "react-native-web";

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

type ChartPayload = {
  title: string;
  labels: string[];
  values: number[];
};

type ReportPayload = {
  message: string;
  spreadsheet: {
    name: string;
    rows: string[][];
  };
  chart: ChartPayload;
  actions: string[];
  report: {
    highlights: string[];
    metrics: { label: string; value: string }[];
  };
  analysis?: {
    overview: string;
    keyPoints: string[];
    structuredPlan: string[];
    opportunities: string[];
    risks: string[];
    dataAttribution: { source: string; notes: string }[];
    confidence: string;
  };
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  "Scrape & attribute open data",
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<"chat" | "sheet">("chat");
  const [expandedPanel, setExpandedPanel] = useState<"split" | "chat" | "sheet">("split");
  const [sheets, setSheets] = useState<Spreadsheet[]>(seedSheets);
  const [apiKey, setApiKey] = useState("");
  const [apiProvider, setApiProvider] = useState<"openai" | "anthropic" | "gemini">("openai");
  const [isSending, setIsSending] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ tone: "error" | "success"; message: string } | null>(
    null
  );
  const [activeSheetId, setActiveSheetId] = useState<string>(seedSheets[0]?.id ?? "");
  const [reportSummary, setReportSummary] = useState<string>("");
  const [reportHighlights, setReportHighlights] = useState<string[]>([]);
  const [reportMetrics, setReportMetrics] = useState<{ label: string; value: string }[]>([]);
  const [analysisLayer, setAnalysisLayer] = useState<ReportPayload["analysis"]>({
    overview: "",
    keyPoints: [],
    structuredPlan: [],
    opportunities: [],
    risks: [],
    dataAttribution: [],
    confidence: ""
  });
  const [aiActions, setAiActions] = useState<string[]>([
    "Highlight top growth rows",
    "Add a summary tab",
    "Animate KPI cards",
    "Insert forecast chart"
  ]);
  const [chartData, setChartData] = useState<ChartPayload>({
    title: "Chart preview",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [72, 88, 56, 80]
  });
  const [scraperEnabled, setScraperEnabled] = useState(true);
  const [scraperStatus, setScraperStatus] = useState<string | null>(null);
  const [activeScrapers, setActiveScrapers] = useState<Record<string, boolean>>({
    jinaReader: true,
    jinaHttps: true,
    jinaDirect: false
  });

  const scraperOptions = [
    {
      id: "jinaReader",
      label: "Jina AI Reader",
      description: "Open-source reader that extracts text + structure.",
      buildUrl: (url: string) => {
        const trimmed = url.replace(/^https?:\/\//, "");
        return `https://r.jina.ai/http://${trimmed}`;
      }
    },
    {
      id: "jinaHttps",
      label: "Jina Reader (HTTPS mode)",
      description: "HTTPS-prefixed extraction for secure sources.",
      buildUrl: (url: string) => {
        const trimmed = url.replace(/^https?:\/\//, "");
        return `https://r.jina.ai/https://${trimmed}`;
      }
    },
    {
      id: "jinaDirect",
      label: "Jina Reader (direct http mode)",
      description: "Raw HTTP reader for legacy or plain HTTP sources.",
      buildUrl: (url: string) => {
        const trimmed = url.replace(/^https?:\/\//, "");
        return `https://r.jina.ai/http://${trimmed}`;
      }
    }
  ];

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedSheets = JSON.parse(stored) as Spreadsheet[];
      setSheets(parsedSheets);
      if (parsedSheets.length > 0) {
        setActiveSheetId(parsedSheets[0].id);
      }
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

  const activeSheetIndex = Math.max(
    0,
    sheets.findIndex((sheet) => sheet.id === activeSheetId)
  );
  const activeSheet = useMemo(
    () => sheets[activeSheetIndex] ?? seedSheets[0],
    [sheets, activeSheetIndex]
  );

  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    setSheets((prev) =>
      prev.map((sheet, index) => {
        if (index !== activeSheetIndex) {
          return sheet;
        }
        const updatedRows = sheet.rows.map((row, currentRowIndex) => {
          if (currentRowIndex !== rowIndex) {
            return row;
          }
          return row.map((cell, currentCellIndex) =>
            currentCellIndex === cellIndex ? value : cell
          );
        });
        return {
          ...sheet,
          rows: updatedRows,
          lastUpdated: "Just now"
        };
      })
    );
  };

  const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const extractJsonBlock = (content: string) => {
    const fencedMatch = content.match(/```json([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }
    const braceMatch = content.match(/\{[\s\S]*\}/);
    return braceMatch ? braceMatch[0] : content.trim();
  };

  const parseAutomationPayload = (content: string): ReportPayload | null => {
    try {
      const jsonPayload = JSON.parse(extractJsonBlock(content)) as ReportPayload;
      if (!jsonPayload?.spreadsheet?.rows?.length) {
        return null;
      }
      return jsonPayload;
    } catch {
      return null;
    }
  };

  const extractUrls = (text: string) => {
    const matches = text.match(/https?:\/\/[^\s)]+/g);
    return matches ? Array.from(new Set(matches)) : [];
  };

  const fetchScrapedContext = async (urls: string[]) => {
    if (!scraperEnabled || urls.length === 0) {
      return "";
    }
    const enabledScrapers = scraperOptions.filter((option) => activeScrapers[option.id]);
    if (enabledScrapers.length === 0) {
      setScraperStatus("Select at least one scraper to gather sources.");
      return "";
    }
    setScraperStatus(`Scraping ${urls.length} url(s) with ${enabledScrapers.length} scrapers...`);
    const results = await Promise.allSettled(
      urls.flatMap((url) =>
        enabledScrapers.map(async (scraper) => {
          const scrapeUrl = scraper.buildUrl(url);
          const response = await fetch(scrapeUrl);
          if (!response.ok) {
            throw new Error(`Scraper request failed (${response.status})`);
          }
          const text = await response.text();
          return `Source: ${url}\nScraper: ${scraper.label}\n${text.slice(0, 2800)}`;
        })
      )
    );
    const fulfilled = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
      .map((result) => result.value);
    if (fulfilled.length === 0) {
      setScraperStatus("Scraper sources failed. Check the URLs and try again.");
      return "";
    }
    setScraperStatus("Scraper sources loaded.");
    return fulfilled.join("\n\n");
  };

  const buildAutomationPrompt = (prompt: string, scrapedContext: string) => `
You are an automation agent that always starts from a spreadsheet. Create data tables, reports, and charts based on the user request.
Return only JSON in the following shape:
{
  "message": "short summary for the user",
  "spreadsheet": {
    "name": "short sheet name",
    "rows": [["Header 1","Header 2"], ["Row1 col1","Row1 col2"]]
  },
  "chart": { "title": "Chart title", "labels": ["Label 1"], "values": [12] },
  "actions": ["Next action 1", "Next action 2"],
  "report": {
    "highlights": ["Insight 1", "Insight 2"],
    "metrics": [{"label": "Metric", "value": "Value"}]
  },
  "analysis": {
    "overview": "Strategic synthesis in 2-3 sentences.",
    "keyPoints": ["Key driver 1", "Key driver 2"],
    "structuredPlan": ["Step 1", "Step 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "risks": ["Risk 1", "Risk 2"],
    "dataAttribution": [{"source": "Source name or URL", "notes": "How it informed the output"}],
    "confidence": "High/Medium/Low with a brief reason"
  }
}
Rules:
- Always include a spreadsheet with 8-12 data rows and clear headers.
- Use realistic, non-generic data. If locations/companies are needed, use real names.
- The chart values must be numeric and correspond to the spreadsheet.
- Keep the summary concise and action-oriented.
- Provide deeper analysis with stronger data points and a strategic, logical structure even when inputs are vague.
- Use an attribution-style audit trail in analysis.dataAttribution that cites sources or states when assumptions were needed.
${scrapedContext ? `\nScraped sources:\n${scrapedContext}` : ""}
User request: ${prompt}
`;

  const toCsv = (rows: string[][]) =>
    rows
      .map((row) =>
        row
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

  const defaultReportSummary =
    "Start from a spreadsheet and we'll generate a report, charts, and export-ready data.";
  const defaultAnalysisOverview =
    "Generate a report to see the strategic synthesis and data attribution layer.";

  const reportSummaryText = reportSummary || defaultReportSummary;
  const analysisOverviewText = analysisLayer?.overview || defaultAnalysisOverview;

  const buildReportLines = () => {
    const lines: string[] = [];
    lines.push("Report summary");
    lines.push(reportSummaryText);
    if (reportHighlights.length > 0) {
      lines.push("Highlights");
      reportHighlights.forEach((item) => {
        lines.push(`• ${item}`);
      });
    }
    if (reportMetrics.length > 0) {
      lines.push("Metrics");
      reportMetrics.forEach((metric) => {
        lines.push(`${metric.label}: ${metric.value}`);
      });
    }
    lines.push("");
    lines.push("Strategic analysis layer");
    lines.push(analysisOverviewText);
    if (analysisKeyPoints.length > 0) {
      lines.push("Key points");
      analysisKeyPoints.forEach((item) => {
        lines.push(`• ${item}`);
      });
    }
    if (analysisStructuredPlan.length > 0) {
      lines.push("Structured plan");
      analysisStructuredPlan.forEach((item) => {
        lines.push(`• ${item}`);
      });
    }
    if (analysisOpportunities.length > 0) {
      lines.push("Opportunities");
      analysisOpportunities.forEach((item) => {
        lines.push(`• ${item}`);
      });
    }
    if (analysisRisks.length > 0) {
      lines.push("Risks");
      analysisRisks.forEach((item) => {
        lines.push(`• ${item}`);
      });
    }
    if (analysisDataAttribution.length > 0) {
      lines.push("Data attribution");
      analysisDataAttribution.forEach((item) => {
        lines.push(`• ${item.source}: ${item.notes}`);
      });
    }
    if (analysisConfidence) {
      lines.push(`Confidence: ${analysisConfidence}`);
    }
    lines.push("");
    lines.push(`${activeSheet.name} (Last updated ${activeSheet.lastUpdated})`);
    activeSheet.rows.forEach((row) => {
      lines.push(row.join(" | "));
    });
    lines.push("");
    lines.push(chartData.title);
    chartData.labels.forEach((label, index) => {
      lines.push(`${label}: ${chartData.values[index] ?? 0}`);
    });
    if (aiActions.length > 0) {
      lines.push("");
      lines.push("AI actions");
      aiActions.forEach((action) => {
        lines.push(`• ${action}`);
      });
    }
    return lines;
  };

  const buildReportCsvRows = () => {
    const rows: string[][] = [];
    rows.push(["Report summary", reportSummaryText]);
    if (reportHighlights.length > 0) {
      rows.push(["Highlights"]);
      reportHighlights.forEach((item) => rows.push([item]));
    }
    if (reportMetrics.length > 0) {
      rows.push(["Metrics"]);
      reportMetrics.forEach((metric) => rows.push([metric.label, metric.value]));
    }
    rows.push([]);
    rows.push(["Strategic analysis layer", analysisOverviewText]);
    if (analysisKeyPoints.length > 0) {
      rows.push(["Key points"]);
      analysisKeyPoints.forEach((item) => rows.push([item]));
    }
    if (analysisStructuredPlan.length > 0) {
      rows.push(["Structured plan"]);
      analysisStructuredPlan.forEach((item) => rows.push([item]));
    }
    if (analysisOpportunities.length > 0) {
      rows.push(["Opportunities"]);
      analysisOpportunities.forEach((item) => rows.push([item]));
    }
    if (analysisRisks.length > 0) {
      rows.push(["Risks"]);
      analysisRisks.forEach((item) => rows.push([item]));
    }
    if (analysisDataAttribution.length > 0) {
      rows.push(["Data attribution"]);
      analysisDataAttribution.forEach((item) =>
        rows.push([`${item.source}: ${item.notes}`])
      );
    }
    if (analysisConfidence) {
      rows.push(["Confidence", analysisConfidence]);
    }
    rows.push([]);
    rows.push([activeSheet.name, `Last updated ${activeSheet.lastUpdated}`]);
    rows.push([]);
    activeSheet.rows.forEach((row) => rows.push([...row]));
    rows.push([]);
    rows.push(["Chart", chartData.title]);
    rows.push(["Label", "Value"]);
    chartData.labels.forEach((label, index) => {
      rows.push([label, `${chartData.values[index] ?? 0}`]);
    });
    if (aiActions.length > 0) {
      rows.push([]);
      rows.push(["AI actions"]);
      aiActions.forEach((action) => rows.push([action]));
    }
    return rows;
  };

  const downloadBlob = (content: BlobPart | Blob, filename: string, type: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csv = toCsv(buildReportCsvRows());
    downloadBlob(csv, `${activeSheet.name.replace(/\s+/g, "-").toLowerCase()}.csv`, "text/csv");
  };

  const escapePdfText = (text: string) =>
    text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const wrapText = (text: string, maxLength: number) => {
    if (!text) {
      return [""];
    }
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length > maxLength) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const buildPdf = (lines: string[]) => {
    const encoder = new TextEncoder();
    const lineHeight = 16;
    const fontSize = 12;
    const margin = 72;
    const pageHeight = 792;
    const maxLineLength = 90;
    const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
    const wrappedLines = lines.flatMap((line) => wrapText(line, maxLineLength));
    const pages: string[][] = [];
    for (let index = 0; index < wrappedLines.length; index += maxLinesPerPage) {
      pages.push(wrappedLines.slice(index, index + maxLinesPerPage));
    }
    if (pages.length === 0) {
      pages.push([""]);
    }
    const pageObjectsStart = 3;
    const fontObjectNumber = pageObjectsStart + pages.length * 2;
    const pageKids = pages
      .map((_, index) => `${pageObjectsStart + index * 2} 0 R`)
      .join(" ");
    const objects: string[] = [];
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    objects.push(
      `2 0 obj\n<< /Type /Pages /Kids [${pageKids}] /Count ${pages.length} >>\nendobj\n`
    );
    pages.forEach((pageLines, index) => {
      const pageObjectNumber = pageObjectsStart + index * 2;
      const contentObjectNumber = pageObjectNumber + 1;
      const contentLines = pageLines.map((line, lineIndex) => {
        const escapedLine = escapePdfText(line);
        const y = pageHeight - margin - lineIndex * lineHeight;
        return `BT /F1 ${fontSize} Tf ${margin} ${y} Td (${escapedLine}) Tj ET`;
      });
      const content = contentLines.join("\n");
      objects.push(
        `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectNumber} 0 R /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> >>\nendobj\n`
      );
      objects.push(
        `${contentObjectNumber} 0 obj\n<< /Length ${
          encoder.encode(content).length
        } >>\nstream\n${content}\nendstream\nendobj\n`
      );
    });
    objects.push(
      `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`
    );
    const header = "%PDF-1.4\n";
    const offsets: number[] = [0];
    let offset = encoder.encode(header).length;
    objects.forEach((obj) => {
      offsets.push(offset);
      offset += encoder.encode(obj).length;
    });
    const xrefStart = offset;
    const xrefEntries = offsets
      .slice(1)
      .map((value) => `${value.toString().padStart(10, "0")} 00000 n \n`)
      .join("");
    const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefEntries}`;
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return new Blob([header, ...objects, xref, trailer], { type: "application/pdf" });
  };

  const handleDownloadPdf = () => {
    const pdf = buildPdf(buildReportLines());
    downloadBlob(pdf, `${activeSheet.name.replace(/\s+/g, "-").toLowerCase()}.pdf`, "application/pdf");
  };

  const buildOpenAiReply = async (prompt: string) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status})`);
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? "No response received.";
  };

  const buildAnthropicReply = async (prompt: string) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 512,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) {
      throw new Error(`Claude request failed (${response.status})`);
    }
    const data = (await response.json()) as {
      content?: { text?: string }[];
    };
    return data.content?.[0]?.text?.trim() ?? "No response received.";
  };

  const buildGeminiReply = async (prompt: string) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      }
    );
    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "No response received.";
  };

  const buildProviderReply = async (prompt: string) => {
    if (apiProvider === "openai") {
      return buildOpenAiReply(prompt);
    }
    if (apiProvider === "anthropic") {
      return buildAnthropicReply(prompt);
    }
    return buildGeminiReply(prompt);
  };

  const providerLabel =
    apiProvider === "openai" ? "OpenAI" : apiProvider === "anthropic" ? "Claude" : "Gemini";

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim()) {
      return;
    }
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: prompt
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setApiStatus(null);
    setScraperStatus(null);
    setAnalysisLayer({
      overview: "",
      keyPoints: [],
      structuredPlan: [],
      opportunities: [],
      risks: [],
      dataAttribution: [],
      confidence: ""
    });
    if (!apiKey) {
      setApiStatus({
        tone: "error",
        message: "Add an API key to send messages to the selected provider."
      });
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: "Add an API key so I can connect to your selected AI provider."
        }
      ]);
      return;
    }
    setIsSending(true);
    try {
      const urls = extractUrls(prompt);
      const scrapedContext = await fetchScrapedContext(urls);
      const automationPrompt = buildAutomationPrompt(prompt, scrapedContext);
      const reply = await buildProviderReply(automationPrompt);
      const payload = parseAutomationPayload(reply);
      if (payload) {
        const newSheet: Spreadsheet = {
          id: `${payload.spreadsheet.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          name: payload.spreadsheet.name,
          lastUpdated: "Just now",
          rows: payload.spreadsheet.rows
        };
        setSheets((prev) => [newSheet, ...prev]);
        setActiveSheetId(newSheet.id);
        setReportSummary(payload.message);
        setReportHighlights(payload.report?.highlights ?? []);
        setReportMetrics(payload.report?.metrics ?? []);
        setAnalysisLayer({
          overview: payload.analysis?.overview ?? "",
          keyPoints: payload.analysis?.keyPoints ?? [],
          structuredPlan: payload.analysis?.structuredPlan ?? [],
          opportunities: payload.analysis?.opportunities ?? [],
          risks: payload.analysis?.risks ?? [],
          dataAttribution: payload.analysis?.dataAttribution ?? [],
          confidence: payload.analysis?.confidence ?? ""
        });
        setAiActions(payload.actions?.length ? payload.actions : aiActions);
        setChartData(payload.chart ?? chartData);
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            content: payload.message
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            content: reply
          }
        ]);
      }
      setApiStatus({
        tone: "success",
        message: `Connected to ${providerLabel}.`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach the AI provider.";
      setApiStatus({
        tone: "error",
        message
      });
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content:
            "I couldn’t reach the selected provider. Double-check the API key, model access, and CORS settings."
        }
      ]);
      setScraperStatus(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartWithPrompt = (prompt: string) => {
    void sendPrompt(prompt);
  };

  const handleSend = () => {
    void sendPrompt(input.trim());
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

  const chartBars = useMemo(() => {
    const maxValue = Math.max(...chartData.values, 1);
    return chartData.values.map((value) =>
      Math.max(16, Math.round((value / maxValue) * 90))
    );
  }, [chartData]);

  const analysisOverview = analysisLayer?.overview ?? "";
  const analysisKeyPoints = analysisLayer?.keyPoints ?? [];
  const analysisStructuredPlan = analysisLayer?.structuredPlan ?? [];
  const analysisOpportunities = analysisLayer?.opportunities ?? [];
  const analysisRisks = analysisLayer?.risks ?? [];
  const analysisDataAttribution = analysisLayer?.dataAttribution ?? [];
  const analysisConfidence = analysisLayer?.confidence ?? "";

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
            <View style={styles.providerRow}>
              {[
                { id: "openai", label: "OpenAI" },
                { id: "anthropic", label: "Claude" },
                { id: "gemini", label: "Gemini" }
              ].map((provider) => (
                <Pressable
                  key={provider.id}
                  style={[
                    styles.providerChip,
                    apiProvider === provider.id && styles.providerChipActive
                  ]}
                  onPress={() =>
                    setApiProvider(provider.id as "openai" | "anthropic" | "gemini")
                  }
                >
                  <Text
                    style={[
                      styles.providerChipText,
                      apiProvider === provider.id && styles.providerChipTextActive
                    ]}
                  >
                    {provider.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.scraperRow}>
              <Text style={styles.scraperLabel}>Open scrapers (multi-source)</Text>
              <Pressable
                style={[
                  styles.scraperToggle,
                  scraperEnabled && styles.scraperToggleActive
                ]}
                onPress={() => setScraperEnabled((prev) => !prev)}
              >
                <Text
                  style={[
                    styles.scraperToggleText,
                    scraperEnabled && styles.scraperToggleTextActive
                  ]}
                >
                  {scraperEnabled ? "On" : "Off"}
                </Text>
              </Pressable>
            </View>
            {apiStatus && (
              <Text
                style={[
                  styles.apiStatus,
                  apiStatus.tone === "error" ? styles.apiStatusError : styles.apiStatusSuccess
                ]}
              >
                {apiStatus.message}
              </Text>
            )}
            {scraperStatus && <Text style={styles.scraperStatus}>{scraperStatus}</Text>}
            <View style={styles.scraperOptions}>
              {scraperOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.scraperChip,
                    activeScrapers[option.id] && styles.scraperChipActive
                  ]}
                  onPress={() =>
                    setActiveScrapers((prev) => ({
                      ...prev,
                      [option.id]: !prev[option.id]
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.scraperChipText,
                      activeScrapers[option.id] && styles.scraperChipTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
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
            Every request starts with a spreadsheet, then expands into reports, charts, and
            export-ready data. Everything stays saved locally on your device, with one-click
            downloads to CSV or PDF.
          </Text>
          <View style={styles.chatInputWrap}>
            <TextInput
              placeholder="Describe the spreadsheet you want..."
              placeholderTextColor="#94a3b8"
              value={input}
              onChangeText={setInput}
              style={styles.chatInput}
              editable={!isSending}
            />
            <Pressable
              style={styles.primaryButton}
              onPress={handleSend}
              disabled={isSending}
            >
              <Text style={styles.primaryButtonText}>
                {isSending ? "Generating..." : "Generate"}
              </Text>
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
                      key={message.id}
                      style={[
                        styles.messageBubble,
                        message.role === "user" ? styles.messageUser : styles.messageBot
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.role === "user" && styles.messageUserText
                        ]}
                      >
                        {message.content}
                      </Text>
                    </View>
                  ))}
                  {isSending && (
                    <View style={[styles.messageBubble, styles.messageBot]}>
                      <Text style={styles.messageText}>Generating a response…</Text>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.chatComposer}>
                  <TextInput
                    placeholder="Ask for updates, formatting, or exports"
                    placeholderTextColor="#94a3b8"
                    value={input}
                    onChangeText={setInput}
                    style={styles.chatInput}
                    editable={!isSending}
                  />
                  <Pressable
                    style={styles.primaryButton}
                    onPress={handleSend}
                    disabled={isSending}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSending ? "Sending..." : "Send"}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.savedBlock}>
                  <Text style={styles.sectionTitle}>Saved locally</Text>
                  {sheets.map((sheet) => (
                    <Pressable
                      key={sheet.id}
                      style={[
                        styles.savedRow,
                        sheet.id === activeSheetId && styles.savedRowActive
                      ]}
                      onPress={() => setActiveSheetId(sheet.id)}
                    >
                      <Text
                        style={[
                          styles.savedName,
                          sheet.id === activeSheetId && styles.savedNameActive
                        ]}
                      >
                        {sheet.name}
                      </Text>
                      <Text style={styles.savedMeta}>{sheet.lastUpdated}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {(!isMobile || viewMode === "sheet") && (
              <View style={[styles.panel, panelStyles.sheet]}>
                <View style={styles.canvasHeader}>
                  <Text style={styles.panelTitle}>Spreadsheet canvas</Text>
                  <View style={styles.exportRow}>
                    <Pressable style={styles.secondaryButton} onPress={handleDownloadCsv}>
                      <Text style={styles.secondaryButtonText}>Download CSV</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={handleDownloadPdf}>
                      <Text style={styles.secondaryButtonText}>Download PDF</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.canvasBody}>
                  <View style={styles.reportCard}>
                    <Text style={styles.reportTitle}>Report summary</Text>
                    <Text style={styles.reportBody}>{reportSummaryText}</Text>
                    {reportHighlights.length > 0 && (
                      <View style={styles.reportHighlights}>
                        {reportHighlights.map((item, index) => (
                          <View key={`highlight-${index}`} style={styles.highlightChip}>
                            <Text style={styles.highlightText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {reportMetrics.length > 0 && (
                      <View style={styles.metricRow}>
                        {reportMetrics.map((metric) => (
                          <View key={metric.label} style={styles.metricCard}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricValue}>{metric.value}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.reportCard}>
                    <Text style={styles.reportTitle}>Strategic analysis layer</Text>
                    <Text style={styles.reportBody}>{analysisOverviewText}</Text>
                    {analysisKeyPoints.length > 0 && (
                      <View style={styles.reportHighlights}>
                        {analysisKeyPoints.map((item, index) => (
                          <View key={`analysis-key-${index}`} style={styles.highlightChip}>
                            <Text style={styles.highlightText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {analysisStructuredPlan.length > 0 && (
                      <View style={styles.analysisList}>
                        {analysisStructuredPlan.map((item) => (
                          <Text key={item} style={styles.analysisItem}>
                            • {item}
                          </Text>
                        ))}
                      </View>
                    )}
                    {(analysisOpportunities.length > 0 || analysisRisks.length > 0) && (
                      <View style={styles.analysisSplit}>
                        <View style={styles.analysisColumn}>
                          <Text style={styles.analysisTitle}>Opportunities</Text>
                          {analysisOpportunities.map((item) => (
                            <Text key={item} style={styles.analysisItem}>
                              • {item}
                            </Text>
                          ))}
                        </View>
                        <View style={styles.analysisColumn}>
                          <Text style={styles.analysisTitle}>Risks</Text>
                          {analysisRisks.map((item) => (
                            <Text key={item} style={styles.analysisItem}>
                              • {item}
                            </Text>
                          ))}
                        </View>
                      </View>
                    )}
                    {analysisDataAttribution.length > 0 && (
                      <View style={styles.analysisList}>
                        <Text style={styles.analysisTitle}>Data attribution</Text>
                        {analysisDataAttribution.map((item, index) => (
                          <Text key={`attrib-${index}`} style={styles.analysisItem}>
                            • {item.source}: {item.notes}
                          </Text>
                        ))}
                      </View>
                    )}
                    {analysisConfidence && (
                      <Text style={styles.analysisConfidence}>
                        Confidence: {analysisConfidence}
                      </Text>
                    )}
                  </View>
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
                              <TextInput
                                value={cell}
                                onChangeText={(value: string) =>
                                  handleCellChange(rowIndex, cellIndex, value)
                                }
                                style={[
                                  styles.tableInput,
                                  rowIndex === 0 && styles.tableHeaderText,
                                  rowIndex !== 0 && styles.tableText
                                ]}
                                placeholderTextColor="#94a3b8"
                              />
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.insightsRow}>
                    <View style={styles.insightCard}>
                      <Text style={styles.insightTitle}>{chartData.title}</Text>
                      <Text style={styles.insightBody}>
                        Auto-generated chart mapped to your spreadsheet.
                      </Text>
                      <View style={styles.chartBars}>
                        {chartBars.map((value, index) => (
                          <View key={`bar-${index}`} style={styles.chartBarWrap}>
                            <View style={[styles.chartBar, { height: value }]} />
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.insightCard}>
                      <Text style={styles.insightTitle}>AI actions</Text>
                      {aiActions.map((action) => (
                        <Text key={action} style={styles.insightBody}>
                          • {action}
                        </Text>
                      ))}
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
  providerRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  scraperRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  scraperLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569"
  },
  scraperToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    backgroundColor: "#ffffff"
  },
  scraperToggleActive: {
    borderColor: "#0f172a",
    backgroundColor: "#0f172a"
  },
  scraperToggleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a"
  },
  scraperToggleTextActive: {
    color: "#ffffff"
  },
  providerChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ffffff"
  },
  providerChipActive: {
    borderColor: "#0f172a",
    backgroundColor: "#0f172a"
  },
  providerChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0f172a"
  },
  providerChipTextActive: {
    color: "#ffffff"
  },
  apiStatus: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600"
  },
  apiStatusError: {
    color: "#dc2626"
  },
  apiStatusSuccess: {
    color: "#15803d"
  },
  scraperStatus: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#0ea5e9"
  },
  scraperOptions: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  scraperChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#ffffff"
  },
  scraperChipActive: {
    borderColor: "#0f172a",
    backgroundColor: "#0f172a"
  },
  scraperChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0f172a"
  },
  scraperChipTextActive: {
    color: "#ffffff"
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
  savedRowActive: {
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 8
  },
  savedName: {
    fontWeight: "600",
    color: "#0f172a"
  },
  savedNameActive: {
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
  reportCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 16
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a"
  },
  reportBody: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13,
    lineHeight: 19
  },
  reportHighlights: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  analysisList: {
    marginTop: 12
  },
  analysisItem: {
    marginTop: 4,
    color: "#475569",
    fontSize: 12,
    lineHeight: 18
  },
  analysisSplit: {
    marginTop: 12,
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap"
  },
  analysisColumn: {
    flex: 1,
    minWidth: 180
  },
  analysisTitle: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: 12
  },
  analysisConfidence: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a"
  },
  highlightChip: {
    backgroundColor: "#e0f2fe",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  highlightText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0f172a"
  },
  metricRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b"
  },
  metricValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a"
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
  tableInput: {
    width: "100%",
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    borderWidth: 0
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
