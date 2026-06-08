import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database, CheckCircle, XCircle, Clock } from "lucide-react";
import GenerateEmbeddingsButton from "./GenerateEmbeddingsButton";

export default async function ViewChunksPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const source = await prisma.legalSource.findUnique({
    where: { id },
    include: {
      documentChunks: {
        orderBy: { chunkIndex: 'asc' }
      }
    }
  });

  if (!source) {
    notFound();
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/library" className="p-2 text-slate-500 hover:text-slate-800 bg-white rounded-full border border-slate-200 shadow-sm transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-indigo-600" />
            Document Chunks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chunks for: <span className="font-medium text-slate-700">{source.title}</span>
          </p>
        </div>
        <div className="ml-auto">
          <GenerateEmbeddingsButton sourceId={source.id} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500 block mb-1">Total Chunks</span>
            <span className="font-semibold text-slate-900 text-lg">{source.documentChunks.length}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Document Type</span>
            <span className="font-medium text-slate-900">{source.documentType || '-'}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Status</span>
            <span className="font-medium text-slate-900">{source.sourceStatus || '-'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {source.documentChunks.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500">No chunks found. Please ingest the document first.</p>
          </div>
        ) : (
          source.documentChunks.map((chunk) => (
            <div key={chunk.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-700 text-sm">Chunk #{chunk.chunkIndex}</span>
                  {(chunk as any).embeddingStatus === 'completed' && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      <CheckCircle className="h-3 w-3" /> Embeddings
                    </span>
                  )}
                  {(chunk as any).embeddingStatus === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200" title={(chunk as any).embeddingError || 'Error'}>
                      <XCircle className="h-3 w-3" /> Error
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                  {chunk.content.length} chars
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-serif">
                  {chunk.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
