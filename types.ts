export enum ModuleType {
  BUDGET = 'budget',
  TRAVEL = 'travel',
  INVESTMENT = 'investment',
  PROJECTION = 'projection'
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  ASSET = 'asset' // For investments
}

export interface Transaction {
  id: string;
  moduleId: ModuleType;
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  category?: string;
  note?: string;
}

export interface ModuleConfig {
  id: ModuleType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface AIAnalysisResult {
  summary: string;
  tips: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface User {
  name: string;
  email: string;
}