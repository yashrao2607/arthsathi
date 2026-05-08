"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Shield,
  Send,
  Bot,
  User,
  Globe,
  ChevronRight,
  Sparkles,
  Cpu,
  Lock,
  RefreshCw,
  PanelRightOpen,
  PanelRightClose,
  IndianRupee,
  TrendingUp,
  Landmark,
  FileText,
  Trash2,
  Clock,
  Zap,
  WifiOff,
  MessageSquare,
  BarChart3,
  PiggyBank,
  Scale,
  Sun,
  Moon,
  Calculator,
  Copy,
  Volume2,
  Download,
  ChevronDown,
  Home as HomeIcon,
  Car,
  GraduationCap,
  Wallet,
  Check,
  Mic,
  Percent,
  HeartPulse,
  TrendingDown,
  Activity,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Printer,
  Brain,
  BarChart2,
  Bookmark,
  Target,
  BookOpen,
  Users,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useChatStore } from "@/store/chat-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ReferenceLine,
} from "recharts";

// ---------------------------------------------------------------------------
// Indian number formatter
// ---------------------------------------------------------------------------
const inr = new Intl.NumberFormat("en-IN");
const fmtINR = (n: number) => `₹${inr.format(n)}`;

// ---------------------------------------------------------------------------
// Sample queries (embedded for immediate availability)
// ---------------------------------------------------------------------------
const SAMPLE_QUERIES = [
  {
    id: 1,
    hindi: "FD की ब्याज दरें क्या हैं?",
    english: "What are current FD interest rates?",
    category: "Fixed Deposits",
    icon: Landmark,
  },
  {
    id: 2,
    hindi: "सेविंग्स अकाउंट में कितना ब्याज मिलता है?",
    english: "How much interest do savings accounts give?",
    category: "Savings",
    icon: PiggyBank,
  },
  {
    id: 3,
    hindi: "टैक्स बचाने के लिए सबसे अच्छी स्कीम कौन सी है?",
    english: "Which is the best tax-saving scheme?",
    category: "Tax Saving",
    icon: Scale,
  },
  {
    id: 4,
    hindi: "PPF में निवेश करने के क्या फायदे हैं?",
    english: "What are the benefits of investing in PPF?",
    category: "Investment",
    icon: TrendingUp,
  },
  {
    id: 5,
    hindi: "होम लोन का EMI कैसे कम करें?",
    english: "How to reduce home loan EMI?",
    category: "Loans",
    icon: IndianRupee,
  },
  {
    id: 6,
    hindi: "सीनियर सिटीजन के लिए कौन सी योजना सबसे अच्छी है?",
    english: "Which scheme is best for senior citizens?",
    category: "Senior Citizens",
    icon: Shield,
  },
  {
    id: 7,
    hindi: "म्यूचुअल फंड और FD में क्या अंतर है?",
    english: "What is the difference between mutual fund and FD?",
    category: "Comparison",
    icon: BarChart3,
  },
  {
    id: 8,
    hindi: "सेक्शन 80C के तहत कौन से निवेश आते हैं?",
    english: "Which investments fall under Section 80C?",
    category: "Tax Saving",
    icon: FileText,
  },
  {
    id: 9,
    hindi: "सुकन्या समृद्धि योजना के फायदे बताएं?",
    english: "Tell me about Sukanya Samriddhi Yojana benefits?",
    category: "Govt Schemes",
    icon: Sparkles,
  },
  {
    id: 10,
    hindi: "नई टैक्स रेजिम में क्या बदलाव हुए हैं?",
    english: "What changes have been made in the new tax regime?",
    category: "Tax",
    icon: FileText,
  },
];

// ---------------------------------------------------------------------------
// Quick reference data
// ---------------------------------------------------------------------------
const FD_QUICK_RATES = [
  { bank: "SBI", rate: "6.80%", senior: "7.30%", rateNum: 6.8, seniorNum: 7.3 },
  { bank: "HDFC", rate: "7.10%", senior: "7.60%", rateNum: 7.1, seniorNum: 7.6 },
  { bank: "ICICI", rate: "7.00%", senior: "7.50%", rateNum: 7.0, seniorNum: 7.5 },
  { bank: "PNB", rate: "6.80%", senior: "7.30%", rateNum: 6.8, seniorNum: 7.3 },
  { bank: "BOB", rate: "7.15%", senior: "7.65%", rateNum: 7.15, seniorNum: 7.65 },
];

const TAX_SLABS_NEW = [
  { range: "Up to ₹3L", rate: "Nil" },
  { range: "₹3L - ₹7L", rate: "5%" },
  { range: "₹7L - ₹10L", rate: "10%" },
  { range: "₹10L - ₹12L", rate: "15%" },
  { range: "₹12L - ₹15L", rate: "20%" },
  { range: "Above ₹15L", rate: "30%" },
];

const SCHEMES_QUICK = [
  { name: "PPF", rate: "7.1%", tenure: "15 yrs", tax: "EEE" },
  { name: "SSY", rate: "8.2%", tenure: "21 yrs", tax: "EEE" },
  { name: "SCSS", rate: "8.2%", tenure: "5 yrs", tax: "80C" },
  { name: "NSC", rate: "7.7%", tenure: "5 yrs", tax: "80C" },
  { name: "NPS", rate: "9-12%", tenure: "Till 60", tax: "80CCD" },
  { name: "KVP", rate: "7.5%", tenure: "9.7 yrs", tax: "None" },
];

// ---------------------------------------------------------------------------
// Category color map
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, string> = {
  "Fixed Deposits": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Savings: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Tax Saving": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  Investment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Loans: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Senior Citizens": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Comparison: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "Govt Schemes": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  Tax: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

// ---------------------------------------------------------------------------
// EMI/Tax result types
// ---------------------------------------------------------------------------
interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  breakdown: { month: number; emi: number; principal: number; interest: number; balance: number }[];
  truncated: boolean;
  schedule: { year: number; principalPaid: number; interestPaid: number; closingBalance: number }[];
  benchmarks: Record<string, { typicalRate: string; typicalTenure: string; description: string }>;
}

interface TaxRegimeResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxSlabs: { range: string; rate: number; incomeInSlab: number; tax: number }[];
  taxBeforeCess: number;
  cess: number;
  surcharge: number;
  totalTax: number;
  effectiveRate: number;
}

interface TaxResult {
  oldRegime?: TaxRegimeResult;
  newRegime?: TaxRegimeResult;
  comparison?: {
    savingsFromNewRegime: number;
    recommendation: "old" | "new";
    recommendationReason: string;
  };
}

// ---------------------------------------------------------------------------
// SIP result types
// ---------------------------------------------------------------------------
interface SipResult {
  totalValue: number;
  totalInvested: number;
  wealthGenerated: number;
  yearlyBreakdown: {
    year: number;
    investedSoFar: number;
    valueAtYearEnd: number;
    gainsSoFar: number;
  }[];
  benchmarkComparison: {
    name: string;
    rate: number;
    totalValue: number;
    totalInvested: number;
    wealthGenerated: number;
  }[];
}

// ---------------------------------------------------------------------------
// Compound Interest result types
// ---------------------------------------------------------------------------
interface CompoundInterestResult {
  principal: number;
  totalContributions: number;
  totalInterest: number;
  maturityAmount: number;
  effectiveRate: number;
  yearWiseBreakdown: { year: number; openingBalance: number; interestEarned: number; contributions: number; closingBalance: number }[];
  comparisonWithSimpleInterest: { simpleInterestAmount: number; difference: number };
}

// ---------------------------------------------------------------------------
// Retirement Calculator result types
// ---------------------------------------------------------------------------
interface RetirementResult {
  corpusNeeded: number;
  inflatedMonthlyExpenses: number;
  totalAccumulated: number;
  shortfall: number;
  additionalMonthlyNeeded: number;
  yearsToRetire: number;
  yearlyProjection: { year: number; age: number; contribution: number; returns: number; totalCorpus: number }[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Inflation Calculator result types
// ---------------------------------------------------------------------------
interface InflationResult {
  futureCost: number;
  purchasingPowerLoss: number;
  purchasingPowerRetained: number;
  yearlyBreakdown: { year: number; inflatedCost: number; purchasingPower: number; cumulativeLoss: number }[];
  practicalComparisons: { item: string; currentCost: string; futureCost: string }[];
  categorySpecificTips: string[];
  requiredReturnToBeatInflation?: number;
}

// ---------------------------------------------------------------------------
// Language to Speech lang code map
// ---------------------------------------------------------------------------
const LANG_TO_SPEECH: Record<string, string> = {
  hi: "hi-IN",
  ta: "ta-IN",
  bn: "bn-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  en: "en-IN",
};

// ---------------------------------------------------------------------------
// useIsDesktop hook — stable viewport check (avoids Dialog unmount on re-render)
// ---------------------------------------------------------------------------
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768;
  });
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

// ---------------------------------------------------------------------------
// Financial content processor — wraps financial data in styled cards
// ---------------------------------------------------------------------------
const FINANCIAL_PATTERNS = [
  /(?:FD|Fixed Deposit|फिक्स्ड डिपॉजिट|एफडी)[\s\S]*?(?:रेट|Rate|ब्याज)[:\s]*\d+\.?\d*%/i,
  /(?:Tax Slab|टैक्स स्लैब|कर स्लैब|Income Tax)[\s\S]*?(?:₹|रुपये|%\d)/i,
  /(?:PPF|Public Provident|सार्वजनिक भविष्य निर्वाह)[\s\S]*?(?:Rate|रेट|ब्याज)[:\s]*\d+\.?\d*%/i,
  /(?:SIP|Systematic Investment)[\s\S]*?(?:Return|रिटर्न|रेट)[:\s]*\d+\.?\d*%/i,
  /(?:Savings Account|बचत खाता)[\s\S]*?(?:Rate|रेट|ब्याज)[:\s]*\d+\.?\d*%/i,
  /(?:Senior Citizen|सीनियर सिटीजन)[\s\S]*?(?:Rate|रेट|ब्याज)[:\s]*\d+\.?\d*%/i,
];

function processFinancialContent(content: string): string {
  // Check if content matches any financial pattern
  const hasFinancialData = FINANCIAL_PATTERNS.some((p) => p.test(content));
  if (!hasFinancialData) return content;

  // Process markdown tables: wrap them in fin-card divs
  const tableRegex = /(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)*)/g;
  let processed = content.replace(tableRegex, (match) => {
    const lines = match.trim().split("\n");
    // Extract header text from first line
    const headerLine = lines[0];
    const headerText = headerLine
      .split("|")
      .filter((c) => c.trim())
      .join(" / ")
      .trim();
    return `<div class="fin-card"><div class="fin-card-header">📊 ${headerText}</div><div class="fin-card-body">\n\n${match}\n\n</div></div>`;
  });

  return processed;
}

// ---------------------------------------------------------------------------
// ChatMessage Component (Enhanced with Copy, Speak, Timestamp, gradient border)
// ---------------------------------------------------------------------------
function ChatMessage({
  message,
  language,
  reaction,
  onReaction,
  searchQuery,
  bookmarked,
  onToggleBookmark,
}: {
  message: {
    id?: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: number;
    processingTime?: number;
    model?: string;
    language?: string;
  };
  language: string;
  reaction?: "up" | "down" | null;
  onReaction?: (id: string, reaction: "up" | "down" | null) => void;
  searchQuery?: string;
  bookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message.content);
    const speechLang = LANG_TO_SPEECH[language] || LANG_TO_SPEECH[message.language || "hi"] || "hi-IN";
    utterance.lang = speechLang;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [message.content, message.language, language, speaking]);

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 30 : -30, y: 5 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={`group max-w-[80%] rounded-2xl px-4 py-3 transition-shadow duration-200 relative ${isUser
            ? "bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-br-md hover:shadow-md user-msg-pattern"
            : "assistant-bubble bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md border-l-[3px] border-l-emerald-400 dark:border-l-emerald-600 hover:shadow-md"
          }`}
      >
        {/* AI Watermark for assistant messages */}
        {!isUser && <span className="ai-watermark">AI</span>}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-base [&>h2]:text-base [&>h3]:text-sm [&>strong]:text-emerald-700 dark:[&>strong]:text-emerald-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{processFinancialContent(message.content)}</ReactMarkdown>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="ai-badge inline-block">AI</span>
              {message.model && (
                <span className="model-badge text-[8px] py-0 px-1.5"><Cpu className="w-2.5 h-2.5" /> {message.model}</span>
              )}
              <span className={`confidence-dot ${message.processingTime && message.processingTime < 30000 ? "confidence-high" : "confidence-medium"}`} title={message.processingTime && message.processingTime < 30000 ? "High confidence" : "Medium confidence"} />
            </div>
          </div>
        )}

        {/* Timestamp */}
        {timeStr && (
          <p className={`text-[10px] mt-1 ${isUser ? "text-emerald-200" : "text-slate-400 dark:text-slate-500"}`}>
            {timeStr}
          </p>
        )}

        {/* Metadata & actions for assistant messages */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap">
            {message.processingTime && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 border-r border-slate-200/60 dark:border-slate-700/60 pr-1.5">
                <Clock className="w-3 h-3" />
                {message.processingTime}ms
              </span>
            )}
            {message.language && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 border-r border-slate-200/60 dark:border-slate-700/60 pr-1.5">
                <Globe className="w-3 h-3" />
                {message.language}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-slate-400 pr-1.5">
              <Lock className="w-3 h-3" />
              On-device
            </span>
            <span className="ml-auto flex items-center gap-0.5">
              {/* Bookmark */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${bookmarked ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"}`}
                    onClick={() => {
                      if (message.id && onToggleBookmark) {
                        onToggleBookmark(message.id);
                      }
                    }}
                    aria-label={bookmarked ? "Remove bookmark" : "Bookmark message"}
                  >
                    <Bookmark className={`w-3 h-3 ${bookmarked ? "fill-current" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{bookmarked ? "Bookmarked" : "Bookmark"}</TooltipContent>
              </Tooltip>
              {/* Thumbs Up */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${reaction === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"}`}
                    onClick={() => {
                      if (message.id && onReaction) {
                        onReaction(message.id, reaction === "up" ? null : "up");
                      }
                    }}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Helpful</TooltipContent>
              </Tooltip>
              {/* Thumbs Down */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${reaction === "down" ? "text-rose-600 dark:text-rose-400" : "text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"}`}
                    onClick={() => {
                      if (message.id && onReaction) {
                        onReaction(message.id, reaction === "down" ? null : "down");
                      }
                    }}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Not helpful</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? "Copied!" : "Copy message"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${speaking ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"}`}
                    onClick={handleSpeak}
                  >
                    <Volume2 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{speaking ? "Stop speaking" : "Read aloud"}</TooltipContent>
              </Tooltip>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// TypingIndicator Component
// ---------------------------------------------------------------------------
const THINKING_TEXT: Record<string, string> = {
  hi: "सोच रहा है...",
  ta: "யோசிக்கிறது...",
  bn: "ভাবছে...",
  te: "ఆలోచిస్తోంది...",
  mr: "विचार करत आहे...",
  gu: "વિચારી રહ્યું છે...",
  kn: "ಯೋಚಿಸುತ್ತಿದೆ...",
  en: "Thinking...",
};

const LOADING_STAGES: Record<string, string[]> = {
  hi: ["वित्तीय डेटा का विश्लेषण कर रहा है...", "हिंदी में उत्तर तैयार कर रहा है...", "लगभग हो गया..."],
  ta: ["நிதி தரவை பகுப்பாய்வு செய்கிறது...", "பதில் தயாராகிறது...", "ஏற்கனவே முடிந்தது..."],
  bn: ["আর্থিক ডেটা বিশ্লেষণ করছে...", "উত্তর প্রস্তুত করছে...", "প্রায় শেষ..."],
  te: ["ఆర్థిక డేటాను విశ్లేషిస్తోంది...", "సమాధానం సిద్ధమవుతోంది...", "దాదాపు అయిపోయింది..."],
  mr: ["आर्थिक डेटा विश्लेषण करत आहे...", "उत्तर तयार करत आहे...", "जवळपास झाले..."],
  gu: ["નાણાકીય ડેટાનું વિશ્લેષણ કરે છે...", "જવાબ તૈયાર કરે છે...", "લગભગ થઈ ગયું..."],
  kn: ["ಹಣಕಾಸು ಡೇಟಾವನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...", "ಉತ್ತರ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...", "ಸುಮಾರು ಮುಗಿಯಿತು..."],
  en: ["Analyzing financial data...", "Preparing response...", "Almost done..."],
};

function TypingIndicator({ language = "hi" }: { language?: string }) {
  const stages = LOADING_STAGES[language] || LOADING_STAGES.hi;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(timer);
  }, [stages.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 min-w-[200px]">
        <div className="flex items-center gap-1.5">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xs text-emerald-600 dark:text-emerald-400 mr-2 font-medium"
          >
            ArthSathi
          </motion.span>
          <AnimatePresence mode="wait">
            <motion.span
              key={stageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-slate-500 dark:text-slate-400 mr-2"
            >
              {stages[stageIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Progress-like animation (3 stages) */}
        <div className="flex items-center gap-1 mt-2">
          {stages.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${i <= stageIndex
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : "bg-slate-200 dark:bg-slate-700"
                }`}
              style={{ flex: i <= stageIndex ? 2 : 1 }}
            />
          ))}
        </div>
        {/* Skeleton lines */}
        <div className="mt-3 space-y-2">
          <div className="msg-skeleton h-3 w-full" />
          <div className="msg-skeleton h-3 w-4/5" />
          <div className="msg-skeleton h-3 w-3/5" />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Rotating Financial Tips Banner
// ---------------------------------------------------------------------------
const FINANCIAL_TIPS = [
  "PPF में ₹1.5L/yr निवेश पर 15 साल में ₹40L+ | Invest ₹1.5L/yr in PPF for ₹40L+ in 15 years",
  "NPS 80CCD(1B) से अतिरिक्त ₹50,000 टैक्स बचत | Save extra ₹50K tax under NPS 80CCD(1B)",
  "FD से SIP बेहतर? लंबी अवधि में इक्विटी SIP 12%+ रिटर्न | SIP may outperform FD long-term",
  "टर्म इंश्योरेंस सबसे सस्ता जीवन बीमा | Term insurance is the cheapest life cover",
  "इमरजेंसी फंड = 6 महीने का खर्चा | Emergency fund = 6 months of expenses",
];

function FinancialTipsBanner() {
  const [tipIndex, setTipIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % FINANCIAL_TIPS.length);
        setFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 text-white py-1.5 px-4 overflow-hidden">
      <p
        className={`text-[11px] text-center transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}
        style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {FINANCIAL_TIPS[tipIndex]}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome Screen (with all 10 queries in 2-col grid + Indian pattern watermark)
// ---------------------------------------------------------------------------
function AnimatedCounter({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(target / 20));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { start = target; clearInterval(timer); }
      setCount(start);
    }, 50);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{count}{suffix}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function WelcomeScreen({ onQueryClick }: { onQueryClick: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-8 px-4 relative noise-bg animated-bg-gradient"
    >
      {/* Decorative Indian pattern watermark with mandala/rangoli */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.02]">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 via-transparent to-teal-100/40 dark:from-emerald-900/20 dark:via-transparent dark:to-teal-900/20" />
        <div className="absolute top-10 left-10 w-40 h-40 border-2 border-emerald-600 rounded-full" />
        <div className="absolute top-20 left-20 w-40 h-40 border-2 border-emerald-600 rounded-full" />
        <div className="absolute bottom-20 right-10 w-32 h-32 border-2 border-teal-600 rotate-45" />
        <div className="absolute bottom-10 right-20 w-32 h-32 border-2 border-teal-600 rotate-45" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500 rounded-3xl rotate-12" />
        <div className="absolute top-1/3 right-1/4 w-20 h-20 border border-amber-500 rounded-full" />
        <svg className="absolute top-5 right-10 w-24 h-24 text-emerald-600" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-80 h-80 text-emerald-500" viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="200" cy="200" r="90" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="200" cy="200" r="60" fill="none" stroke="currentColor" strokeWidth="0.2" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <ellipse key={angle} cx="200" cy="60" rx="18" ry="50" fill="none" stroke="currentColor" strokeWidth="0.3" transform={`rotate(${angle} 200 200)`} />
          ))}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <ellipse key={`inner-${angle}`} cx="200" cy="120" rx="12" ry="35" fill="none" stroke="currentColor" strokeWidth="0.2" transform={`rotate(${angle} 200 200)`} />
          ))}
          {[0, 45, 90, 135].map((angle) => (
            <line key={`line-${angle}`} x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="0.2" transform={`rotate(${angle} 200 200)`} />
          ))}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <circle key={`dot-${angle}`} cx="200" cy="50" r="3" fill="currentColor" transform={`rotate(${angle} 200 200)`} />
          ))}
        </svg>
      </div>

      {/* Logo & Title */}
      <div className="text-center mb-4 relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 animate-logo-glow"
        >
          <span className="text-3xl font-bold text-white">अ</span>
        </motion.div>
        <h1 className="text-2xl font-bold gradient-text">
          अर्थसाथी
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          ArthSathi — Your On-Device Financial Companion
        </p>
        <p className="text-xs text-emerald-600/60 dark:text-emerald-400/50 mt-0.5 font-medium">
          <span className="typing-effect">भारत का अपना वित्तीय साथी</span>
        </p>
        <Badge
          variant="secondary"
          className="mt-2 text-[9px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
        >
          <Cpu className="w-2.5 h-2.5 mr-1" />
          Powered by Qwen3-4B (Fine-tuned)
        </Badge>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 transition-transform hover:scale-105"
          >
            <Shield className="w-3 h-3 mr-1" />
            Privacy-First
          </Badge>
          <Badge
            variant="secondary"
            className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800 transition-transform hover:scale-105"
          >
            <Cpu className="w-3 h-3 mr-1" />
            On-Device AI
          </Badge>
          <Badge
            variant="secondary"
            className="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800 transition-transform hover:scale-105"
          >
            <Globe className="w-3 h-3 mr-1" />
            Vernacular
          </Badge>
        </div>
        {/* Model Badge Row */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="model-badge"><Cpu className="w-3 h-3" /> Qwen3-4B</span>
          <span className="model-badge" style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}><FileText className="w-3 h-3" /> FinanceParam 50K+</span>
          <span className="model-badge" style={{ background: "linear-gradient(135deg, #d97706, #ea580c)" }}><BarChart2 className="w-3 h-3" /> BhashaBench 86.4%</span>
        </div>
      </div>

      {/* Animated stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-6 mb-5 relative z-10 py-2 px-6 rounded-xl bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
      >
        <AnimatedCounter target={8} label="भाषाएं / Languages" suffix="+" />
        <Separator orientation="vertical" className="h-8" />
        <AnimatedCounter target={7} label="Calculators" />
        <Separator orientation="vertical" className="h-8" />
        <AnimatedCounter target={10} label="Queries" suffix="+" />
        <Separator orientation="vertical" className="h-8" />
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300"><Shield className="w-5 h-5 inline" /></p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Privacy-First</p>
        </div>
      </motion.div>

      {/* Feature cards with hover lift + glow + gradient border */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mb-5 relative z-10">
        {[
          {
            icon: Lock,
            title: "No PII to Cloud",
            desc: "All processing stays on your device. Zero data leaks.",
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            hoverGlow: "hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30",
          },
          {
            icon: Globe,
            title: "भारतीय भाषाएं",
            desc: "Hindi, Tamil, Bengali, Telugu & 4 more",
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            hoverGlow: "hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30",
          },
          {
            icon: TrendingUp,
            title: "Indian Finance",
            desc: "FD, PPF, Tax, Schemes, Loans — all covered",
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-900/20",
            hoverGlow: "hover:shadow-rose-200/50 dark:hover:shadow-rose-900/30",
          },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`feature-card-gradient hover-lift ${feature.bg} rounded-xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feature.hoverGlow}`}
          >
            <feature.icon className={`w-8 h-8 mx-auto mb-3 ${feature.color}`} />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {feature.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Wave divider between hero and queries */}
      <div className="wave-divider w-full max-w-3xl relative z-10 mb-2">
        <svg viewBox="0 0 1200 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,15 C150,30 350,0 500,15 C650,30 850,0 1000,15 C1100,25 1150,20 1200,15 L1200,30 L0,30 Z" fill="currentColor" className="text-emerald-50/50 dark:text-emerald-900/10" />
          <path d="M0,20 C200,5 400,30 600,15 C800,0 1000,25 1200,20 L1200,30 L0,30 Z" fill="currentColor" className="text-emerald-100/30 dark:text-emerald-900/5" />
        </svg>
      </div>

      {/* ALL 10 Quick start queries in 2-column grid */}
      <div className="w-full max-w-3xl relative z-10">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 text-center">
          Try a sample query to get started →
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_QUERIES.map((q) => {
            const IconComp = q.icon;
            return (
              <motion.button
                key={q.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQueryClick(q.hindi)}
                className="query-btn-border hover-lift flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10 transition-all text-left group min-h-[48px]"
              >
                <IconComp className="w-4 h-4 text-emerald-500 flex-shrink-0 group-hover:text-emerald-600 transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900 dark:text-slate-100 leading-snug truncate">
                    {q.hindi}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{q.english}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[8px] px-1 py-0 h-4 flex-shrink-0 hidden sm:flex ${CATEGORY_COLORS[q.category] || "bg-slate-100 text-slate-600"
                    }`}
                >
                  {q.category}
                </Badge>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Powered by dataset badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-3 mt-4 relative z-10"
      >
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Powered by</span>
        <Badge className="text-[8px] bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover-lift">
          <FileText className="w-2.5 h-2.5 mr-1" />
          FinanceParam 50K+
        </Badge>
        <Badge className="text-[8px] bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 hover-lift">
          <BarChart2 className="w-2.5 h-2.5 mr-1" />
          finance-alpaca 25K+
        </Badge>
        <Badge className="text-[8px] bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover-lift">
          <Globe className="w-2.5 h-2.5 mr-1" />
          BhashaBench 86.4%
        </Badge>
      </motion.div>

      {/* Scroll down indicator */}
      <div className="mt-6 text-center relative z-10 scroll-indicator">
        <ChevronDown className="w-5 h-5 text-emerald-400/60 dark:text-emerald-500/40 mx-auto" />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Content — Sample Queries
// ---------------------------------------------------------------------------
function SampleQueriesPanel({ onQueryClick }: { onQueryClick: (q: string) => void }) {
  return (
    <div className="space-y-2">
      {SAMPLE_QUERIES.map((q) => {
        const IconComp = q.icon;
        return (
          <motion.button
            key={q.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onQueryClick(q.hindi)}
            className="w-full hover-lift flex items-start gap-2.5 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm hover:border-l-2 hover:border-l-emerald-400 transition-all text-left group min-h-[48px]"
          >
            <IconComp className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0 group-hover:text-emerald-600 transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 dark:text-slate-100 leading-snug">
                {q.hindi}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {q.english}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`text-[9px] px-1.5 py-0 h-5 flex-shrink-0 ${CATEGORY_COLORS[q.category] || "bg-slate-100 text-slate-600"
                }`}
            >
              {q.category}
            </Badge>
          </motion.button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Content — FD Rates (with horizontal bar chart)
// ---------------------------------------------------------------------------
function ModelTabPanel({ onBenchmarkClick }: { onBenchmarkClick?: () => void }) {
  // Mini radar chart data for model capabilities
  const radarData = [
    { subject: "Banking", score: 89.2 },
    { subject: "Tax", score: 87.5 },
    { subject: "Invest", score: 85.8 },
    { subject: "Insurance", score: 84.1 },
    { subject: "Govt", score: 88.7 },
    { subject: "Loans", score: 83.9 },
    { subject: "Regulatory", score: 82.3 },
  ];

  return (
    <div className="space-y-3">
      {/* Model name and version */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Qwen3-4B</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400">Fine-tuned for Indian Finance</p>
        </div>
        <span className="model-badge text-[8px] ml-auto"><Cpu className="w-2.5 h-2.5" /> 4B</span>
      </div>

      {/* Mini Radar Chart */}
      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-200/50 dark:border-slate-700/50">
        <p className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 mb-1 text-center">Model Capabilities</p>
        <ResponsiveContainer width="100%" height={160}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
            <PolarGrid strokeDasharray="2 2" stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fill: "#94a3b8" }} />
            <PolarRadiusAxis angle={30} domain={[70, 95]} tick={false} axisLine={false} />
            <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={1.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <Separator />

      {/* Fine-tuning dataset badges */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Training Data</p>
        <Badge className="text-[8px] bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 border-teal-200 dark:border-teal-800 mr-1">
          <FileText className="w-2.5 h-2.5 mr-1" />
          FinanceParam • 50K+
        </Badge>
        <Badge className="text-[8px] bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800">
          <FileText className="w-2.5 h-2.5 mr-1" />
          finance-alpaca • 25K+
        </Badge>
      </div>

      <Separator />

      {/* Benchmark scores as progress bars with gradient fills */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">BhashaBench Top Languages</p>
        {[
          { lang: "English", score: 94.2 },
          { lang: "Hindi", score: 92.4 },
          { lang: "Tamil", score: 87.1 },
        ].map((item) => (
          <div key={item.lang} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 w-14">{item.lang}</span>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="score-bar"
                style={{ width: `${item.score}%` }}
              />
            </div>
            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">{item.score}%</span>
          </div>
        ))}
        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Overall: 86.4% across 8 languages</p>
      </div>

      <Separator />

      {/* View Full Benchmarks link */}
      {onBenchmarkClick && (
        <button
          onClick={onBenchmarkClick}
          className="w-full text-center text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          View Full Benchmarks →
        </button>
      )}

      <Separator />

      {/* Privacy badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge className="text-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          <Shield className="w-2.5 h-2.5 mr-0.5" /> On-Device
        </Badge>
        <Badge className="text-[8px] bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800">
          Zero PII
        </Badge>
        <Badge className="text-[8px] bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 border-teal-200 dark:border-teal-800">
          No Data Sharing
        </Badge>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Content — FD Rates (with horizontal bar chart)
// ---------------------------------------------------------------------------
function FdRatesPanel() {
  // Prepare chart data from FD_QUICK_RATES
  const chartData = FD_QUICK_RATES.map((fd) => ({
    bank: fd.bank,
    general: fd.rateNum,
    senior: fd.seniorNum,
  }));

  return (
    <div className="space-y-2">
      {FD_QUICK_RATES.map((fd) => (
        <div
          key={fd.bank}
          className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
        >
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {fd.bank}
          </span>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">General</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-0.5">
                {fd.rate}
                <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-500">Senior</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                {fd.senior}
                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* FD Rate Comparison Horizontal Bar Chart */}
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 text-center">
          Rate Comparison Visual
        </p>
        <div style={{ height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 5, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[5, 8.5]}
                tick={{ fontSize: 9, fill: "oklch(0.556 0 0)" }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="bank"
                tick={{ fontSize: 10, fill: "oklch(0.556 0 0)" }}
                width={38}
              />
              <RechartsTooltip
                formatter={(value: number, name: string) => [`${value}%`, name === "senior" ? "Senior" : "General"]}
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid oklch(0.922 0 0)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="general" radius={[0, 3, 3, 0]} barSize={8}>
                {chartData.map((_entry, index) => (
                  <Cell key={`general-${index}`} fill="#14b8a6" />
                ))}
              </Bar>
              <Bar dataKey="senior" radius={[0, 3, 3, 0]} barSize={8}>
                {chartData.map((_entry, index) => (
                  <Cell key={`senior-${index}`} fill="#10b981" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-1">
          <span className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
            General
          </span>
          <span className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Senior
          </span>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-1">
        * 1-2 year tenure rates (FY 2024-25)
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Content — Tax Slabs
// ---------------------------------------------------------------------------
function TaxSlabsPanel() {
  return (
    <div className="space-y-2">
      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
          New Tax Regime (FY 2024-25)
        </p>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
          Default regime • Standard deduction ₹50,000
        </p>
      </div>
      {TAX_SLABS_NEW.map((slab, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
        >
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {slab.range}
          </span>
          <span
            className={`text-sm font-semibold ${slab.rate === "Nil"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-900 dark:text-slate-100"
              }`}
          >
            {slab.rate}
          </span>
        </div>
      ))}
      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mt-2">
        <p className="text-[10px] text-amber-700 dark:text-amber-400">
          💡 Section 87A: No tax if income ≤ ₹7L (New regime)
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Content — Govt Schemes
// ---------------------------------------------------------------------------
function SchemesPanel() {
  const schemeBorderClass: Record<string, string> = {
    PPF: "scheme-ppf",
    SSY: "scheme-ssy",
    SCSS: "scheme-scss",
    NSC: "scheme-nsc",
    NPS: "scheme-nps",
    KVP: "scheme-kvp",
  };

  return (
    <div className="space-y-2">
      {SCHEMES_QUICK.map((s) => (
        <div
          key={s.name}
          className={`p-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 ${schemeBorderClass[s.name] || ""} transition-transform duration-200 hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {s.name}
            </span>
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 h-5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              {s.rate}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Tenure: {s.tenure}</span>
            <span>Tax: {s.tax}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EMI Calculator Component
// ---------------------------------------------------------------------------
function EmiCalculator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [loanType, setLoanType] = useState("home");
  const [principal, setPrincipal] = useState(2000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const isDesktop = useIsDesktop();
  const [result, setResult] = useState<EmiResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const loanTypes = [
    { value: "home", label: "Home Loan", icon: HomeIcon, defaultRate: 8.5, defaultTenure: 20, defaultPrincipal: 2000000 },
    { value: "personal", label: "Personal Loan", icon: Wallet, defaultRate: 12, defaultTenure: 5, defaultPrincipal: 500000 },
    { value: "car", label: "Car Loan", icon: Car, defaultRate: 9.5, defaultTenure: 7, defaultPrincipal: 800000 },
    { value: "education", label: "Education Loan", icon: GraduationCap, defaultRate: 8.0, defaultTenure: 10, defaultPrincipal: 1000000 },
  ];

  const handleLoanTypeChange = (val: string) => {
    setLoanType(val);
    const lt = loanTypes.find((l) => l.value === val);
    if (lt) {
      setRate(lt.defaultRate);
      setTenure(lt.defaultTenure);
      setPrincipal(lt.defaultPrincipal);
    }
    setResult(null);
  };

  const calculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/emi-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ principal, rate, tenure: tenure * 12, type: loanType }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // silently fail
    } finally {
      setCalculating(false);
    }
  };

  const ratePresets = [6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 10.0, 12.0];
  const tenurePresets = [5, 10, 15, 20, 25, 30];

  const content = (
    <div className="space-y-4">
      {/* Loan type selector */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">Loan Type</label>
        <div className="grid grid-cols-2 gap-2">
          {loanTypes.map((lt) => (
            <button
              key={lt.value}
              onClick={() => handleLoanTypeChange(lt.value)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${loanType === lt.value
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
            >
              <lt.icon className="w-4 h-4" />
              {lt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Principal */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Principal Amount (₹)
        </label>
        <Input
          type="number"
          value={principal}
          onChange={(e) => { setPrincipal(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
          placeholder="Enter principal"
        />
        <p className="text-[10px] text-slate-400 mt-1">{fmtINR(principal)}</p>
      </div>

      {/* Rate */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Interest Rate (%)
        </label>
        <Input
          type="number"
          step="0.1"
          value={rate}
          onChange={(e) => { setRate(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
        />
        <div className="flex gap-1 mt-2 flex-wrap">
          {ratePresets.map((r) => (
            <button
              key={r}
              onClick={() => { setRate(r); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${rate === r
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {r}%
            </button>
          ))}
        </div>
      </div>

      {/* Tenure */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Tenure (Years): {tenure}
        </label>
        <Slider
          value={[tenure]}
          min={1}
          max={30}
          step={1}
          onValueChange={(v) => { setTenure(v[0]); setResult(null); }}
          className="mt-2"
        />
        <div className="flex gap-1 mt-2 flex-wrap">
          {tenurePresets.map((t) => (
            <button
              key={t}
              onClick={() => { setTenure(t); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${tenure === t
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {t}yr
            </button>
          ))}
        </div>
      </div>

      {/* Calculate */}
      <Button
        onClick={calculate}
        disabled={calculating}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
      >
        {calculating ? (
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Calculator className="w-4 h-4 mr-2" />
        )}
        Calculate EMI
      </Button>

      {/* Results */}
      {result && (() => {
        const principalPct = Math.round((result.principal / result.totalPayment) * 100);
        const interestPct = 100 - principalPct;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 result-card-glow stagger-1">
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-1">Monthly EMI</p>
              <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">₹{inr.format(Math.round(result.emi))}<span className="unit-suffix">/mo</span></p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow stagger-2">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Interest</p>
                <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">₹{inr.format(Math.round(result.totalInterest))}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow stagger-3">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Payment</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">₹{inr.format(Math.round(result.totalPayment))}</p>
              </div>
            </div>

            {/* Visual breakdown bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Principal ({principalPct}%)</span>
                <span>Interest ({interestPct}%)</span>
              </div>
              <div className="h-3 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${principalPct}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Principal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  Interest
                </span>
              </div>
            </div>

            {/* Year-wise breakdown */}
            <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400">
                  <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${breakdownOpen ? "rotate-180" : ""}`} />
                  Year-wise Breakdown
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 mt-1">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left text-slate-600 dark:text-slate-400">Year</th>
                        <th className="p-2 text-right text-slate-600 dark:text-slate-400">Principal</th>
                        <th className="p-2 text-right text-slate-600 dark:text-slate-400">Interest</th>
                        <th className="p-2 text-right text-slate-600 dark:text-slate-400">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.map((yr) => (
                        <tr key={yr.year} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="p-2 text-slate-700 dark:text-slate-300">{yr.year}</td>
                          <td className="p-2 text-right text-emerald-600 dark:text-emerald-400">{fmtINR(Math.round(yr.principalPaid))}</td>
                          <td className="p-2 text-right text-rose-600 dark:text-rose-400">{fmtINR(Math.round(yr.interestPaid))}</td>
                          <td className="p-2 text-right text-slate-700 dark:text-slate-300">{fmtINR(Math.round(yr.closingBalance))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        );
      })()}
    </div>
  );

  // Desktop: Dialog, Mobile: Sheet
  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-white" />
              </div>
              EMI Calculator
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">₹</span>
            </DialogTitle>
            <DialogDescription>
              Calculate your Equated Monthly Installment
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-white" />
              </div>
              EMI Calculator
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">₹</span>
            </SheetTitle>
            <SheetDescription>
              Calculate your Equated Monthly Installment
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tax Calculator Component
// ---------------------------------------------------------------------------
function TaxCalculator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [income, setIncome] = useState(1000000);
  const [regime, setRegime] = useState<"old" | "new" | "both">("both");
  const [deductions, setDeductions] = useState({
    section80C: 150000,
    section80D: 25000,
    section80CCD1B: 50000,
    section24b: 200000,
    hra: 0,
  });
  const [deductionsOpen, setDeductionsOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const [result, setResult] = useState<TaxResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/tax-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income, regime, deductions }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // silently fail
    } finally {
      setCalculating(false);
    }
  };

  const updateDeduction = (key: string, val: number) => {
    setDeductions((prev) => ({ ...prev, [key]: val }));
    setResult(null);
  };

  const renderSingleResult = (data: TaxRegimeResult, label: string) => (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 stagger-1">
        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mb-1">Total Tax ({label})</p>
        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">₹{inr.format(Math.round(data.totalTax))}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          Effective Rate: {data.effectiveRate}% • Taxable: ₹{inr.format(Math.round(data.taxableIncome))}
        </p>
      </div>

      {/* Slab breakdown */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Tax Slab Breakdown</p>
        {data.taxSlabs.map((b, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-800/50 text-[11px]">
            <span className="text-slate-600 dark:text-slate-400">{b.range}</span>
            <span className="text-slate-500 dark:text-slate-500">{b.rate}%</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">₹{inr.format(b.tax)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const content = (
    <div className="space-y-4">
      {/* Annual Income */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Annual Income (₹)
        </label>
        <Input
          type="number"
          value={income}
          onChange={(e) => { setIncome(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
        />
        <p className="text-[10px] text-slate-400 mt-1">{fmtINR(income)}</p>
      </div>

      {/* Regime selector */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">Tax Regime</label>
        <div className="grid grid-cols-3 gap-2">
          {(["old", "new", "both"] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRegime(r); setResult(null); }}
              className={`p-2.5 rounded-lg border text-xs font-medium transition-all capitalize ${regime === r
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
            >
              {r === "both" ? "Compare Both" : `${r} Regime`}
            </button>
          ))}
        </div>
      </div>

      {/* Old regime deductions (collapsible) */}
      {(regime === "old" || regime === "both") && (
        <Collapsible open={deductionsOpen} onOpenChange={setDeductionsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-xs">
              <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${deductionsOpen ? "rotate-180" : ""}`} />
              Old Regime Deductions
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 mb-1 block">Section 80C (max ₹1.5L)</label>
                <Input type="number" value={deductions.section80C} onChange={(e) => updateDeduction("section80C", Number(e.target.value))} className="text-xs h-8 input-focus-ring" />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 mb-1 block">Section 80D (max ₹75K)</label>
                <Input type="number" value={deductions.section80D} onChange={(e) => updateDeduction("section80D", Number(e.target.value))} className="text-xs h-8 input-focus-ring" />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 mb-1 block">Section 80CCD(1B) (max ₹50K)</label>
                <Input type="number" value={deductions.section80CCD1B} onChange={(e) => updateDeduction("section80CCD1B", Number(e.target.value))} className="text-xs h-8 input-focus-ring" />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 mb-1 block">Section 24(b) (max ₹2L)</label>
                <Input type="number" value={deductions.section24b} onChange={(e) => updateDeduction("section24b", Number(e.target.value))} className="text-xs h-8 input-focus-ring" />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 mb-1 block">HRA Exemption</label>
                <Input type="number" value={deductions.hra} onChange={(e) => updateDeduction("hra", Number(e.target.value))} className="text-xs h-8 input-focus-ring" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Calculate */}
      <Button
        onClick={calculate}
        disabled={calculating}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
      >
        {calculating ? (
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Scale className="w-4 h-4 mr-2" />
        )}
        Calculate Tax
      </Button>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Single regime result */}
          {regime !== "both" && result.oldRegime && renderSingleResult(result.oldRegime, "Old Regime")}
          {regime !== "both" && result.newRegime && renderSingleResult(result.newRegime, "New Regime")}

          {/* Both regime comparison */}
          {regime === "both" && result.oldRegime && result.newRegime && (
            <div className="space-y-3">
              {/* Recommendation badge */}
              {result.comparison && (
                <div className={`p-3 rounded-xl border ${result.comparison.recommendation === "new"
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {result.comparison.recommendation === "new" ? "New Regime Saves More!" : "Old Regime Saves More!"}
                    </span>
                  </div>
                  {result.comparison.savingsFromNewRegime !== 0 && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">
                      You save ₹{inr.format(Math.abs(Math.round(result.comparison.savingsFromNewRegime)))} with the {result.comparison.recommendation} regime
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {result.comparison.recommendationReason}
                  </p>
                </div>
              )}

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 mb-1 font-medium">Old Regime</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">₹{inr.format(Math.round(result.oldRegime.totalTax))}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Effective: {result.oldRegime.effectiveRate}% • Deductions: ₹{inr.format(Math.round(result.oldRegime.totalDeductions))}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mb-1 font-medium">New Regime</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">₹{inr.format(Math.round(result.newRegime.totalTax))}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Effective: {result.newRegime.effectiveRate}% • Deductions: ₹{inr.format(Math.round(result.newRegime.totalDeductions))}
                  </p>
                </div>
              </div>

              {/* Slab breakdown for both */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[9px] font-medium text-amber-600 dark:text-amber-500">Old Regime Slabs</p>
                  {result.oldRegime.taxSlabs.map((b, i) => (
                    <div key={i} className="py-1 px-1.5 rounded text-[9px] flex justify-between bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-500">{b.rate}%</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">₹{inr.format(b.tax)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-500">New Regime Slabs</p>
                  {result.newRegime.taxSlabs.map((b, i) => (
                    <div key={i} className="py-1 px-1.5 rounded text-[9px] flex justify-between bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-500">{b.rate}%</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">₹{inr.format(b.tax)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              Tax Calculator
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">₹</span>
            </DialogTitle>
            <DialogDescription>
              Calculate income tax under old & new regimes (FY 2024-25)
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              Tax Calculator
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">₹</span>
            </SheetTitle>
            <SheetDescription>
              Calculate income tax under old & new regimes (FY 2024-25)
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// SIP Calculator Component
// ---------------------------------------------------------------------------
function SipCalculator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [expectedRate, setExpectedRate] = useState(12);
  const [tenure, setTenure] = useState(15);
  const [stepUp, setStepUp] = useState(0);
  const isDesktop = useIsDesktop();
  const [result, setResult] = useState<SipResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/sip-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyAmount,
          expectedRate,
          tenureYears: tenure,
          stepUpPercent: stepUp,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // silently fail
    } finally {
      setCalculating(false);
    }
  };

  const amountPresets = [1000, 5000, 10000, 25000, 50000];
  const ratePresets = [8, 10, 12, 14, 15];
  const tenurePresets = [5, 10, 15, 20, 25, 30];
  const stepUpPresets = [0, 5, 10, 15];

  const content = (
    <div className="space-y-4">
      {/* Monthly SIP Amount */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Monthly SIP Amount (₹)
        </label>
        <Input
          type="number"
          value={monthlyAmount}
          onChange={(e) => { setMonthlyAmount(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
          placeholder="Enter monthly amount"
        />
        <p className="text-[10px] text-slate-400 mt-1">{fmtINR(monthlyAmount)}/month</p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {amountPresets.map((a) => (
            <button
              key={a}
              onClick={() => { setMonthlyAmount(a); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${monthlyAmount === a
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              ₹{inr.format(a)}
            </button>
          ))}
        </div>
      </div>

      {/* Expected Return Rate */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Expected Return Rate (%)
        </label>
        <Input
          type="number"
          step="0.5"
          value={expectedRate}
          onChange={(e) => { setExpectedRate(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
        />
        <div className="flex gap-1 mt-2 flex-wrap">
          {ratePresets.map((r) => (
            <button
              key={r}
              onClick={() => { setExpectedRate(r); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${expectedRate === r
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {r}%
            </button>
          ))}
        </div>
      </div>

      {/* Investment Tenure */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Investment Tenure: {tenure} Years
        </label>
        <Slider
          value={[tenure]}
          min={1}
          max={40}
          step={1}
          onValueChange={(v) => { setTenure(v[0]); setResult(null); }}
          className="mt-2"
        />
        <div className="flex gap-1 mt-2 flex-wrap">
          {tenurePresets.map((t) => (
            <button
              key={t}
              onClick={() => { setTenure(t); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${tenure === t
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {t}yr
            </button>
          ))}
        </div>
      </div>

      {/* Annual Step-Up */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Annual Step-Up % (optional)
        </label>
        <Input
          type="number"
          step="1"
          value={stepUp}
          onChange={(e) => { setStepUp(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
          placeholder="0"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Increase SIP amount every year by this %
        </p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {stepUpPresets.map((s) => (
            <button
              key={s}
              onClick={() => { setStepUp(s); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${stepUp === s
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      {/* Calculate */}
      <Button
        onClick={calculate}
        disabled={calculating}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
      >
        {calculating ? (
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <TrendingUp className="w-4 h-4 mr-2" />
        )}
        Calculate SIP Returns
      </Button>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Total Value (big highlighted) */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 result-card-glow stagger-1">
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-1">Total Value</p>
            <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">₹{inr.format(Math.round(result.totalValue))}<span className="unit-suffix">₹</span></p>
          </div>

          {/* 3 stat cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow stagger-1">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Invested</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmtINR(result.totalInvested)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow stagger-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Wealth Generated</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmtINR(result.wealthGenerated)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow stagger-3">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Value</p>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{fmtINR(result.totalValue)}</p>
            </div>
          </div>

          {/* Wealth generation ratio bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Invested ({Math.round((result.totalInvested / result.totalValue) * 100)}%)</span>
              <span>Wealth ({Math.round((result.wealthGenerated / result.totalValue) * 100)}%)</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((result.totalInvested / result.totalValue) * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Invested
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                Wealth Generated
              </span>
            </div>
          </div>

          {/* Year-wise growth table (collapsible) */}
          <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400">
                <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${breakdownOpen ? "rotate-180" : ""}`} />
                Year-wise Growth Table
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 mt-1">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left text-slate-600 dark:text-slate-400">Year</th>
                      <th className="p-2 text-right text-slate-600 dark:text-slate-400">Invested</th>
                      <th className="p-2 text-right text-slate-600 dark:text-slate-400">Value</th>
                      <th className="p-2 text-right text-slate-600 dark:text-slate-400">Gains</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyBreakdown.map((yr) => (
                      <tr key={yr.year} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-2 text-slate-700 dark:text-slate-300">{yr.year}</td>
                        <td className="p-2 text-right text-slate-700 dark:text-slate-300">{fmtINR(yr.investedSoFar)}</td>
                        <td className="p-2 text-right text-emerald-600 dark:text-emerald-400">{fmtINR(yr.valueAtYearEnd)}</td>
                        <td className="p-2 text-right text-teal-600 dark:text-teal-400">{fmtINR(yr.gainsSoFar)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Benchmark comparison */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
              📊 If you had invested the same in...
            </p>
            <div className="space-y-2">
              {/* Your SIP row */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  Your SIP @ {expectedRate}%
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {fmtINR(result.totalValue)}
                </span>
              </div>
              {result.benchmarkComparison.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    {b.name}
                  </span>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-900 dark:text-slate-100">
                      {fmtINR(b.totalValue)}
                    </span>
                    <p className="text-[9px] text-slate-400">
                      +{fmtINR(b.wealthGenerated)} gains
                    </p>
                  </div>
                </div>
              ))}
              {/* Difference */}
              {result.benchmarkComparison.length > 0 && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 text-center pt-1">
                  Your SIP outperforms Savings by {fmtINR(result.totalValue - result.benchmarkComparison[2].totalValue)} 💪
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  // Desktop: Dialog, Mobile: Sheet
  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              SIP Calculator 📈
            </DialogTitle>
            <DialogDescription>
              Calculate your Systematic Investment Plan returns
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              SIP Calculator 📈
            </SheetTitle>
            <SheetDescription>
              Calculate your Systematic Investment Plan returns
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Compound Interest Calculator Component
// ---------------------------------------------------------------------------
function CompoundInterestCalculator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(8);
  const [tenure, setTenure] = useState(10);
  const [compoundingFrequency, setCompoundingFrequency] = useState("yearly");
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const isDesktop = useIsDesktop();
  const [result, setResult] = useState<CompoundInterestResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/compound-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal,
          rate,
          tenure,
          compoundingFrequency,
          monthlyContribution,
        }),
      });
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
      } else {
        setResult(data);
      }
    } catch {
      // silently fail
    } finally {
      setCalculating(false);
    }
  };

  const principalPresets = [10000, 50000, 100000, 500000, 1000000];
  const ratePresets = [5, 6, 7, 8, 10, 12];
  const tenurePresets = [1, 5, 10, 15, 20, 30];
  const contribPresets = [0, 1000, 5000, 10000];

  const content = (
    <div className="space-y-4">
      {/* Principal Amount */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Principal Amount (₹)
        </label>
        <Input
          type="number"
          value={principal}
          onChange={(e) => { setPrincipal(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
          placeholder="Enter principal"
        />
        <p className="text-[10px] text-slate-400 mt-1">{fmtINR(principal)}</p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {principalPresets.map((p) => (
            <button
              key={p}
              onClick={() => { setPrincipal(p); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${principal === p
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {p >= 100000 ? `₹${p / 100000}L` : p >= 1000 ? `₹${p / 1000}K` : `₹${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* Annual Interest Rate */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Annual Interest Rate (%)
        </label>
        <Input
          type="number"
          step="0.1"
          value={rate}
          onChange={(e) => { setRate(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
        />
        <div className="flex gap-1 mt-2 flex-wrap">
          {ratePresets.map((r) => (
            <button
              key={r}
              onClick={() => { setRate(r); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${rate === r
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {r}%
            </button>
          ))}
        </div>
      </div>

      {/* Tenure */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Tenure: {tenure} Years
        </label>
        <Slider
          value={[tenure]}
          min={1}
          max={30}
          step={1}
          onValueChange={(v) => { setTenure(v[0]); setResult(null); }}
          className="mt-2"
        />
        <div className="flex gap-1 mt-2 flex-wrap">
          {tenurePresets.map((t) => (
            <button
              key={t}
              onClick={() => { setTenure(t); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${tenure === t
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {t}yr
            </button>
          ))}
        </div>
      </div>

      {/* Compounding Frequency */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">Compounding Frequency</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "half-yearly", label: "Half-Yearly" },
            { value: "yearly", label: "Yearly" },
          ].map((freq) => (
            <button
              key={freq.value}
              onClick={() => { setCompoundingFrequency(freq.value); setResult(null); }}
              className={`p-2 rounded-lg border text-xs font-medium transition-all ${compoundingFrequency === freq.value
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
            >
              {freq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Contribution */}
      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          Monthly Contribution (₹, optional)
        </label>
        <Input
          type="number"
          value={monthlyContribution}
          onChange={(e) => { setMonthlyContribution(Number(e.target.value)); setResult(null); }}
          className="text-sm input-focus-ring"
          placeholder="0"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Add monthly deposits to grow your investment faster
        </p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {contribPresets.map((c) => (
            <button
              key={c}
              onClick={() => { setMonthlyContribution(c); setResult(null); }}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${monthlyContribution === c
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
            >
              {c === 0 ? "₹0" : c >= 1000 ? `₹${c / 1000}K` : `₹${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* Calculate */}
      <Button
        onClick={calculate}
        disabled={calculating}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
      >
        {calculating ? (
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Percent className="w-4 h-4 mr-2" />
        )}
        Calculate Compound Interest
      </Button>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Maturity Amount (big highlighted) */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 result-card-glow stagger-1">
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-1">Maturity Amount</p>
            <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">₹{inr.format(Math.round(result.maturityAmount))}<span className="unit-suffix">₹</span></p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Effective Rate: {result.effectiveRate}<span className="unit-suffix">% p.a.</span>
            </p>
          </div>

          {/* 3 stat cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Contributions</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmtINR(result.totalContributions)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Interest Earned</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmtINR(result.totalInterest)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Maturity Amount</p>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{fmtINR(result.maturityAmount)}</p>
            </div>
          </div>

          {/* Contributions vs Interest proportion bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Contributions ({Math.round((result.totalContributions / result.maturityAmount) * 100)}%)</span>
              <span>Interest ({Math.round((result.totalInterest / result.maturityAmount) * 100)}%)</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((result.totalContributions / result.maturityAmount) * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Contributions
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                Interest
              </span>
            </div>
          </div>

          {/* Comparison with Simple Interest */}
          <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2">
              📊 Compound vs Simple Interest
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Simple Interest</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmtINR(result.comparisonWithSimpleInterest.simpleInterestAmount)}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Compound Interest</p>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{fmtINR(result.maturityAmount)}</p>
              </div>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-2 text-center font-medium">
              Compound interest earns you {fmtINR(result.comparisonWithSimpleInterest.difference)} more! 💪
            </p>
          </div>

          {/* Year-wise breakdown table (collapsible) */}
          <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400">
                <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${breakdownOpen ? "rotate-180" : ""}`} />
                Year-wise Breakdown
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 mt-1">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left text-slate-600 dark:text-slate-400">Year</th>
                      <th className="p-2 text-right text-slate-600 dark:text-slate-400">Opening</th>
                      <th className="p-2 text-right text-slate-600 dark:text-slate-400">Interest</th>
                      <th className="p-2 text-right text-slate-600 dark:text-slate-400">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearWiseBreakdown.map((yr) => (
                      <tr key={yr.year} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-2 text-slate-700 dark:text-slate-300">{yr.year}</td>
                        <td className="p-2 text-right text-slate-700 dark:text-slate-300">{fmtINR(Math.round(yr.openingBalance))}</td>
                        <td className="p-2 text-right text-emerald-600 dark:text-emerald-400">{fmtINR(Math.round(yr.interestEarned))}</td>
                        <td className="p-2 text-right text-teal-600 dark:text-teal-400">{fmtINR(Math.round(yr.closingBalance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      )}
    </div>
  );

  // Desktop: Dialog, Mobile: Sheet
  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Percent className="w-4 h-4 text-white" />
              </div>
              Compound Interest Calculator 🏦
            </DialogTitle>
            <DialogDescription>
              Calculate compound interest with monthly contributions
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Percent className="w-4 h-4 text-white" />
              </div>
              Compound Interest Calculator 🏦
            </SheetTitle>
            <SheetDescription>
              Calculate compound interest with monthly contributions
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Retirement Calculator Component
// ---------------------------------------------------------------------------
function RetirementCalculator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(80);
  const [monthlyExpenses, setMonthlyExpenses] = useState(30000);
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [monthlyContribution, setMonthlyContribution] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [inflationRate, setInflationRate] = useState(6);
  const [epfMonthly, setEpfMonthly] = useState(5000);
  const [npsMonthly, setNpsMonthly] = useState(2000);
  const isDesktop = useIsDesktop();
  const [result, setResult] = useState<RetirementResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/retirement-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAge, retirementAge, lifeExpectancy, monthlyExpenses,
          currentSavings, monthlyContribution, expectedReturnRate: expectedReturn,
          inflationRate, epfMonthly, npsMonthly,
        }),
      });
      const data = await res.json();
      if (data.error) { console.error(data.error); } else { setResult(data); }
    } catch { /* silently fail */ } finally { setCalculating(false); }
  };

  const content = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Current Age</label>
          <Input type="number" value={currentAge} onChange={(e) => { setCurrentAge(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1 flex-wrap">{[25, 30, 35, 40].map((a) => (
            <button key={a} onClick={() => { setCurrentAge(a); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${currentAge === a ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{a}</button>
          ))}</div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Retirement Age</label>
          <Input type="number" value={retirementAge} onChange={(e) => { setRetirementAge(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1 flex-wrap">{[55, 58, 60, 65].map((a) => (
            <button key={a} onClick={() => { setRetirementAge(a); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${retirementAge === a ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{a}</button>
          ))}</div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Monthly Expenses (₹)</label>
        <Input type="number" value={monthlyExpenses} onChange={(e) => { setMonthlyExpenses(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
        <div className="flex gap-1 mt-1 flex-wrap">{[20000, 30000, 50000, 75000, 100000].map((v) => (
          <button key={v} onClick={() => { setMonthlyExpenses(v); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${monthlyExpenses === v ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{v >= 100000 ? `₹${v / 100000}L` : `₹${v / 1000}K`}</button>
        ))}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Current Savings (₹)</label>
          <Input type="number" value={currentSavings} onChange={(e) => { setCurrentSavings(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1 flex-wrap">{[0, 500000, 1000000, 2500000, 5000000].map((v) => (
            <button key={v} onClick={() => { setCurrentSavings(v); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${currentSavings === v ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{v === 0 ? "₹0" : v >= 100000 ? `₹${v / 100000}L` : `₹${v / 1000}K`}</button>
          ))}</div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Monthly Investment (₹)</label>
          <Input type="number" value={monthlyContribution} onChange={(e) => { setMonthlyContribution(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1 flex-wrap">{[5000, 10000, 15000, 25000, 50000].map((v) => (
            <button key={v} onClick={() => { setMonthlyContribution(v); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${monthlyContribution === v ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>₹{v / 1000}K</button>
          ))}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">EPF Monthly (₹)</label>
          <Input type="number" value={epfMonthly} onChange={(e) => { setEpfMonthly(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1 flex-wrap">{[0, 3000, 5000, 10000].map((v) => (
            <button key={v} onClick={() => { setEpfMonthly(v); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${epfMonthly === v ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{v === 0 ? "₹0" : `₹${v / 1000}K`}</button>
          ))}</div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">NPS Monthly (₹)</label>
          <Input type="number" value={npsMonthly} onChange={(e) => { setNpsMonthly(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1 flex-wrap">{[0, 2000, 5000, 10000].map((v) => (
            <button key={v} onClick={() => { setNpsMonthly(v); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${npsMonthly === v ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{v === 0 ? "₹0" : `₹${v / 1000}K`}</button>
          ))}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Return %</label>
          <Input type="number" step="0.5" value={expectedReturn} onChange={(e) => { setExpectedReturn(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1">{[8, 10, 12].map((r) => (
            <button key={r} onClick={() => { setExpectedReturn(r); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${expectedReturn === r ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{r}%</button>
          ))}</div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Inflation %</label>
          <Input type="number" step="0.5" value={inflationRate} onChange={(e) => { setInflationRate(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1">{[5, 6, 7].map((r) => (
            <button key={r} onClick={() => { setInflationRate(r); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${inflationRate === r ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{r}%</button>
          ))}</div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Life Expectancy</label>
          <Input type="number" value={lifeExpectancy} onChange={(e) => { setLifeExpectancy(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
          <div className="flex gap-1 mt-1">{[75, 80, 85].map((a) => (
            <button key={a} onClick={() => { setLifeExpectancy(a); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${lifeExpectancy === a ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{a}</button>
          ))}</div>
        </div>
      </div>

      <Button onClick={calculate} disabled={calculating} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
        {calculating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <HeartPulse className="w-4 h-4 mr-2" />}
        Calculate Retirement Plan
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Corpus needed & accumulated */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border border-rose-200 dark:border-rose-800 result-card-glow stagger-1">
              <p className="text-[10px] text-rose-600 dark:text-rose-500 mb-1">Corpus Needed</p>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">₹{inr.format(Math.round(result.corpusNeeded))}<span className="unit-suffix">₹</span></p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 result-card-glow stagger-2">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mb-1">Total Accumulated</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">₹{inr.format(Math.round(result.totalAccumulated))}<span className="unit-suffix">₹</span></p>
            </div>
          </div>

          {/* Shortfall / Surplus */}
          <div className={`p-4 rounded-xl border result-card-glow ${result.shortfall > 0
              ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
              : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
            }`}>
            <p className={`text-sm font-semibold ${result.shortfall > 0 ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>
              {result.shortfall > 0 ? `Shortfall: ₹${inr.format(Math.round(result.shortfall))}` : `Surplus: ₹${inr.format(Math.round(Math.abs(result.shortfall)))}`}
            </p>
            {result.additionalMonthlyNeeded > 0 && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                Additional ₹{inr.format(Math.round(result.additionalMonthlyNeeded))}<span className="unit-suffix">/mo</span> needed
              </p>
            )}
          </div>

          {/* 3 stat cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Monthly Expenses at Retirement</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmtINR(result.inflatedMonthlyExpenses)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Years to Retire</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{result.yearsToRetire}<span className="unit-suffix">yrs</span></p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Additional Monthly</p>
              <p className={`text-sm font-semibold ${result.additionalMonthlyNeeded > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>₹{inr.format(Math.round(result.additionalMonthlyNeeded))}<span className="unit-suffix">/mo</span></p>
            </div>
          </div>

          {/* Visual bar: Accumulated vs Needed */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Accumulated ({Math.min(100, Math.round((result.totalAccumulated / result.corpusNeeded) * 100))}%)</span>
              <span>Needed</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden bg-rose-100 dark:bg-rose-900/30">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((result.totalAccumulated / result.corpusNeeded) * 100))}%` }} />
            </div>
          </div>

          {/* Year-wise projection (collapsible) */}
          <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400">
                <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${breakdownOpen ? "rotate-180" : ""}`} />
                Year-wise Projection
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 mt-1">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                    <tr>
                      <th className="p-1.5 text-left text-slate-600 dark:text-slate-400">Year</th>
                      <th className="p-1.5 text-right text-slate-600 dark:text-slate-400">Age</th>
                      <th className="p-1.5 text-right text-slate-600 dark:text-slate-400">Contribution</th>
                      <th className="p-1.5 text-right text-slate-600 dark:text-slate-400">Corpus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyProjection.map((yr) => (
                      <tr key={yr.year} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-1.5 text-slate-700 dark:text-slate-300">{yr.year}</td>
                        <td className="p-1.5 text-right text-slate-700 dark:text-slate-300">{yr.age}</td>
                        <td className="p-1.5 text-right text-emerald-600 dark:text-emerald-400">{fmtINR(Math.round(yr.contribution))}</td>
                        <td className="p-1.5 text-right text-teal-600 dark:text-teal-400">{fmtINR(Math.round(yr.totalCorpus))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Recommendations</p>
              <ul className="space-y-1">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              Retirement Calculator
            </DialogTitle>
            <DialogDescription>Plan your retirement corpus with EPF, NPS & SIP</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              Retirement Calculator
            </SheetTitle>
            <SheetDescription>Plan your retirement corpus with EPF, NPS & SIP</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Inflation Calculator Component
// ---------------------------------------------------------------------------
const INFLATION_CATEGORIES: Record<string, { label: string; rate: number }> = {
  general: { label: "General", rate: 6 },
  education: { label: "Education", rate: 8 },
  healthcare: { label: "Healthcare", rate: 7 },
  real_estate: { label: "Real Estate", rate: 6.5 },
  food: { label: "Food", rate: 5.5 },
};

function InflationCalculator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [currentAmount, setCurrentAmount] = useState(100000);
  const [inflationRate, setInflationRate] = useState(6);
  const [years, setYears] = useState(20);
  const [category, setCategory] = useState("general");
  const isDesktop = useIsDesktop();
  const [result, setResult] = useState<InflationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setInflationRate(INFLATION_CATEGORIES[cat]?.rate || 6);
    setResult(null);
  };

  const calculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/inflation-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount, inflationRate, years, category }),
      });
      const data = await res.json();
      if (data.error) { console.error(data.error); } else { setResult(data); }
    } catch { /* silently fail */ } finally { setCalculating(false); }
  };

  const content = (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Current Amount (₹)</label>
        <Input type="number" value={currentAmount} onChange={(e) => { setCurrentAmount(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
        <div className="flex gap-1 mt-1 flex-wrap">{[100000, 500000, 1000000, 2500000, 5000000, 10000000].map((v) => (
          <button key={v} onClick={() => { setCurrentAmount(v); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${currentAmount === v ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{v >= 10000000 ? `₹${v / 10000000}Cr` : v >= 100000 ? `₹${v / 100000}L` : `₹${v / 1000}K`}</button>
        ))}</div>
      </div>

      <div>
        <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Category</label>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(INFLATION_CATEGORIES).map(([key, val]) => (
            <button key={key} onClick={() => handleCategoryChange(key)} className={`p-2 rounded-lg border text-[10px] font-medium transition-all ${category === key ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}>
              {val.label}
              <p className="text-[9px] text-slate-400">{val.rate}%</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Inflation Rate (%)</label>
        <Input type="number" step="0.5" value={inflationRate} onChange={(e) => { setInflationRate(Number(e.target.value)); setResult(null); }} className="text-sm h-8 input-focus-ring" />
        <p className="text-[9px] text-slate-400 mt-0.5">Auto-fills based on category, but editable</p>
      </div>

      <div>
        <label className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1 block">Time Period: {years} Years</label>
        <Slider value={[years]} min={1} max={40} step={1} onValueChange={(v) => { setYears(v[0]); setResult(null); }} className="mt-2" />
        <div className="flex gap-1 mt-1 flex-wrap">{[5, 10, 15, 20, 25, 30].map((t) => (
          <button key={t} onClick={() => { setYears(t); setResult(null); }} className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${years === t ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{t}yr</button>
        ))}</div>
      </div>

      <Button onClick={calculate} disabled={calculating} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
        {calculating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
        Calculate Inflation Impact
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Future Cost */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 result-card-glow stagger-1">
            <p className="text-xs text-orange-600 dark:text-orange-500 mb-1">Future Cost in {years} Years</p>
            <p className="text-4xl font-bold text-orange-700 dark:text-orange-300">₹{inr.format(Math.round(result.futureCost))}<span className="unit-suffix">₹</span></p>
          </div>

          {/* Purchasing power gauge */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 result-card-glow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Purchasing Power Retained</p>
              <p className={`text-lg font-bold ${result.purchasingPowerRetained > 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                {result.purchasingPowerRetained.toFixed(1)}<span className="unit-suffix">%</span>
              </p>
            </div>
            <div className="h-4 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 relative">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${result.purchasingPowerRetained}%`,
                  background: result.purchasingPowerRetained > 50
                    ? "linear-gradient(to right, #f59e0b, #eab308)"
                    : "linear-gradient(to right, #ef4444, #f97316)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-rose-500">0%</span>
              <span className="text-[9px] text-emerald-500">100%</span>
            </div>
          </div>

          {/* Loss highlighted */}
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 result-card-glow">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              Purchasing Power Lost: ₹{inr.format(Math.round(result.purchasingPowerLoss))}
            </p>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
              Your ₹{inr.format(currentAmount)} will feel like ₹{inr.format(Math.round(currentAmount * result.purchasingPowerRetained / 100))} in {years} years
            </p>
          </div>

          {/* Required return */}
          {result.requiredReturnToBeatInflation && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 result-card-glow">
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Required pre-tax return to beat inflation: <strong>{result.requiredReturnToBeatInflation.toFixed(1)}<span className="unit-suffix">% p.a.</span></strong>
              </p>
            </div>
          )}

          {/* Year-by-year breakdown */}
          <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-400">
                <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${breakdownOpen ? "rotate-180" : ""}`} />
                Year-by-Year Breakdown
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 mt-1">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                    <tr>
                      <th className="p-1.5 text-left text-slate-600 dark:text-slate-400">Year</th>
                      <th className="p-1.5 text-right text-slate-600 dark:text-slate-400">Cost</th>
                      <th className="p-1.5 text-right text-slate-600 dark:text-slate-400">Power</th>
                      <th className="p-1.5 text-right text-slate-600 dark:text-slate-400">Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyBreakdown.map((yr) => (
                      <tr key={yr.year} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-1.5 text-slate-700 dark:text-slate-300">{yr.year}</td>
                        <td className="p-1.5 text-right text-orange-600 dark:text-orange-400">{fmtINR(Math.round(yr.inflatedCost))}</td>
                        <td className="p-1.5 text-right text-emerald-600 dark:text-emerald-400">{yr.purchasingPower.toFixed(1)}%</td>
                        <td className="p-1.5 text-right text-rose-600 dark:text-rose-400">{fmtINR(Math.round(yr.cumulativeLoss))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Practical comparisons */}
          {result.practicalComparisons && result.practicalComparisons.length > 0 && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">Practical Comparisons</p>
              {result.practicalComparisons.map((comp, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">{comp.item}</span>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">{comp.currentCost}</span>
                    <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium ml-2">{comp.futureCost}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category tips */}
          {result.categorySpecificTips && result.categorySpecificTips.length > 0 && (
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Tips for {INFLATION_CATEGORIES[category]?.label || category}</p>
              <ul className="space-y-1">
                {result.categorySpecificTips.map((tip, i) => (
                  <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              Inflation Calculator
            </DialogTitle>
            <DialogDescription>See how inflation erodes your purchasing power</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              Inflation Calculator
            </SheetTitle>
            <SheetDescription>See how inflation erodes your purchasing power</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Financial Health Score Component
// ---------------------------------------------------------------------------
function HealthScoreDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  const questions = [
    { id: 1, text: "Do you have an emergency fund covering 6+ months?", options: ["Yes", "No"], points: { Yes: 20, No: 0 } },
    { id: 2, text: "Are you investing at least 20% of your income?", options: ["Yes", "Partially", "No"], points: { Yes: 20, Partially: 10, No: 0 } },
    { id: 3, text: "Do you have health insurance?", options: ["Yes", "No"], points: { Yes: 20, No: 0 } },
    { id: 4, text: "Do you have term life insurance (if dependants)?", options: ["Yes", "No", "N/A"], points: { Yes: 15, No: 0, "N/A": 15 } },
    { id: 5, text: "Are you using Section 80C fully (₹1.5L)?", options: ["Yes", "Partially", "No"], points: { Yes: 25, Partially: 12, No: 0 } },
  ];

  const score = questions.reduce((total, q) => total + (q.points[answers[q.id]] || 0), 0);
  const maxScore = 100;
  const scoreColor = score <= 40 ? "#ef4444" : score <= 70 ? "#f59e0b" : "#10b981";
  const scoreLabel = score <= 40 ? "Needs Improvement" : score <= 70 ? "Fair" : "Excellent";

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / maxScore) * circumference;

  const getRecommendations = () => {
    const recs: string[] = [];
    if (answers[1] !== "Yes") recs.push("Build an emergency fund covering 6 months of expenses first");
    if (answers[2] !== "Yes") recs.push("Try to invest at least 20% of your income — start with SIP");
    if (answers[3] !== "Yes") recs.push("Get health insurance immediately — medical costs are rising fast");
    if (answers[4] === "No") recs.push("Consider term life insurance — it's the cheapest life cover");
    if (answers[5] !== "Yes") recs.push("Maximize Section 80C deductions — PPF, ELSS, NPS can save tax");
    return recs;
  };

  const handleAnswer = (qId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleReset = () => {
    setAnswers({});
    setShowResult(false);
  };

  const content = (
    <div className="space-y-4">
      {!showResult ? (
        <>
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                <span className="text-emerald-600 dark:text-emerald-400 mr-1">Q{idx + 1}.</span>
                {q.text}
              </p>
              <div className="flex gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${answers[q.id] === opt
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button
            onClick={() => setShowResult(true)}
            disabled={Object.keys(answers).length < 5}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            <Activity className="w-4 h-4 mr-2" />
            Calculate Health Score
          </Button>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          {/* Circular score indicator */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.922 0 0)" strokeWidth="6" className="dark:stroke-slate-700" />
                <circle
                  cx="50" cy="50" r="45" fill="none" stroke={scoreColor} strokeWidth="6"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  strokeLinecap="round" className="transition-all duration-1000"
                  style={{ animation: "score-fill 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold" style={{ color: scoreColor }}>{score}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">/100</p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm font-semibold" style={{ color: scoreColor }}>
            {scoreLabel}
          </p>

          {/* Recommendations */}
          {getRecommendations().length > 0 && (
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Personalized Recommendations</p>
              <ul className="space-y-1.5">
                {getRecommendations().map((rec, i) => (
                  <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                    <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button variant="outline" onClick={handleReset} className="w-full text-xs">
            Retake Assessment
          </Button>
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) { onOpenChange(v); if (!v) { setAnswers({}); setShowResult(false); } } }}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              Financial Health Score
            </DialogTitle>
            <DialogDescription>Quick 5-question assessment of your financial health</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) { onOpenChange(v); if (!v) { setAnswers({}); setShowResult(false); } } }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              Financial Health Score
            </SheetTitle>
            <SheetDescription>Quick 5-question assessment of your financial health</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Model Info Dialog
// ---------------------------------------------------------------------------
interface ModelInfoData {
  model: {
    name: string;
    fullName: string;
    provider: string;
    parameters: string;
    architecture: string;
    contextLength: number;
    quantization: string;
    license: string;
  };
  fineTuning: {
    method: string;
    rank: number;
    alpha: number;
    dropout: number;
    targetModules: string[];
    epochs: number;
    batchSize: number;
    learningRate: string;
    warmupSteps: number;
    hardware: string;
    trainingTime: string;
  };
  datasets: {
    name: string;
    description: string;
    size: string;
    languages: string[];
    categories: string[];
    format: string;
  }[];
  evaluation: {
    benchmark: string;
    overallAccuracy: number;
    categoryScores: Record<string, number>;
    comparison: { model: string; score: number }[];
  };
  privacy: {
    onDevice: boolean;
    dataSharing: string;
    piiCollection: string;
    auditLog: string;
  };
}

function ModelInfoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const [data, setData] = useState<ModelInfoData | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (open && !fetchedRef.current) {
      fetchedRef.current = true;
      fetch("/api/model-info")
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(() => { });
    }
  }, [open]);

  const content = (
    <div className="space-y-4">
      {!data ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Gradient Header with Circuit Board Pattern */}
          <div className="circuit-bg rounded-xl bg-gradient-to-br from-emerald-800 to-teal-700 dark:from-emerald-900 dark:to-teal-800 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold model-name-glow">{data.model.name}</h3>
                <p className="text-[10px] text-emerald-100/80">{data.model.fullName}</p>
              </div>
              <span className="model-badge"><Cpu className="w-3 h-3" /> 4B Params</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
              {[
                { label: "Architecture", value: data.model.architecture },
                { label: "Context", value: `${(data.model.contextLength / 1024).toFixed(0)}K tokens` },
                { label: "Quantization", value: "4-bit QLoRA" },
                { label: "License", value: "Apache 2.0" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5">
                  <span className="text-emerald-100/70">{item.label}</span>
                  <span className="text-white font-medium mono-val !bg-white/15 !text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fine-Tuning Card with monospace values */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Fine-Tuning Config</h3>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {[
                  { label: "Method", value: data.fineTuning.method, mono: false },
                  { label: "Rank (r)", value: String(data.fineTuning.rank), mono: true },
                  { label: "Alpha", value: String(data.fineTuning.alpha), mono: true },
                  { label: "Dropout", value: String(data.fineTuning.dropout), mono: true },
                  { label: "Epochs", value: String(data.fineTuning.epochs), mono: true },
                  { label: "Batch Size", value: String(data.fineTuning.batchSize), mono: true },
                  { label: "LR", value: data.fineTuning.learningRate, mono: true },
                  { label: "HW", value: data.fineTuning.hardware, mono: false },
                  { label: "Time", value: data.fineTuning.trainingTime, mono: false },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between bg-white/60 dark:bg-slate-800/60 rounded-lg px-2 py-1">
                    <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                    <span className={item.mono ? "mono-val" : "text-slate-700 dark:text-slate-300 font-medium text-right"}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px]">
                <span className="text-slate-500 dark:text-slate-400">Target Modules: </span>
                <span className="mono-val">{data.fineTuning.targetModules.join(", ")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Training Pipeline Visualization */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Training Pipeline</h3>
              </div>
              <div className="flex items-center justify-center gap-1">
                <div className="pipeline-step text-emerald-700 dark:text-emerald-300">
                  <FileText className="w-3.5 h-3.5 mx-auto mb-1 text-teal-500" />
                  Data
                  <p className="text-[8px] font-normal text-slate-400 mt-0.5">75K+ samples</p>
                </div>
                <div className="pipeline-arrow">→</div>
                <div className="pipeline-step text-amber-700 dark:text-amber-300">
                  <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
                  Fine-tune
                  <p className="text-[8px] font-normal text-slate-400 mt-0.5">LoRA · 3 epochs</p>
                </div>
                <div className="pipeline-arrow">→</div>
                <div className="pipeline-step text-emerald-700 dark:text-emerald-300">
                  <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
                  Deploy
                  <p className="text-[8px] font-normal text-slate-400 mt-0.5">On-device · 4-bit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dataset Badges with colored gradient backgrounds */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-500" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Training Datasets</h3>
              </div>
              {data.datasets.map((ds, idx) => (
                <div key={ds.name} className={`p-2.5 rounded-xl border ${idx === 0 ? "border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:from-emerald-900/15 dark:to-teal-900/10" : "border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/80 to-yellow-50/50 dark:from-amber-900/15 dark:to-yellow-900/10"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className={`text-[9px] ${idx === 0 ? "bg-gradient-to-r from-emerald-200 to-teal-200 text-emerald-800 dark:from-emerald-800/40 dark:to-teal-800/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700" : "bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 dark:from-amber-800/40 dark:to-yellow-800/40 dark:text-amber-300 border-amber-300 dark:border-amber-700"}`}>
                      {ds.size}
                    </Badge>
                    <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">{ds.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">{ds.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {ds.categories.slice(0, 4).map((cat) => (
                      <span key={cat} className={`text-[8px] px-1.5 py-0.5 rounded-full ${idx === 0 ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                        {cat}
                      </span>
                    ))}
                    {ds.categories.length > 4 && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                        +{ds.categories.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy Card with lock animation */}
          <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="lock-animate"><Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></span>
                <h3 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Privacy & Security</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  <Shield className="w-2.5 h-2.5 mr-1" /> On-Device
                </Badge>
                <Badge className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  Zero PII
                </Badge>
                <Badge className="text-[9px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                  No Data Sharing
                </Badge>
              </div>
              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60">{data.privacy.dataSharing}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-lg backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] max-h-[80vh] overflow-y-auto dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              Model Info
            </DialogTitle>
            <DialogDescription>Qwen3-4B fine-tuned for Indian Finance</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              Model Info
            </SheetTitle>
            <SheetDescription>Qwen3-4B fine-tuned for Indian Finance</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Benchmark Dialog
// ---------------------------------------------------------------------------
interface BenchmarkData {
  benchmark: string;
  description: string;
  dateConducted: string;
  methodology: {
    evaluationType: string;
    evaluators: number;
    evaluatorsDescription: string;
    testSetSize: number;
    testSetDescription: string;
    categories: number;
    scoringCriteria: string[];
  };
  results: {
    byLanguage: { language: string; code: string; accuracy: number; fluency: number; financialAccuracy: number; reasoning: number; samples: number }[];
    byCategory: { category: string; score: number; questions: number }[];
    modelComparison: { model: string; overall: number; banking: number; tax: number; investment: number; insurance: number; govt: number; loans: number; regulatory: number }[];
  };
  highlights: string[];
}

const BENCHMARK_COLORS = ["#10b981", "#14b8a6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

function BenchmarkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const [data, setData] = useState<BenchmarkData | null>(null);
  const fetchedRef = useRef(false);
  const [activeChart, setActiveChart] = useState<"language" | "category" | "comparison">("language");

  useEffect(() => {
    if (open && !fetchedRef.current) {
      fetchedRef.current = true;
      fetch("/api/benchmark")
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(() => { });
    }
  }, [open]);

  const content = (
    <div className="space-y-4">
      {!data ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Animated Highlights Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: "86.4", suffix: "%", label: "Overall", color: "text-emerald-600 dark:text-emerald-400" },
              { value: "5.2", suffix: "pts", label: "vs GPT-4o", color: "text-amber-600 dark:text-amber-400" },
              { value: "8.9", suffix: "pts", label: "Hindi Lead", color: "text-teal-600 dark:text-teal-400" },
              { value: "85", suffix: "%+", label: "4+ Langs", color: "text-emerald-600 dark:text-emerald-400" },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 animate-count-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <p className={`text-sm font-bold ${stat.color}`}>{stat.value}<span className="text-[9px]">{stat.suffix}</span></p>
                <p className="text-[8px] text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Chart Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {([
              { key: "language", label: "Languages" },
              { key: "category", label: "Categories" },
              { key: "comparison", label: "Comparison" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key)}
                className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${activeChart === tab.key
                    ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Language Accuracy Chart - Gradient bars with target line */}
          {activeChart === "language" && (
            <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Accuracy by Language (%)</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.results.byLanguage} layout="vertical" margin={{ left: 55, right: 30, top: 5, bottom: 5 }}>
                    <XAxis type="number" domain={[70, 100]} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="language" type="category" tick={{ fontSize: 9 }} width={52} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 10, borderRadius: 8 }}
                      formatter={(value: number) => [`${value}%`, "Accuracy"]}
                    />
                    <ReferenceLine x={85} stroke="#10b981" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: "85% target", position: "top", fontSize: 8, fill: "#10b981" }} />
                    <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={16}>
                      {data.results.byLanguage.map((entry, index) => {
                        const score = entry.accuracy;
                        const color = score >= 90 ? "#10b981" : score >= 85 ? "#34d399" : score >= 80 ? "#f59e0b" : "#fb923c";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[8px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-[#10b981]" /> 90%+</span>
                  <span className="flex items-center gap-1 text-[8px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-[#34d399]" /> 85-90%</span>
                  <span className="flex items-center gap-1 text-[8px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-[#f59e0b]" /> 80-85%</span>
                  <span className="flex items-center gap-1 text-[8px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-[#fb923c]" /> &lt;80%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Scores - Radar Chart */}
          {activeChart === "category" && (
            <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Category Scores (Radar)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={data.results.byCategory.map((c) => ({ subject: c.category.replace(" & ", "/").replace("Government Schemes", "Govt Schemes"), score: c.score, fullMark: 100 }))}>
                    <PolarGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: "#64748b" }} />
                    <PolarRadiusAxis angle={30} domain={[70, 95]} tick={{ fontSize: 7 }} />
                    <Radar name="ArthSathi" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Model Comparison - Grouped bars with winner crown */}
          {activeChart === "comparison" && (
            <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Model Comparison (Overall %)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.results.modelComparison} layout="vertical" margin={{ left: 110, right: 20, top: 10, bottom: 5 }}>
                    <XAxis type="number" domain={[60, 90]} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="model" type="category" tick={{ fontSize: 8 }} width={105} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 10, borderRadius: 8 }}
                      formatter={(value: number) => [`${value}%`, "Overall"]}
                    />
                    <Bar dataKey="overall" radius={[0, 4, 4, 0]} barSize={16}>
                      {data.results.modelComparison.map((_entry, index) => (
                        <Cell key={`cell-cmp-${index}`} fill={index === 0 ? "#10b981" : "#cbd5e1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Winner indicator */}
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-[9px]">👑</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">ArthSathi leads by 5.2+ points</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Highlights with animated numbers */}
          <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-3 space-y-2">
              <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Key Highlights</p>
              {data.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">{h}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Methodology summary */}
          <div className="text-[9px] text-slate-400 dark:text-slate-500 text-center">
            {data.methodology.evaluators} domain experts • {data.methodology.testSetSize} test questions • {data.methodology.categories} financial domains
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-lg backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] max-h-[80vh] overflow-y-auto dialog-animate">
          <DialogHeader className="dialog-gradient-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-white" />
              </div>
              BhashaBench-Finance
            </DialogTitle>
            <DialogDescription>Evaluation results across 8 Indian languages & 7 domains</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader className="dialog-gradient-header">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-white" />
              </div>
              BhashaBench-Finance
            </SheetTitle>
            <SheetDescription>Evaluation results across 8 Indian languages & 7 domains</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Financial Goals Tracker Dialog
// ---------------------------------------------------------------------------
interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: "Emergency Fund" | "Retirement" | "Home" | "Education" | "Wedding" | "Travel" | "Other";
  createdAt: number;
}

const GOAL_CATEGORIES: FinancialGoal["category"][] = [
  "Emergency Fund", "Retirement", "Home", "Education", "Wedding", "Travel", "Other"
];

const GOAL_CATEGORY_COLORS: Record<string, string> = {
  "Emergency Fund": "text-red-600 dark:text-red-400",
  "Retirement": "text-purple-600 dark:text-purple-400",
  "Home": "text-blue-600 dark:text-blue-400",
  "Education": "text-amber-600 dark:text-amber-400",
  "Wedding": "text-pink-600 dark:text-pink-400",
  "Travel": "text-teal-600 dark:text-teal-400",
  "Other": "text-slate-600 dark:text-slate-400",
};

const GOAL_STORAGE_KEY = "arthasathi-goals";

function loadGoals(): FinancialGoal[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveGoals(goals: FinancialGoal[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goals));
  } catch { /* ignore */ }
}

function FinancialGoalsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const isDesktop = useIsDesktop();
  const [goals, setGoals] = useState<FinancialGoal[]>(loadGoals);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [category, setCategory] = useState<FinancialGoal["category"]>("Emergency Fund");

  useEffect(() => { setGoals(loadGoals()); }, [open]);

  const addGoal = () => {
    if (!name || !targetAmount) return;
    const goal: FinancialGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate: targetDate || "",
      category,
      createdAt: Date.now(),
    };
    const updated = [goal, ...goals];
    setGoals(updated);
    saveGoals(updated);
    setName(""); setTargetAmount(""); setCurrentAmount(""); setTargetDate(""); setShowForm(false);
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
  };

  const content = (
    <div className="space-y-4">
      {/* Add Goal Button */}
      <Button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        {showForm ? "Cancel" : "Add New Goal / नया लक्ष्य जोड़ें"}
      </Button>

      {/* Add Goal Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <Input placeholder="Goal Name / लक्ष्य का नाम" value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Target Amount ₹" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="text-sm" />
            <Input placeholder="Current Amount ₹" type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Target Date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="text-sm" />
            <Select value={category} onValueChange={(v) => setCategory(v as FinancialGoal["category"])}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GOAL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addGoal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm" disabled={!name || !targetAmount}>
            Save Goal / लक्ष्य सहेजें
          </Button>
        </motion.div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No goals yet. Add your first financial goal!</p>
          <p className="text-xs text-slate-400 mt-1">अभी कोई लक्ष्य नहीं। अपना पहला वित्तीय लक्ष्य जोड़ें!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            const monthsLeft = goal.targetDate ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : null;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : 0;
            return (
              <div key={goal.id} className="split-card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{goal.name}</p>
                    <p className={`text-xs ${GOAL_CATEGORY_COLORS[goal.category] || "text-slate-500"}`}>{goal.category}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-500" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{fmtINR(goal.currentAmount)}</span>
                    <span>{fmtINR(goal.targetAmount)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="goal-progress-bar" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{progress.toFixed(1)}% achieved</p>
                </div>
                {/* Monthly savings needed */}
                {monthlyNeeded > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    💰 Monthly savings needed: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{fmtINR(Math.ceil(monthlyNeeded))}</span>
                    {monthsLeft !== null && <span> ({monthsLeft} months left)</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] dialog-animate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Target className="w-4 h-4 text-white" /></div>
              Financial Goals Tracker 🎯
            </DialogTitle>
            <DialogDescription>Track your financial goals / अपने वित्तीय लक्ष्यों को ट्रैक करें</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Target className="w-4 h-4 text-white" /></div>
              Financial Goals Tracker 🎯
            </SheetTitle>
            <SheetDescription>Track your financial goals / अपने वित्तीय लक्ष्यों को ट्रैक करें</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Daily Finance Quiz Dialog
// ---------------------------------------------------------------------------
interface QuizQuestion {
  id: number;
  questionEn: string;
  questionHi: string;
  options: string[];
  correctIndex: number;
  explanationEn: string;
  explanationHi: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 1, questionEn: "What is the current PPF interest rate?", questionHi: "PPF की वर्तमान ब्याज दर क्या है?", options: ["6.5%", "7.1%", "7.5%", "8.0%"], correctIndex: 1, explanationEn: "PPF interest rate is 7.1% per annum (as of 2024).", explanationHi: "PPF ब्याज दर 7.1% प्रति वर्ष (2024 के अनुसार) है।" },
  { id: 2, questionEn: "What is the maximum deduction under Section 80C?", questionHi: "सेक्शन 80C के तहत अधिकतम कटौती कितनी है?", options: ["₹1 Lakh", "₹1.5 Lakh", "₹2 Lakh", "₹2.5 Lakh"], correctIndex: 1, explanationEn: "Section 80C allows a maximum deduction of ₹1.5 Lakh per year.", explanationHi: "सेक्शन 80C प्रति वर्ष अधिकतम ₹1.5 लाख की कटौती की अनुमति देता है।" },
  { id: 3, questionEn: "What is the full form of NPS?", questionHi: "NPS का पूरा नाम क्या है?", options: ["National Pension System", "New Payment Scheme", "National Profit Scheme", "New Pension Savings"], correctIndex: 0, explanationEn: "NPS stands for National Pension System, a government-backed retirement savings scheme.", explanationHi: "NPS का पूरा नाम नेशनल पेंशन सिस्टम है, जो सरकार समर्थित सेवानिवृत्ति बचत योजना है।" },
  { id: 4, questionEn: "What is the Sukanya Samriddhi Yojana interest rate?", questionHi: "सुकन्या समृद्धि योजना की ब्याज दर क्या है?", options: ["7.1%", "7.5%", "8.2%", "8.5%"], correctIndex: 2, explanationEn: "SSY offers 8.2% per annum, one of the highest small savings rates.", explanationHi: "SSY 8.2% प्रति वर्ष प्रदान करती है, जो सबसे अधिक छोटी बचत दरों में से एक है।" },
  { id: 5, questionEn: "What is the lock-in period for ELSS?", questionHi: "ELSS की लॉक-इन अवधि कितनी है?", options: ["3 years", "5 years", "7 years", "10 years"], correctIndex: 0, explanationEn: "ELSS has the shortest lock-in of 3 years among 80C options.", explanationHi: "ELSS की 80C विकल्पों में सबसे कम 3 साल की लॉक-इन है।" },
  { id: 6, questionEn: "What is the standard deduction in the New Tax Regime (FY 2024-25)?", questionHi: "नए टैक्स रेजिम में स्टैंडर्ड डिडक्शन कितना है?", options: ["₹40,000", "₹50,000", "₹75,000", "₹1,00,000"], correctIndex: 2, explanationEn: "Budget 2024 increased standard deduction to ₹75,000 in the New Regime.", explanationHi: "बजट 2024 में नए रेजिम में स्टैंडर्ड डिडक्शन ₹75,000 किया गया।" },
  { id: 7, questionEn: "Which is NOT a Section 80C eligible investment?", questionHi: "कौन सा सेक्शन 80C योग्य निवेश नहीं है?", options: ["PPF", "ELSS", "NPS 80CCD(1B)", "NSC"], correctIndex: 2, explanationEn: "NPS 80CCD(1B) has a separate ₹50,000 deduction, not under 80C.", explanationHi: "NPS 80CCD(1B) की अलग ₹50,000 की कटौती है, जो 80C के तहत नहीं है।" },
  { id: 8, questionEn: "What is the maximum income tax rebate u/s 87A in New Regime?", questionHi: "नए रेजिम में 87A के तहत अधिकतम टैक्स रिबेट कितना है?", options: ["₹12,500", "₹25,000", "₹37,500", "₹50,000"], correctIndex: 1, explanationEn: "In the New Regime, Section 87A rebate is up to ₹25,000 for income up to ₹7L.", explanationHi: "नए रेजिम में, 87A रिबेट ₹7L तक की आय पर अधिकतम ₹25,000 है।" },
  { id: 9, questionEn: "What is the Senior Citizens Savings Scheme rate?", questionHi: "सीनियर सिटीजन सेविंग्स स्कीम की दर क्या है?", options: ["7.4%", "7.7%", "8.2%", "8.5%"], correctIndex: 2, explanationEn: "SCSS offers 8.2% per annum for senior citizens (age 60+).", explanationHi: "SCSS सीनियर सिटीजन (60+ आयु) के लिए 8.2% प्रति वर्ष प्रदान करती है।" },
  { id: 10, questionEn: "What is the minimum SIP amount in most mutual funds?", questionHi: "अधिकांश म्यूचुअल फंड में न्यूनतम SIP राशि क्या है?", options: ["₹100", "₹500", "₹1,000", "₹5,000"], correctIndex: 1, explanationEn: "Most mutual funds allow SIP starting from ₹500 per month.", explanationHi: "अधिकांश म्यूचुअल फंड ₹500 प्रति माह से SIP की अनुमति देते हैं।" },
  { id: 11, questionEn: "What is the EPF interest rate for FY 2023-24?", questionHi: "FY 2023-24 के लिए EPF ब्याज दर क्या है?", options: ["7.5%", "8.1%", "8.15%", "8.25%"], correctIndex: 2, explanationEn: "EPF interest rate for FY 2023-24 is 8.15% per annum.", explanationHi: "FY 2023-24 के लिए EPF ब्याज दर 8.15% प्रति वर्ष है।" },
  { id: 12, questionEn: "TDS on FD interest above ₹40,000 (non-senior) is?", questionHi: "₹40,000 से अधिक FD ब्याज पर TDS (गैर-सीनियर) कितना है?", options: ["5%", "10%", "15%", "20%"], correctIndex: 1, explanationEn: "Banks deduct 10% TDS on FD interest exceeding ₹40,000 (₹50,000 for seniors).", explanationHi: "बैंक ₹40,000 (सीनियर के लिए ₹50,000) से अधिक FD ब्याज पर 10% TDS काटते हैं।" },
  { id: 13, questionEn: "What is the PMJJBY life cover amount?", questionHi: "PMJJBY जीवन बीमा राशि कितनी है?", options: ["₹1 Lakh", "₹2 Lakh", "₹5 Lakh", "₹10 Lakh"], correctIndex: 1, explanationEn: "PMJJBY provides ₹2 Lakh life cover at just ₹436/year premium.", explanationHi: "PMJJBY केवल ₹436/वर्ष प्रीमियम पर ₹2 लाख जीवन कवर प्रदान करता है।" },
  { id: 14, questionEn: "What is the Kisan Vikas Patra (KVP) interest rate?", questionHi: "किसान विकास पत्र (KVP) की ब्याज दर क्या है?", options: ["6.9%", "7.0%", "7.5%", "7.7%"], correctIndex: 2, explanationEn: "KVP offers 7.5% and doubles the investment in 115 months.", explanationHi: "KVP 7.5% प्रदान करता है और 115 महीनों में निवेश दोगुना करता है।" },
  { id: 15, questionEn: "What is the maximum PPF investment per year?", questionHi: "प्रति वर्ष अधिकतम PPF निवेश कितना है?", options: ["₹1 Lakh", "₹1.5 Lakh", "₹2 Lakh", "No limit"], correctIndex: 1, explanationEn: "PPF allows a maximum deposit of ₹1.5 Lakh per financial year.", explanationHi: "PPF प्रति वित्तीय वर्ष अधिकतम ₹1.5 लाख जमा की अनुमति देता है।" },
  { id: 16, questionEn: "What is the minimum CIBIL score for loan approval?", questionHi: "लोन अप्रूवल के लिए न्यूनतम CIBIL स्कोर क्या है?", options: ["550", "650", "700", "750"], correctIndex: 2, explanationEn: "Most lenders prefer a CIBIL score of 700+ for loan approval.", explanationHi: "अधिकांश ऋणदाता लोन अप्रूवल के लिए 700+ CIBIL स्कोर पसंद करते हैं।" },
  { id: 17, questionEn: "What is the Atal Pension Yojana max pension?", questionHi: "अटल पेंशन योजना की अधिकतम पेंशन क्या है?", options: ["₹3,000", "₹5,000", "₹7,500", "₹10,000"], correctIndex: 1, explanationEn: "APY provides a guaranteed pension of up to ₹5,000/month after age 60.", explanationHi: "APY 60 वर्ष की आयु के बाद अधिकतम ₹5,000/माह की गारंटीड पेंशन देती है।" },
  { id: 18, questionEn: "RBI repo rate as of 2024 is?", questionHi: "2024 के अनुसार RBI रेपो रेट क्या है?", options: ["6.25%", "6.50%", "6.75%", "7.00%"], correctIndex: 1, explanationEn: "RBI repo rate is 6.50% as of 2024.", explanationHi: "2024 के अनुसार RBI रेपो रेट 6.50% है।" },
  { id: 19, questionEn: "What is the maximum limit under PMVVY?", questionHi: "PMVVY के तहत अधिकतम सीमा क्या है?", options: ["₹5 Lakh", "₹10 Lakh", "₹15 Lakh", "₹7.5 Lakh"], correctIndex: 2, explanationEn: "PMVVY allows investment up to ₹15 Lakh for senior citizens.", explanationHi: "PMVVY सीनियर सिटीजन के लिए अधिकतम ₹15 लाख निवेश की अनुमति देता है।" },
  { id: 20, questionEn: "Health Insurance deduction u/s 80D for self+family is?", questionHi: "सेक्शन 80D में स्वयं+परिवार के लिए स्वास्थ्य बीमा कटौती क्या है?", options: ["₹15,000", "₹25,000", "₹50,000", "₹1,00,000"], correctIndex: 1, explanationEn: "Section 80D allows up to ₹25,000 for self+family (₹50,000 for seniors).", explanationHi: "सेक्शन 80D स्वयं+परिवार के लिए ₹25,000 (सीनियर के लिए ₹50,000) की अनुमति देता है।" },
  { id: 21, questionEn: "What is the National Savings Certificate (NSC) rate?", questionHi: "राष्ट्रीय बचत पत्र (NSC) की दर क्या है?", options: ["6.7%", "7.0%", "7.7%", "8.0%"], correctIndex: 2, explanationEn: "NSC offers 7.7% per annum with a 5-year lock-in.", explanationHi: "NSC 5 साल की लॉक-इन के साथ 7.7% प्रति वर्ष प्रदान करता है।" },
  { id: 22, questionEn: "LTCG tax on equity mutual funds above ₹1.25L is?", questionHi: "₹1.25L से अधिक इक्विटी म्यूचुअल फंड पर LTCG टैक्स क्या है?", options: ["10%", "12.5%", "15%", "20%"], correctIndex: 1, explanationEn: "Budget 2024 changed LTCG tax to 12.5% above ₹1.25L exemption.", explanationHi: "बजट 2024 में LTCG टैक्स को ₹1.25L छूट से ऊपर 12.5% कर दिया गया।" },
];

function FinanceQuizDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const isDesktop = useIsDesktop();
  const [quizState, setQuizState] = useState<"idle" | "playing" | "answered" | "finished">("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const { language } = useChatStore();
  const isHindi = language !== "en";

  const startQuiz = () => {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentQ(0);
    setScore(0);
    setTotal(0);
    setSelectedIdx(null);
    setQuizState("playing");
  };

  const handleSelect = (idx: number) => {
    if (quizState !== "playing") return;
    setSelectedIdx(idx);
    const isCorrect = idx === questions[currentQ].correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    setTotal((t) => t + 1);
    setQuizState("answered");
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setQuizState("finished");
    } else {
      setCurrentQ((c) => c + 1);
      setSelectedIdx(null);
      setQuizState("playing");
    }
  };

  const getOptionClass = (idx: number) => {
    if (quizState === "answered") {
      if (idx === questions[currentQ].correctIndex) return "quiz-option correct";
      if (idx === selectedIdx) return "quiz-option incorrect";
      return "quiz-option";
    }
    if (idx === selectedIdx) return "quiz-option selected";
    return "quiz-option";
  };

  const content = (
    <div className="space-y-4">
      {quizState === "idle" && (
        <div className="text-center py-4">
          <BookOpen className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isHindi ? "वित्तीय क्विज़ 🧠" : "Finance Quiz 🧠"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isHindi ? "भारतीय वित्त के बारे में 10 यादृच्छिक प्रश्न" : "10 random questions about Indian finance"}
          </p>
          <Button onClick={startQuiz} className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            {isHindi ? "क्विज़ शुरू करें" : "Start Quiz"}
          </Button>
        </div>
      )}

      {(quizState === "playing" || quizState === "answered") && questions[currentQ] && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {isHindi ? "प्रश्न" : "Question"} {currentQ + 1}/{questions.length}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {isHindi ? "स्कोर" : "Score"}: {score}/{total}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {isHindi ? questions[currentQ].questionHi : questions[currentQ].questionEn}
          </p>
          <div className="space-y-2">
            {questions[currentQ].options.map((opt, idx) => (
              <button key={idx} className={`w-full text-left ${getOptionClass(idx)}`} onClick={() => handleSelect(idx)} disabled={quizState === "answered"}>
                <span className="text-sm">{String.fromCharCode(65 + idx)}. {opt}</span>
              </button>
            ))}
          </div>
          {quizState === "answered" && (
            <div className="mt-3 space-y-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  ✅ {isHindi ? questions[currentQ].explanationHi : questions[currentQ].explanationEn}
                </p>
              </div>
              <Button onClick={nextQuestion} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                {currentQ + 1 >= questions.length
                  ? (isHindi ? "परिणाम देखें" : "See Results")
                  : (isHindi ? "अगला प्रश्न" : "Next Question")}
              </Button>
            </div>
          )}
        </div>
      )}

      {quizState === "finished" && (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">{score >= 8 ? "🏆" : score >= 5 ? "👏" : "📚"}</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isHindi ? "क्विज़ पूरा!" : "Quiz Complete!"}
          </h3>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {score}/{questions.length}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {score >= 8
              ? (isHindi ? "शानदार! आप वित्तीय विशेषज्ञ हैं!" : "Excellent! You're a finance expert!")
              : score >= 5
                ? (isHindi ? "अच्छा प्रयास! और सीखते रहें!" : "Good try! Keep learning!")
                : (isHindi ? "और अभ्यास करें, ArthSathi से सीखें!" : "More practice needed — learn with ArthSathi!")}
          </p>
          <Button onClick={startQuiz} className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            {isHindi ? "फिर से खेलें" : "Play Again"}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] dialog-animate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><BookOpen className="w-4 h-4 text-white" /></div>
              Daily Finance Quiz 🧠
            </DialogTitle>
            <DialogDescription>Test your Indian finance knowledge / भारतीय वित्त ज्ञान की जांच करें</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><BookOpen className="w-4 h-4 text-white" /></div>
              Daily Finance Quiz 🧠
            </SheetTitle>
            <SheetDescription>Test your Indian finance knowledge / भारतीय वित्त ज्ञान की जांच करें</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Expense Split Calculator Dialog
// ---------------------------------------------------------------------------
interface SplitParticipant {
  id: string;
  name: string;
}

interface SplitExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // participant id
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

function ExpenseSplitDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const isDesktop = useIsDesktop();
  const [participants, setParticipants] = useState<SplitParticipant[]>([
    { id: "p1", name: "" },
    { id: "p2", name: "" },
  ]);
  const [expenses, setExpenses] = useState<SplitExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");

  const addParticipant = () => {
    setParticipants([...participants, { id: `p${Date.now()}`, name: "" }]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((p) => p.id !== id));
    setExpenses(expenses.filter((e) => e.paidBy !== id));
  };

  const updateParticipant = (id: string, name: string) => {
    setParticipants(participants.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const addExpense = () => {
    if (!desc || !amount || !paidBy) return;
    const exp: SplitExpense = {
      id: `e${Date.now()}`,
      description: desc,
      amount: parseFloat(amount),
      paidBy,
    };
    setExpenses([...expenses, exp]);
    setDesc(""); setAmount("");
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const calculateSplit = () => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const n = participants.length;
    if (n === 0 || total === 0) return;

    const perPerson = total / n;

    // Calculate net balance for each person (positive = owed money, negative = owes money)
    const balances: Record<string, number> = {};
    participants.forEach((p) => { balances[p.id] = 0; });
    expenses.forEach((e) => {
      balances[e.paidBy] = (balances[e.paidBy] || 0) + e.amount;
    });
    participants.forEach((p) => {
      balances[p.id] = (balances[p.id] || 0) - perPerson;
    });

    // Minimize transactions using greedy algorithm
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];
    Object.entries(balances).forEach(([id, balance]) => {
      const rounded = Math.round(balance * 100) / 100;
      if (rounded < -0.01) debtors.push({ id, amount: -rounded });
      else if (rounded > 0.01) creditors.push({ id, amount: rounded });
    });

    const result: Settlement[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const payment = Math.min(debtors[di].amount, creditors[ci].amount);
      if (payment > 0.01) {
        result.push({
          from: debtors[di].id,
          to: creditors[ci].id,
          amount: Math.round(payment * 100) / 100,
        });
      }
      debtors[di].amount -= payment;
      creditors[ci].amount -= payment;
      if (debtors[di].amount < 0.01) di++;
      if (creditors[ci].amount < 0.01) ci++;
    }
    setSettlements(result);
  };

  const getName = (id: string) => participants.find((p) => p.id === id)?.name || "Unknown";

  const content = (
    <div className="space-y-4">
      {/* Participants */}
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Participants / प्रतिभागी</p>
        <div className="space-y-2">
          {participants.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
              <Input
                placeholder={`Name / नाम ${i + 1}`}
                value={p.name}
                onChange={(e) => updateParticipant(p.id, e.target.value)}
                className="text-sm flex-1"
              />
              {participants.length > 2 && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => removeParticipant(p.id)}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addParticipant} className="mt-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Person
        </Button>
      </div>

      {/* Add Expense */}
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Add Expense / खर्चा जोड़ें</p>
        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <Input placeholder="Description / विवरण" value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm" />
          <Input placeholder="Amount ₹" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-sm" />
          <Select value={paidBy} onValueChange={setPaidBy}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Paid by / किसने दिया" /></SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name || `Person ${participants.indexOf(p) + 1}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addExpense} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm" disabled={!desc || !amount || !paidBy}>
            Add Expense / खर्चा जोड़ें
          </Button>
        </div>
      </div>

      {/* Expense List */}
      {expenses.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500">Expenses ({expenses.length})</p>
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300">{e.description}</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{fmtINR(e.amount)}</span>
                <span className="text-slate-400">by {getName(e.paidBy)}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-rose-500" onClick={() => removeExpense(e.id)}>
                  <X className="w-2.5 h-2.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calculate Button */}
      {expenses.length > 0 && participants.length >= 2 && (
        <Button onClick={calculateSplit} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
          Calculate Split / हिसाब लगाएं
        </Button>
      )}

      {/* Settlements */}
      {settlements.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Simplified Settlements / सरलीकृत भुगतान</p>
          <div className="text-xs text-slate-500 mb-1">
            Total: {fmtINR(expenses.reduce((s, e) => s + e.amount, 0))} | Per person: {fmtINR(expenses.reduce((s, e) => s + e.amount, 0) / participants.length)}
          </div>
          {settlements.map((s, i) => (
            <div key={i} className="split-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{getName(s.from) || "?"}</span>
                <span className="text-xs text-slate-400">→ pays →</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{getName(s.to) || "?"}</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmtINR(s.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open && isDesktop} onOpenChange={(v) => { if (isDesktop) onOpenChange(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-emerald-200/30 dark:border-emerald-800/30 shadow-[0_0_30px_rgba(16,185,129,0.08)] dialog-animate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
              Expense Split Calculator 👥
            </DialogTitle>
            <DialogDescription>Split group expenses fairly / समूह खर्चों को उचित रूप से बांटें</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open && !isDesktop} onOpenChange={(v) => { if (!isDesktop) onOpenChange(v); }}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
              Expense Split Calculator 👥
            </SheetTitle>
            <SheetDescription>Split group expenses fairly / समूह खर्चों को उचित रूप से बांटें</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Conversations Panel (sidebar tab)
// ---------------------------------------------------------------------------
function ConversationsPanel() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    switchConversation,
    deleteConversation,
  } = useChatStore();

  return (
    <div className="space-y-2">
      <Button
        onClick={createConversation}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs h-8"
      >
        <Plus className="w-3 h-3 mr-1.5" />
        New Chat / नई चैट
      </Button>
      {conversations.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No conversations yet</p>
      ) : (
        <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
          {conversations.map((conv) => {
            const isActive = conv.id === currentConversationId;
            const msgCount = conv.messages.length;
            const lastMsgTime = conv.updatedAt
              ? new Date(conv.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
              : "";
            const displayTitle = conv.title.startsWith("New Chat")
              ? "New Chat"
              : conv.title;
            return (
              <div
                key={conv.id}
                className={`conv-item ${isActive ? "active" : ""} flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group`}
                onClick={() => switchConversation(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${isActive ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>
                    {displayTitle}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {msgCount} msgs • {lastMsgTime}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function Home() {
  const {
    messages,
    isLoading,
    language,
    languages,
    isSidebarOpen,
    activeTab,
    sendMessage,
    setLanguage,
    toggleSidebar,
    setActiveTab,
    clearChat,
    setReaction,
    toggleBookmark,
  } = useChatStore();

  const { theme, setTheme } = useTheme();
  const [input, setInput] = useState("");
  const [emiOpen, setEmiOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);
  const [sipOpen, setSipOpen] = useState(false);
  const [ciOpen, setCiOpen] = useState(false);
  const [retirementOpen, setRetirementOpen] = useState(false);
  const [inflationOpen, setInflationOpen] = useState(false);
  const [healthScoreOpen, setHealthScoreOpen] = useState(false);
  const [modelInfoOpen, setModelInfoOpen] = useState(false);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Voice recording functions
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          setIsTranscribing(true);
          try {
            const res = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioBase64: base64, format: "webm" }),
            });
            const data = await res.json();
            if (data.text) setInput((prev) => prev ? prev + " " + data.text : data.text);
          } catch {
            // Transcription failed silently
          } finally {
            setIsTranscribing(false);
          }
        };
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 30000);
    } catch {
      // Microphone not available
      console.error("Microphone access denied or unavailable");
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle send
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage(trimmed);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, sendMessage]);

  // Handle query click from sample queries
  const handleQueryClick = useCallback(
    async (query: string) => {
      if (isLoading) return;
      await sendMessage(query);
    },
    [isLoading, sendMessage]
  );

  // Handle keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Auto-resize textarea
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    },
    []
  );

  // Export chat
  const handleExportChat = useCallback(() => {
    if (messages.length === 0) return;
    const currentLang = languages.find((l) => l.code === language);
    const lines = [
      "=== अर्थसाथी ArthSathi — Chat Export ===",
      `Language: ${currentLang?.name || "Hindi"} (${currentLang?.nativeName || "हिन्दी"})`,
      `Exported: ${new Date().toLocaleString("en-IN")}`,
      `Messages: ${messages.length}`,
      "",
      "=".repeat(50),
      "",
    ];
    messages.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const role = msg.role === "user" ? "You" : "ArthSathi";
      lines.push(`[${time}] ${role}:`);
      lines.push(msg.content);
      if (msg.processingTime) lines.push(`  (processed in ${msg.processingTime}ms)`);
      lines.push("");
    });
    lines.push("=".repeat(50));
    lines.push("🔒 Exported from ArthSathi — On-Device Vernacular Financial Advisory Model");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arthasathi-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, language, languages]);

  // Share financial summary
  const handleShareSummary = useCallback(() => {
    if (messages.length === 0) return;
    const currentLang = languages.find((l) => l.code === language);
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const userMessages = messages.filter((m) => m.role === "user");
    const summary = [
      "═══════════════════════════════════════════",
      "  अर्थसाथी ArthSathi — Financial Summary",
      "═══════════════════════════════════════════",
      "",
      `📅 Date: ${new Date().toLocaleString("en-IN")}`,
      `🌐 Language: ${currentLang?.name || "Hindi"} (${currentLang?.nativeName || "हिन्दी"})`,
      `💬 Total Messages: ${messages.length} (${userMessages.length} questions, ${assistantMessages.length} responses)`,
      "",
      "─── Your Questions ───",
      "",
      ...userMessages.map((m, i) => `${i + 1}. ${m.content}`),
      "",
      "─── Key Insights ───",
      "",
      ...assistantMessages.slice(0, 5).map((m, i) => {
        const preview = m.content.replace(/[#*_]/g, "").slice(0, 120);
        return `${i + 1}. ${preview}${m.content.length > 120 ? "..." : ""}`;
      }),
      "",
      "─── Feedback ───",
      "",
      ...messages.filter((m) => m.reaction).map((m) => {
        const preview = m.content.slice(0, 60);
        return `${m.reaction === "up" ? "👍" : "👎"} ${preview}...`;
      }),
      "",
      "═══════════════════════════════════════════",
      "🔒 Generated by ArthSathi — On-Device AI",
      "⚠️ AI-generated advice, not financial recommendation",
      "═══════════════════════════════════════════",
    ].join("\n");

    // Try to copy to clipboard, fall back to print dialog
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary).then(() => {
        // Show a brief confirmation via a temporary element
        const toast = document.createElement("div");
        toast.textContent = "✅ Summary copied to clipboard!";
        toast.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:8px 16px;border-radius:8px;font-size:13px;z-index:9999;box-shadow:0 4px 12px rgba(16,185,129,0.3);transition:opacity 0.3s;";
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = "0"; }, 2000);
        setTimeout(() => { document.body.removeChild(toast); }, 2500);
      }).catch(() => {
        // Fallback: open print dialog
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`<pre style="font-family:monospace;font-size:13px;padding:20px;white-space:pre-wrap;">${summary}</pre>`);
          printWindow.document.close();
          printWindow.print();
        }
      });
    } else {
      // Fallback: open print dialog
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`<pre style="font-family:monospace;font-size:13px;padding:20px;white-space:pre-wrap;">${summary}</pre>`);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, [messages, language, languages]);

  const currentLang = languages.find((l) => l.code === language);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* ============ HEADER ============ */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 relative">
          {/* Gradient bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent dark:via-emerald-600" />
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm animate-logo-glow">
                <span className="text-lg font-bold text-white">अ</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  अर्थसाथी
                </h1>
                <p className="text-[10px] text-slate-400 leading-tight">
                  ArthSathi — On-Device Vernacular Finance AI
                </p>
              </div>
            </div>

            {/* Center: Status badges with transition */}
            <div className="hidden md:flex items-center gap-2">
              <Badge
                variant="secondary"
                className="shimmer-badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] px-2 transition-all hover:scale-105 hover:shadow-sm hover:shadow-emerald-200/50 dark:hover:shadow-emerald-800/30"
              >
                <Shield className="w-3 h-3 mr-1" />
                On-Device
              </Badge>
              <Badge
                variant="secondary"
                className="shimmer-badge bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] px-2 transition-all hover:scale-105 hover:shadow-sm hover:shadow-amber-200/50 dark:hover:shadow-amber-800/30"
              >
                <WifiOff className="w-3 h-3 mr-1" />
                No Cloud PII
              </Badge>
              <Badge
                variant="secondary"
                className="shimmer-badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-[10px] px-2 transition-all hover:scale-105 hover:shadow-sm"
              >
                <Cpu className="w-3 h-3 mr-1" />
                Qwen3-4B FT
              </Badge>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 header-toolbar">
              {/* Language selector */}
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[120px] h-8 text-xs border-slate-200 dark:border-slate-700">
                  <Globe className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  <SelectValue placeholder="Language">
                    {currentLang ? `${currentLang.nativeName}` : "Select Language"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.nativeName}</span>
                        <span className="text-slate-400 text-[10px]">({lang.name})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Dark Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-amber-500 transition-colors"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle dark mode"
                    suppressHydrationWarning
                  >
                    <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>

              {/* Model Info */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:text-purple-400 dark:hover:bg-purple-900/20 rounded-full transition-all"
                    onClick={() => setModelInfoOpen(true)}
                    aria-label="Model information"
                  >
                    <Brain className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Model Info</TooltipContent>
              </Tooltip>

              {/* Benchmarks */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:text-cyan-400 dark:hover:bg-cyan-900/20 rounded-full transition-all"
                    onClick={() => setBenchmarkOpen(true)}
                    aria-label="Benchmarks"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Benchmarks</TooltipContent>
              </Tooltip>

              {/* EMI Calculator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-full transition-all"
                    onClick={() => setEmiOpen(true)}
                    aria-label="EMI Calculator"
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>EMI Calculator</TooltipContent>
              </Tooltip>

              {/* SIP Calculator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:text-teal-400 dark:hover:bg-teal-900/20 rounded-full transition-all"
                    onClick={() => setSipOpen(true)}
                    aria-label="SIP Calculator"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>SIP Calculator</TooltipContent>
              </Tooltip>

              {/* Compound Interest Calculator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 rounded-full transition-all"
                    onClick={() => setCiOpen(true)}
                    aria-label="Compound Interest Calculator"
                  >
                    <Percent className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compound Interest Calculator</TooltipContent>
              </Tooltip>

              {/* Tax Calculator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 rounded-full transition-all"
                    onClick={() => setTaxOpen(true)}
                    aria-label="Tax Calculator"
                  >
                    <Scale className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tax Calculator</TooltipContent>
              </Tooltip>

              {/* Retirement Calculator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:text-pink-400 dark:hover:bg-pink-900/20 rounded-full transition-all"
                    onClick={() => setRetirementOpen(true)}
                    aria-label="Retirement Calculator"
                  >
                    <HeartPulse className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Retirement Calculator</TooltipContent>
              </Tooltip>

              {/* Inflation Calculator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 rounded-full transition-all"
                    onClick={() => setInflationOpen(true)}
                    aria-label="Inflation Calculator"
                  >
                    <TrendingDown className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Inflation Calculator</TooltipContent>
              </Tooltip>

              {/* Health Score */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-full transition-all"
                    onClick={() => setHealthScoreOpen(true)}
                    aria-label="Financial Health Score"
                  >
                    <Activity className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Financial Health Score</TooltipContent>
              </Tooltip>

              {/* Financial Goals */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-full transition-all"
                    onClick={() => setGoalsOpen(true)}
                    aria-label="Financial Goals"
                  >
                    <Target className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Financial Goals / वित्तीय लक्ष्य</TooltipContent>
              </Tooltip>

              {/* Finance Quiz */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:text-teal-400 dark:hover:bg-teal-900/20 rounded-full transition-all"
                    onClick={() => setQuizOpen(true)}
                    aria-label="Finance Quiz"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Finance Quiz / वित्तीय क्विज़</TooltipContent>
              </Tooltip>

              {/* Expense Split */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 rounded-full transition-all"
                    onClick={() => setSplitOpen(true)}
                    aria-label="Expense Split"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Expense Split / खर्चा बांटें</TooltipContent>
              </Tooltip>

              {/* Search Chat */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 transition-colors ${showSearch ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"}`}
                    onClick={() => setShowSearch(!showSearch)}
                    disabled={messages.length === 0}
                    aria-label="Search messages"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search messages</TooltipContent>
              </Tooltip>

              {/* Share Summary */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    onClick={handleShareSummary}
                    disabled={messages.length === 0}
                    aria-label="Share summary"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share summary</TooltipContent>
              </Tooltip>

              {/* Export Chat */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-teal-500 transition-colors"
                    onClick={handleExportChat}
                    disabled={messages.length === 0}
                    aria-label="Export chat"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export chat</TooltipContent>
              </Tooltip>

              {/* Print Chat */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onClick={() => window.print()}
                    disabled={messages.length === 0}
                    aria-label="Print chat"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print chat</TooltipContent>
              </Tooltip>

              {/* Clear Chat */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-rose-500 transition-colors"
                    onClick={clearChat}
                    aria-label="Clear chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear chat</TooltipContent>
              </Tooltip>

              {/* Sidebar toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 md:hidden"
                    onClick={toggleSidebar}
                    aria-label="Toggle panel"
                  >
                    <PanelRightOpen className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle panel</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 hidden md:flex ${isSidebarOpen
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400"
                      }`}
                    onClick={toggleSidebar}
                    aria-label="Toggle panel"
                  >
                    {isSidebarOpen ? (
                      <PanelRightClose className="w-4 h-4" />
                    ) : (
                      <PanelRightOpen className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSidebarOpen ? "Hide panel" : "Show panel"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* ============ MAIN CONTENT ============ */}
        <main className="flex-1 flex max-w-7xl mx-auto w-full">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages area with subtle animated gradient background */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto relative chat-bg-pattern"
              style={{ scrollbarGutter: "stable" }}
            >
              {/* Faint animated gradient background */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-50/30 via-transparent to-teal-50/30 dark:from-emerald-950/10 dark:via-transparent dark:to-teal-950/10" />

              {/* Tips Banner */}
              <FinancialTipsBanner />

              {/* Search Bar */}
              <AnimatePresence>
                {showSearch && messages.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden relative z-20"
                  >
                    <div className="max-w-3xl mx-auto px-4 py-2">
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
                        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={language === "en" ? "Search messages..." : "संदेश खोजें..."}
                          className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                          autoFocus
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {searchQuery && (
                        <p className="text-[10px] text-slate-400 mt-1 text-center">
                          {messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} of {messages.length} messages match
                        </p>
                      )}
                      {/* Bookmark filter toggle */}
                      {messages.some((m) => m.bookmarked) && (
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <button
                            onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${showBookmarkedOnly
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                : "text-slate-400 border-slate-200 dark:border-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400"
                              }`}
                          >
                            <Bookmark className={`w-3 h-3 ${showBookmarkedOnly ? "fill-current" : ""}`} />
                            {showBookmarkedOnly ? "Showing bookmarked only" : "Show bookmarked only"}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="floating-particle" style={{ left: "10%", top: "15%", animationDelay: "0s" }} />
                <div className="floating-particle" style={{ left: "25%", top: "60%", animationDelay: "2s" }} />
                <div className="floating-particle" style={{ left: "50%", top: "30%", animationDelay: "4s" }} />
                <div className="floating-particle" style={{ left: "70%", top: "70%", animationDelay: "1s" }} />
                <div className="floating-particle" style={{ left: "85%", top: "20%", animationDelay: "3s" }} />
                <div className="floating-particle" style={{ left: "40%", top: "80%", animationDelay: "5s" }} />
                <div className="floating-particle" style={{ left: "15%", top: "45%", animationDelay: "2.5s" }} />
                <div className="floating-particle" style={{ left: "60%", top: "10%", animationDelay: "1.5s" }} />
              </div>

              {messages.length === 0 ? (
                <WelcomeScreen onQueryClick={handleQueryClick} />
              ) : (
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 relative z-10">
                  {/* Model info header */}
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">अ</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        ArthSathi — अर्थसाथी
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
                        On-Device Vernacular Financial Advisor •{" "}
                        {currentLang?.nativeName || "हिन्दी"} Mode
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0"
                    >
                      <Lock className="w-2.5 h-2.5 mr-0.5" />
                      Private
                    </Badge>
                  </div>

                  {messages
                    .filter((msg) => !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter((msg) => !showBookmarkedOnly || msg.bookmarked)
                    .map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        language={language}
                        reaction={msg.reaction}
                        onReaction={setReaction}
                        searchQuery={searchQuery}
                        bookmarked={msg.bookmarked}
                        onToggleBookmark={toggleBookmark}
                      />
                    ))}
                  {isLoading && <TypingIndicator language={language} />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 relative z-10 input-area-glow">
              <div className="max-w-3xl mx-auto px-4 py-3">
                {/* Quick chips (mobile) */}
                <div className="md:hidden flex gap-1.5 mb-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {SAMPLE_QUERIES.slice(0, 5).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQueryClick(q.hindi)}
                      className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
                    >
                      {q.hindi}
                    </button>
                  ))}
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        language === "en"
                          ? "Ask about FD rates, tax saving, PPF, EMI..."
                          : language === "hi"
                            ? "FD दरें, टैक्स बचत, PPF, EMI के बारे में पूछें..."
                            : language === "ta"
                              ? "FD விகிதங்கள், வரி சேமிப்பு, PPF பற்றி கேளுங்கள்..."
                              : "FD दरें, टैक्स बचत, PPF के बारे में पूछें..."
                      }
                      className="resize-none min-h-[44px] max-h-[120px] pr-12 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-emerald-300 dark:focus:border-emerald-700 focus:ring-emerald-200 dark:focus:ring-emerald-800 rounded-xl input-focus-ring"
                      rows={1}
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5 text-[9px] text-slate-300 dark:text-slate-600">
                            <Lock className="w-2.5 h-2.5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Your data stays on device
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Voice Input Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant="ghost"
                        size="icon"
                        className={`h-11 w-11 rounded-xl flex-shrink-0 transition-all ${isRecording
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                            : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          }`}
                        disabled={isLoading || isTranscribing}
                      >
                        {isTranscribing ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRecording ? "रुकें / Stop recording" : "बोलकर पूछें / Speak your question"}
                    </TooltipContent>
                  </Tooltip>

                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 disabled:opacity-40 disabled:shadow-none flex-shrink-0 transition-all ${input.trim() && !isLoading ? "animate-send-pulse" : ""
                      }`}
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  🔒 On-device processing • No PII sent to cloud •{" "}
                  {currentLang?.nativeName || "हिन्दी"} mode
                </p>
              </div>
            </div>
          </div>

          {/* ============ SIDEBAR ============ */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden md:flex flex-col border-l border-slate-200 dark:border-slate-800 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 overflow-hidden flex-shrink-0"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      Reference Panel
                    </h2>
                    <Badge
                      variant="secondary"
                      className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0"
                    >
                      <Zap className="w-2.5 h-2.5 mr-0.5" />
                      Quick Ref
                    </Badge>
                  </div>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(v) =>
                    setActiveTab(v as "conversations" | "queries" | "rates" | "schemes" | "tax" | "model")
                  }
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="px-4 pt-2">
                    <TabsList className="w-full h-8 bg-slate-100 dark:bg-slate-800 p-0.5 flex-wrap gap-0.5">
                      <TabsTrigger
                        value="conversations"
                        className="text-[9px] h-7 flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 relative data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:top-1 data-[state=active]:after:bottom-1 data-[state=active]:after:w-[2px] data-[state=active]:after:bg-emerald-500 data-[state=active]:after:rounded-full"
                      >
                        <MessageSquare className="w-3 h-3 mr-0.5" />
                        Chats
                      </TabsTrigger>
                      <TabsTrigger
                        value="queries"
                        className="text-[9px] h-7 flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 relative data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:top-1 data-[state=active]:after:bottom-1 data-[state=active]:after:w-[2px] data-[state=active]:after:bg-emerald-500 data-[state=active]:after:rounded-full"
                      >
                        <Sparkles className="w-3 h-3 mr-0.5" />
                        Queries
                      </TabsTrigger>
                      <TabsTrigger
                        value="rates"
                        className="text-[9px] h-7 flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 relative data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:top-1 data-[state=active]:after:bottom-1 data-[state=active]:after:w-[2px] data-[state=active]:after:bg-emerald-500 data-[state=active]:after:rounded-full"
                      >
                        <Landmark className="w-3 h-3 mr-0.5" />
                        FD
                      </TabsTrigger>
                      <TabsTrigger
                        value="schemes"
                        className="text-[9px] h-7 flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 relative data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:top-1 data-[state=active]:after:bottom-1 data-[state=active]:after:w-[2px] data-[state=active]:after:bg-emerald-500 data-[state=active]:after:rounded-full"
                      >
                        <PiggyBank className="w-3 h-3 mr-0.5" />
                        Schemes
                      </TabsTrigger>
                      <TabsTrigger
                        value="tax"
                        className="text-[9px] h-7 flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 relative data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:top-1 data-[state=active]:after:bottom-1 data-[state=active]:after:w-[2px] data-[state=active]:after:bg-emerald-500 data-[state=active]:after:rounded-full"
                      >
                        <Scale className="w-3 h-3 mr-0.5" />
                        Tax
                      </TabsTrigger>
                      <TabsTrigger
                        value="model"
                        className="text-[9px] h-7 flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 relative data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:top-1 data-[state=active]:after:bottom-1 data-[state=active]:after:w-[2px] data-[state=active]:after:bg-emerald-500 data-[state=active]:after:rounded-full"
                      >
                        <Brain className="w-3 h-3 mr-0.5" />
                        Model
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    <TabsContent value="conversations" className="mt-0">
                      <ConversationsPanel />
                    </TabsContent>
                    <TabsContent value="queries" className="mt-0">
                      <SampleQueriesPanel onQueryClick={handleQueryClick} />
                    </TabsContent>
                    <TabsContent value="rates" className="mt-0">
                      <FdRatesPanel />
                    </TabsContent>
                    <TabsContent value="schemes" className="mt-0">
                      <SchemesPanel />
                    </TabsContent>
                    <TabsContent value="tax" className="mt-0">
                      <TaxSlabsPanel />
                    </TabsContent>
                    <TabsContent value="model" className="mt-0">
                      <ModelTabPanel onBenchmarkClick={() => setBenchmarkOpen(true)} />
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Model Info footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                  <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <Cpu className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Model Info
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>Base Model</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            Qwen3-4B FT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Domain</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            Indian Finance
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Languages</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            8+ Vernacular
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            On-Device
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </main>

        {/* ============ FOOTER ============ */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 relative footer-gradient">
          {/* Indian flag color stripe */}
          <div className="absolute top-0 left-0 right-0 h-[2px] flex">
            <div className="flex-1 bg-[#FF9933]" /> {/* Saffron */}
            <div className="flex-1 bg-white dark:bg-slate-300" /> {/* White */}
            <div className="flex-1 bg-[#138808]" /> {/* Green */}
          </div>
          <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center pt-1 gap-0.5">
            <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/50 font-medium text-center">
              Qwen3-4B Fine-tuned on FinanceParam + finance-alpaca
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              🔒 ArthSathi (अर्थसाथी) — Evaluated on BhashaBench-Finance: 86.4% Accuracy • AI-generated advice, not financial recommendation
            </p>
            <p className="text-[9px] text-slate-400/70 dark:text-slate-500/70 text-center">
              ArthSathi is not affiliated with RBI, SEBI, or IRDAI • Data sources: RBI, NPCI, India Post
            </p>
            <Badge
              variant="secondary"
              className="mt-0.5 text-[8px] px-1.5 py-0 h-4 bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700"
            >
              v2.0
            </Badge>
          </div>
        </footer>

        {/* ============ CALCULATOR DIALOGS ============ */}
        <EmiCalculator open={emiOpen} onOpenChange={setEmiOpen} />
        <SipCalculator open={sipOpen} onOpenChange={setSipOpen} />
        <TaxCalculator open={taxOpen} onOpenChange={setTaxOpen} />
        <CompoundInterestCalculator open={ciOpen} onOpenChange={setCiOpen} />
        <RetirementCalculator open={retirementOpen} onOpenChange={setRetirementOpen} />
        <InflationCalculator open={inflationOpen} onOpenChange={setInflationOpen} />
        <HealthScoreDialog open={healthScoreOpen} onOpenChange={setHealthScoreOpen} />
        <ModelInfoDialog open={modelInfoOpen} onOpenChange={setModelInfoOpen} />
        <BenchmarkDialog open={benchmarkOpen} onOpenChange={setBenchmarkOpen} />
        <FinancialGoalsDialog open={goalsOpen} onOpenChange={setGoalsOpen} />
        <FinanceQuizDialog open={quizOpen} onOpenChange={setQuizOpen} />
        <ExpenseSplitDialog open={splitOpen} onOpenChange={setSplitOpen} />
      </div>
    </TooltipProvider>
  );
}
