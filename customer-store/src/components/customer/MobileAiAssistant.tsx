import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface InsightMessage {
  id: string;
  type: 'trend' | 'warning' | 'urgent';
  message: string;
  metric?: string;
}

export const MobileAiAssistant: React.FC = () => {
  const insights: InsightMessage[] = [
    {
      id: '1',
      type: 'trend',
      message: 'Based on your profile, these items are predicted to drop in availability next week.',
      metric: 'High Demand',
    },
    {
      id: '2',
      type: 'warning',
      message: 'Only 3 lots remaining near your location.',
      metric: 'Stock Low - Fast Checkout Recommended',
    },
  ];

  return (
    <div className="mx-4 my-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-purple-100 shadow-sm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-100 p-1.5 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-800 text-sm tracking-tight">Prophet AI Fit Check</h3>
        </div>

        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-white/50"
            >
              <div className="flex items-start gap-2.5">
                {insight.type === 'trend' ? (
                  <TrendingUp className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                ) : insight.type === 'warning' ? (
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                )}

                <div className="flex-1">
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    {insight.message}
                  </p>
                  {insight.metric && (
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                      {insight.metric}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
