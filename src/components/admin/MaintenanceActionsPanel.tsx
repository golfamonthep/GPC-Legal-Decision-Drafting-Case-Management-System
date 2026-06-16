"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Settings, Zap, CheckCircle, XCircle, Info, RefreshCcw } from "lucide-react";

type RiskLevel = "low" | "medium" | "high";

interface ActionMetadata {
  id: string;
  label: string;
  description: string;
  riskLevel: RiskLevel;
  supportsDryRun: boolean;
  requiresConfirmation: boolean;
  confirmationPhrase?: string;
}

interface ActionResult {
  ok: boolean;
  actionId: string;
  dryRun: boolean;
  status: string;
  message: string;
  summary?: any;
  warnings?: string[];
  auditId?: string;
}

export function MaintenanceActionsPanel() {
  const [actions, setActions] = useState<ActionMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  
  const [inputs, setInputs] = useState<Record<string, { dryRun: boolean; phrase: string }>>({});

  useEffect(() => {
    fetch("/api/admin/maintenance/actions/metadata")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load actions");
        return res.json();
      })
      .then(data => {
        setActions(data.actions || []);
        const initInputs: any = {};
        (data.actions || []).forEach((a: ActionMetadata) => {
          initInputs[a.id] = { dryRun: a.supportsDryRun, phrase: "" };
        });
        setInputs(initInputs);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const handleExecute = async (actionId: string) => {
    setExecuting(actionId);
    setError(null);
    const input = inputs[actionId];

    try {
      const res = await fetch("/api/admin/maintenance/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId,
          dryRun: input.dryRun,
          confirmationPhrase: input.phrase || undefined,
        })
      });

      const data = await res.json();
      setResults(prev => ({ ...prev, [actionId]: data }));
    } catch (e: any) {
      setResults(prev => ({
        ...prev,
        [actionId]: {
          ok: false,
          actionId,
          dryRun: input.dryRun,
          status: "failed",
          message: e.message || "Network error"
        }
      }));
    } finally {
      setExecuting(null);
    }
  };

  if (loading) return <div className="text-sm text-slate-500 animate-pulse">Loading actions...</div>;
  if (error) return <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md">{error}</div>;

  return (
    <div className="space-y-6">
      {actions.map((action) => {
        const input = inputs[action.id] || { dryRun: true, phrase: "" };
        const result = results[action.id];
        const isExecuting = executing === action.id;

        const needsPhrase = !input.dryRun && action.requiresConfirmation;
        const canExecute = !needsPhrase || input.phrase === action.confirmationPhrase;

        return (
          <div key={action.id} className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{action.label}</h3>
                  {action.riskLevel === 'high' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">High Risk</span>}
                  {action.riskLevel === 'medium' && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Medium Risk</span>}
                  {action.riskLevel === 'low' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Low Risk</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">{action.description}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-4 rounded-md border border-slate-100">
              {action.supportsDryRun && (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={input.dryRun}
                    onChange={(e) => setInputs(prev => ({ ...prev, [action.id]: { ...prev[action.id], dryRun: e.target.checked } }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Run in Dry-Run Mode (Safe)
                </label>
              )}

              {needsPhrase && (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-600 uppercase">Type '{action.confirmationPhrase}' to confirm:</span>
                  <input 
                    type="text"
                    value={input.phrase}
                    onChange={(e) => setInputs(prev => ({ ...prev, [action.id]: { ...prev[action.id], phrase: e.target.value } }))}
                    className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder={action.confirmationPhrase}
                  />
                </div>
              )}

              <div className="sm:ml-auto">
                <button
                  onClick={() => handleExecute(action.id)}
                  disabled={isExecuting || !canExecute}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors ${
                    isExecuting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                    !canExecute ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                    !input.dryRun && action.riskLevel === 'high' ? 'bg-red-600 text-white hover:bg-red-700' :
                    'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isExecuting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isExecuting ? 'Running...' : 'Execute Action'}
                </button>
              </div>
            </div>

            {result && (
              <div className={`text-sm p-4 rounded-md border ${
                result.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.ok ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className={`font-semibold ${result.ok ? 'text-green-800' : 'text-red-800'}`}>
                    {result.status.toUpperCase()}: {result.message}
                  </span>
                </div>
                {result.dryRun && <div className="text-xs font-medium text-slate-600 mb-2">[DRY RUN - No changes made]</div>}
                {result.summary && (
                  <pre className="text-xs bg-white/50 p-2 rounded overflow-auto max-h-40 border border-slate-200">
                    {JSON.stringify(result.summary, null, 2)}
                  </pre>
                )}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    <div className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Warnings:</div>
                    <ul className="list-disc list-inside">
                      {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                {result.auditId && (
                  <div className="mt-2 text-[10px] text-slate-400">Audit ID: {result.auditId}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
