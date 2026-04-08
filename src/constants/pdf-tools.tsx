import { 
  Combine, 
  Scissors, 
  Layout, 
  RotateCw, 
  Hash, 
  FileEdit, 
  Stamp, 
  Crop, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  PenTool, 
  Minimize2, 
  Wrench, 
  Archive, 
  FileSearch, 
  Sparkles, 
  Languages, 
  Copy, 
  Camera,
  FileText,
  FileImage,
  Presentation,
  Table,
  FileJson,
  Code,
  ImageIcon,
  Palette,
  Trash2,
  Files,
  Maximize2
} from "lucide-react";

export type ToolCategory = 
  | "merge-organize" 
  | "convert-from" 
  | "convert-to" 
  | "edit-modify" 
  | "security" 
  | "optimize" 
  | "ai-powered";

export interface PDFTool {
  id: string;
  label: string;
  icon: any;
  description: string;
  category: ToolCategory;
  isBackend?: boolean;
}

export const PDF_CATEGORIES: { id: ToolCategory; label: string }[] = [
  { id: "merge-organize", label: "Merge & Organize" },
  { id: "convert-from", label: "Convert From PDF" },
  { id: "convert-to", label: "Convert To PDF" },
  { id: "edit-modify", label: "Edit & Modify" },
  { id: "security", label: "Security & Signing" },
  { id: "optimize", label: "Optimize & Repair" },
  { id: "ai-powered", label: "AI Powered Tools" },
];

export const PDF_TOOLS: PDFTool[] = [
  // Category: Merge & Organize
  {
    id: "merge",
    label: "Merge PDF",
    icon: Combine,
    description: "Combine multiple PDF files into one.",
    category: "merge-organize"
  },
  {
    id: "split",
    label: "Split PDF",
    icon: Scissors,
    description: "Extract specific pages or ranges from a PDF.",
    category: "merge-organize"
  },
  {
    id: "organize",
    label: "Organize PDF",
    icon: Layout,
    description: "Reorder, delete or duplicate pages in your PDF.",
    category: "merge-organize"
  },
  {
    id: "rotate",
    label: "Rotate PDF",
    icon: RotateCw,
    description: "Rotate individual or all pages in your PDF.",
    category: "merge-organize"
  },
  {
    id: "delete-pages",
    label: "Delete Pages",
    icon: Trash2,
    description: "Permanently remove pages from your PDF.",
    category: "merge-organize"
  },
  {
    id: "extract-pages",
    label: "Extract Pages",
    icon: Files,
    description: "Save selected pages as a new PDF file.",
    category: "merge-organize"
  },
  {
    id: "page-numbers",
    label: "Page Numbers",
    icon: Hash,
    description: "Add page numbers to your PDF document.",
    category: "merge-organize"
  },

  // Category: Convert From PDF
  {
    id: "pdf-to-word",
    label: "PDF to Word",
    icon: FileText,
    description: "Convert PDF documents to editable DOCX files.",
    category: "convert-from"
  },
  {
    id: "pdf-to-ppt",
    label: "PDF to PowerPoint",
    icon: Presentation,
    description: "Convert PDF pages to slides in a PPTX file.",
    category: "convert-from"
  },
  {
    id: "pdf-to-excel",
    label: "PDF to Excel",
    icon: Table,
    description: "Extract tables and data to XLSX spreadsheets.",
    category: "convert-from"
  },
  {
    id: "pdf-to-image",
    label: "PDF to Image",
    icon: FileImage,
    description: "Convert each PDF page into a high-quality Image.",
    category: "convert-from"
  },

  // Category: Convert To PDF
  {
    id: "image-to-pdf",
    label: "Image to PDF",
    icon: ImageIcon,
    description: "Create a PDF from multiple images.",
    category: "convert-to"
  },
  {
    id: "word-to-pdf",
    label: "Word to PDF",
    icon: FileText,
    description: "Convert DOCX files to professional PDFs.",
    category: "convert-to"
  },
  {
    id: "ppt-to-pdf",
    label: "PowerPoint to PDF",
    icon: Presentation,
    description: "Transform presentation slides into PDF pages.",
    category: "convert-to"
  },
  {
    id: "excel-to-pdf",
    label: "Excel to PDF",
    icon: Table,
    description: "Convert spreadsheets to PDF tables.",
    category: "convert-to"
  },
  {
    id: "html-to-pdf",
    label: "HTML to PDF",
    icon: Code,
    description: "Convert HTML code or URLs to PDF documents.",
    category: "convert-to"
  },

  // Category: Edit & Modify
  {
    id: "edit",
    label: "Edit PDF",
    icon: FileEdit,
    description: "Add text, images, and shapes to your PDF.",
    category: "edit-modify"
  },
  {
    id: "watermark",
    label: "Watermark",
    icon: Stamp,
    description: "Add a text or image watermark to your PDF.",
    category: "edit-modify"
  },
  {
    id: "crop-pdf",
    label: "Crop PDF",
    icon: Crop,
    description: "Trim page margins or selected areas.",
    category: "edit-modify"
  },
  {
    id: "redact-pdf",
    label: "Redact PDF",
    icon: ShieldAlert,
    description: "Permanently hide sensitive information.",
    category: "edit-modify"
  },
  {
    id: "resize-pdf",
    label: "Resize PDF",
    icon: Maximize2,
    description: "Change page dimensions like A4 or Letter.",
    category: "edit-modify"
  },

  // Category: Security & Signing
  {
    id: "protect-pdf",
    label: "Protect PDF",
    icon: Lock,
    description: "Encrypt your PDF with a strong password.",
    category: "security"
  },
  {
    id: "unlock-pdf",
    label: "Unlock PDF",
    icon: Unlock,
    description: "Remove password protection from your PDF.",
    category: "security"
  },
  {
    id: "sign",
    label: "Sign PDF",
    icon: PenTool,
    description: "Add your official signature to any document.",
    category: "security"
  },

  // Category: Optimize & Repair
  {
    id: "compress-pdf",
    label: "Compress PDF",
    icon: Minimize2,
    description: "Reduce file size while maintaining quality.",
    category: "optimize"
  },
  {
    id: "repair-pdf",
    label: "Repair PDF",
    icon: Wrench,
    description: "Recover data from damaged PDF files.",
    category: "optimize"
  },
  {
    id: "optimize-pdf",
    label: "Optimize PDF",
    icon: Sparkles,
    description: "Structural clean and web optimization.",
    category: "optimize"
  },
  {
    id: "grayscale-pdf",
    label: "PDF to Grayscale",
    icon: Palette,
    description: "Convert color documents to B&W.",
    category: "optimize"
  },
  {
    id: "pdf-to-pdfa",
    label: "PDF to PDF/A",
    icon: Archive,
    description: "Convert to PDF/A for long-term archiving.",
    category: "optimize"
  },

  // Category: AI Powered Tools
  {
    id: "ocr",
    label: "OCR PDF",
    icon: FileSearch,
    description: "Make scanned PDFs searchable and selectable.",
    category: "ai-powered"
  },
  {
    id: "summarize",
    label: "AI Summarizer",
    icon: Sparkles,
    description: "Distill long PDFs into key actionable points.",
    category: "ai-powered",
    isBackend: true
  },
  {
    id: "translate",
    label: "Translate PDF",
    icon: Languages,
    description: "Translate your PDF into any language with AI.",
    category: "ai-powered",
    isBackend: true
  },
  {
    id: "compare",
    label: "Compare PDF",
    icon: Copy,
    description: "Highlight differences between two PDF versions.",
    category: "ai-powered"
  },
  {
    id: "scan",
    label: "Scan to PDF",
    icon: Camera,
    description: "Turn your device camera into a document scanner.",
    category: "ai-powered"
  },
];
