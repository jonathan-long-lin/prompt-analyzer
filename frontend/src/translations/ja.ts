export const ja = {
  // Header
  title: "プロンプト分析ダッシュボード",
  subtitle: "AI搭載のインサイトでプロンプトを分析・最適化",
  
  // Navigation
  analyticsTab: "分析ダッシュボード",
  promptAnalyzerTab: "プロンプト分析器",
  
  // Language selector
  language: "言語",
  japanese: "日本語",
  english: "English",
  
  // Analytics Dashboard
  analytics: {
    title: "分析ダッシュボード",
    overview: "概要",
    totalPrompts: "総プロンプト数",
    uniqueUsers: "ユニークユーザー数",
    dateRange: "期間",
    totalTokens: "総トークン数",
    avgQuality: "平均品質",
    totalCost: "総コスト",
    
    // User Analytics
    userAnalytics: "ユーザー分析",
    topUsers: "トップユーザー",
    userName: "ユーザー名",
    promptCount: "プロンプト数",
    avgTokens: "平均トークン数",
    quality: "品質",
    cost: "コスト",
    
    // Temporal Analysis
    temporalAnalysis: "時系列分析",
    hourly: "時間別",
    daily: "日次",
    weekly: "週次",
    monthly: "月次",
    period: "期間",
    prompts: "プロンプト数",
    tokens: "トークン数",
    users: "ユーザー数",
    
    // Model Performance
    modelPerformance: "モデルパフォーマンス",
    model: "モデル",
    avgResponseTime: "平均応答時間",
    usage: "使用率",
    
    // Category Distribution
    categoryDistribution: "カテゴリー分布",
    category: "カテゴリー",
    
    // Common
    noDataAvailable: "データがありません",
    resetSort: "ソートリセット",
    loading: "読み込み中...",
    error: "エラー",
    sortedBy: "ソート順",
  },
  
  // Prompt Analyzer
  promptAnalyzer: {
    title: "プロンプト分析器",
    enterPrompt: "プロンプトを入力してください",
    enterPromptError: "分析するプロンプトを入力してください",
    analyze: "分析",
    analyzing: "分析中...",
    clear: "クリア",
    results: "結果",
    basicMetrics: "基本指標",
    suggestions: "改善提案",
    wordCount: "単語数",
    characterCount: "文字数",
    sentenceCount: "文数",
    paragraphCount: "段落数",
    readabilityScore: "読みやすさスコア",
    complexityLevel: "複雑さレベル",
    keywords: "キーワード",
    sentiment: "感情",
    readability: "読みやすさ",
    score: "スコア",
    level: "レベル",
    sentimentAnalysis: "感情分析",
    analysisError: "プロンプトの分析に失敗しました。バックエンドが実行されていることを確認してください。",
    // Add more translations as needed
  }
};

export type TranslationKey = keyof typeof ja;
