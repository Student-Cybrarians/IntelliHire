import fs from 'fs';

const filePath = 'src/client/pages/Resume.tsx';
let code = fs.readFileSync(filePath, 'utf-8');

const exportFunc = `
  const exportATSResume = async (type: 'global' | 'tailored') => {
    if (!resumeId) return;
    try {
      window.location.href = \`/api/resume/\${resumeId}/export?type=\${type}\`;
    } catch (e: any) {
      setError('Failed to export: ' + e.message);
    }
  };
`;

if (!code.includes("const exportATSResume")) {
    const applyOptimizationsMarker = "const handleUpload = async";
    code = code.replace(applyOptimizationsMarker, exportFunc + "\n  " + applyOptimizationsMarker);
}

const exportUI = `
            {resumeId && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  ATS Resume Generation
                </h2>
                <p className="text-slate-400 mb-6 text-sm">Download a pristine, 1-column ATS-compliant DOCX resume structured for maximum keyword extraction.</p>
                <div className="flex gap-4">
                  <button onClick={() => exportATSResume('global')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Export Global ATS Resume
                  </button>
                  {matchData && (
                    <button onClick={() => exportATSResume('tailored')} className="px-5 py-2.5 bg-[#FF4103] hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Export Job-Tailored ATS Resume
                    </button>
                  )}
                </div>
              </div>
            )}
`;

if (!code.includes("Export Global ATS Resume")) {
    // Add imports for Download and Target and FileText if not present
    if (!code.includes("Download")) {
        code = code.replace("import { FileText, Search", "import { FileText, Search, Download, Target");
    }
    
    // Inject right before the last </div></div>
    // Let's insert it right after the matchData block or inside the main grid.
    const insertionPoint = "{matchData && (";
    // Actually it's easier to inject before `{resumeId && !matchData && !extracting && (`
    const resumeBlockMarker = "{resumeId && !matchData && !extracting && (";
    code = code.replace(resumeBlockMarker, exportUI + "\n          " + resumeBlockMarker);
    
    fs.writeFileSync(filePath, code, 'utf-8');
    console.log("UI added!");
}
