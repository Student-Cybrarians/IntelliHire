import { ArrowLeft, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <Construction className="w-10 h-10 text-brand-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-slate-400 mt-2">{description}</p>
        <p className="text-xs text-slate-500 mt-4">Route registered. This module is awaiting its implementation slice.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Command Center
        </Link>
      </div>
    </div>
  );
}
