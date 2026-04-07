"use client";

import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import PDFDropzone from "@/components/pdf-converter/PDFDropzone";
import PDFControls from "@/components/pdf-converter/PDFControls";
import PDFResultView from "@/components/pdf-converter/PDFResultView";
import { FileText, Settings, Download, Forward } from "lucide-react";

export default function PDFConverterPage() {
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("idle");

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <PageHeader
        icon="📄"
        title="PDF Converter"
        description="Convert, merge, and manipulate PDF documents with ease."
      />

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              Upload Document
            </h3>
            <PDFDropzone onUploadSuccess={(id) => {
              setJobId(id);
              setStatus("uploaded");
            }} />
          </section>

          {jobId && (
            <section className="rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-400" />
                Conversion Settings
              </h3>
              <PDFControls jobId={jobId} onProcessStarted={() => setStatus("processing")} />
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section className="rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-8 h-full">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-400" />
              Results
            </h3>
            <PDFResultView jobId={jobId} status={status} />
          </section>
        </div>
      </div>
    </div>
  );
}
