import React, { useState, useEffect } from "react";
import {
    BrainCircuit,
    Upload,
    MessageSquare,
    AlertCircle,
    DollarSign,
    History as HistoryIcon,
    Clock,
    Search,
    FileText,
    TrendingUp
} from "lucide-react";

const PredictionPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [intent, setIntent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeId, setActiveId] = useState<number | null>(null);

    const API_BASE_URL = "https://proxyservice-1hx2.onrender.com" || "http://localhost:9090/api/predictions";

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/history`);
            if (response.ok) {
                const data = await response.json();
                setHistory(Array.isArray(data) ? [...data].reverse() : []);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleHistoryClick = (record: any) => {
        try {
            setError(null);
            setActiveId(record.id);
            setQuestion(record.questions);

            const savedResult = typeof record.result === "string"
                ? JSON.parse(record.result)
                : record.result;

            const finalAnswer = savedResult.answer ? savedResult.answer : savedResult;
            const parsedAnswer = typeof finalAnswer === "string" && finalAnswer.startsWith("{")
                ? JSON.parse(finalAnswer)
                : finalAnswer;

            setIntent(record.intent || "PAST_RECORD");
            setResult(parsedAnswer);

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            console.error("Error loading historical record:", e);
            setError("Could not parse this historical record.");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !question) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setActiveId(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("questions", question);

        try {
            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(`Server Error: ${response.statusText}`);

            const data = await response.json();
            setIntent(data.intent);

            const answer = typeof data.answer === "string" && data.answer.startsWith("{")
                ? JSON.parse(data.answer)
                : data.answer;

            setResult(answer);
            fetchHistory();
        } catch (err: any) {
            console.error("Connection failed:", err);
            setError("AI Service unreachable. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const DataTable = ({ title, data, type }: { title: string, data: any[], type: 'buy' | 'dead' }) => (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className={`p-4 border-b border-zinc-800 font-bold flex items-center gap-2 ${type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${type === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
                {title}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-widest border-b border-zinc-800">
                    <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right">Qty/Metric</th>
                        <th className="px-4 py-3 text-right">Financials</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                    {data && data.length > 0 ? data.map((item, i) => (
                        <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">{item.product || item.name || "Unknown"}</td>
                            <td className="px-4 py-3 text-right">{item.predicted_qty || item.quantity || item.value || 0}</td>
                            <td className="px-4 py-3 text-right text-zinc-400 font-mono">
                                ₹{(item.expected_revenue || item.profit || item.revenue || 0).toLocaleString()}
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-zinc-600 italic">No detailed metrics available.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_350px] min-h-screen bg-zinc-950 text-zinc-200">
            <div className="p-6 lg:p-10 space-y-8 border-r border-zinc-800">
                <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BrainCircuit className="text-cyan-500 h-9 w-9" />
                        AI Supply Chain Predictor
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Intent:</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
                            {intent || 'Awaiting Analysis'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                        <label className="block text-xs font-bold text-zinc-500 mb-4 uppercase tracking-widest">Step 1: Data Source</label>
                        <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-zinc-700 hover:bg-zinc-800/50'}`}>
                            {file ? <FileText className="text-cyan-400 mb-3 h-8 w-8" /> : <Upload className="text-zinc-500 mb-3 h-8 w-8" />}
                            <span className="text-sm text-zinc-400 text-center px-4 truncate max-w-full">
                                {file ? file.name : "Upload CSV Data"}
                            </span>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <form onSubmit={handleAskAI} className="xl:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col gap-4 shadow-sm">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Step 2: AI Query</label>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g., Which products should I restock for next month?"
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                        >
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing Engine...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="h-5 w-5" />
                                    Execute Analysis
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3 text-red-400 animate-in fade-in zoom-in duration-300">
                        <AlertCircle className="shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(intent === "FORECAST" || intent === "PAST_RECORD") && result.forecast_30d_total && (
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-xl flex items-center gap-4 border-l-4 border-l-cyan-500">
                                    <div className="p-3 bg-cyan-500/10 rounded-lg">
                                        <DollarSign className="text-cyan-400" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">30D Projected Forecast</span>
                                        <p className="text-2xl font-bold text-white">{result.forecast_30d_total}</p>
                                    </div>
                                </div>
                            )}
                            {(intent === "HISTORICAL" || intent === "PAST_RECORD") && result.total_revenue && (
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-xl flex items-center gap-4 border-l-4 border-l-green-500">
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                        <HistoryIcon className="text-green-400" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Total Historical Revenue</span>
                                        <p className="text-2xl font-bold text-white font-mono">₹{result.total_revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex gap-5 items-start shadow-xl border-l-4 border-l-cyan-500">
                            <div className="shrink-0 p-2 bg-cyan-500/10 rounded-full">
                                <MessageSquare className="text-cyan-400 h-5 w-5" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">AI Strategy Insight</span>
                                <div className="text-zinc-200 leading-relaxed text-lg font-medium">
                                    {typeof result === 'string' ? result : (result.message || result.summary || "Analysis report generated successfully.")}
                                </div>
                            </div>
                        </div>

                        {(result.top_buy_list || result.least_priority_list) && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <DataTable title="Optimized Buy List" type="buy" data={result.top_buy_list || []} />
                                <DataTable title="Low Velocity / Risk" type="dead" data={result.least_priority_list || []} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-zinc-900/50 flex flex-col h-screen lg:sticky lg:top-0 border-l border-zinc-800 shadow-2xl">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="text-zinc-500 w-5 h-5" />
                        Analysis History
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Loading Records</span>
                        </div>
                    ) : history.length > 0 ? (
                        history.map((record) => (
                            <button
                                key={record.id}
                                onClick={() => handleHistoryClick(record)}
                                className={`w-full text-left p-4 border rounded-xl transition-all group relative overflow-hidden ${
                                    activeId === record.id
                                        ? 'bg-cyan-500/10 border-cyan-500/50'
                                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${activeId === record.id ? 'text-cyan-400' : 'text-zinc-500'}`}>
                                        {new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <Search className={`w-3.5 h-3.5 transition-colors ${activeId === record.id ? 'text-cyan-400' : 'text-zinc-700 group-hover:text-zinc-500'}`} />
                                </div>
                                <p className={`text-sm line-clamp-2 leading-snug ${activeId === record.id ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                                    {record.questions}
                                </p>
                                {activeId === record.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <Clock className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                            <p className="text-zinc-600 text-sm italic">No past analyses found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionPage;
