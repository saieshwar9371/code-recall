'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Terminal, 
  RefreshCw, 
  Sparkles, 
  Code2, 
  Download, 
  Trash2, 
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_CODE = `# Welcome to Code Recall Playground
# Practice your Python skills here!

def greet(name):
    return f"Hello, {name}!"

name = input("Enter your name: ")
print(greet(name))
`;

export default function PlaygroundView() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string | null>(null);
  const [stdin, setStdin] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  // Load saved code from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem('playground-code');
    if (savedCode) setCode(savedCode);
  }, []);

  // Save code to localStorage on change
  const handleCodeChange = (val: string | undefined) => {
    const newCode = val || "";
    setCode(newCode);
    localStorage.setItem('playground-code', newCode);
  };

  const runCode = async () => {
    setIsExecuting(true);
    setOutput(null);
    
    try {
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [{ content: code }],
          stdin: stdin,
        }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed with status ${response.status}`);
      }

      const data = await response.json();
      const stdout = data.run?.stdout || "";
      const stderr = data.run?.stderr || "";
      
      setOutput(stderr || stdout || "Code executed successfully with no output.");
    } catch (err) {
      console.error("Execution Error:", err);
      setOutput("Error: Failed to connect to the execution server.");
    } finally {
      setIsExecuting(false);
    }
  };

  const clearCode = () => {
    if (window.confirm("Are you sure you want to clear your code?")) {
      setCode(DEFAULT_CODE);
      localStorage.setItem('playground-code', DEFAULT_CODE);
    }
  };

  const downloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "playground_code.py";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1800px] mx-auto h-[calc(100vh-160px)] min-h-[700px] animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 glass border border-white/5 rounded-[2rem] shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Code Playground</h1>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Premium Python IDE</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 mr-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[10px] uppercase font-black tracking-widest text-white/30">Python 3.10 Ready</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={downloadCode}
            className="rounded-xl h-10 w-10 hover:bg-white/5 text-white/40 hover:text-white"
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearCode}
            className="rounded-xl h-10 w-10 hover:bg-white/5 text-error/40 hover:text-error"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <div className="h-6 w-[1px] bg-white/10 mx-2" />

          <Button 
            onClick={runCode}
            disabled={isExecuting}
            className="bg-primary text-white hover:bg-primary/90 rounded-xl font-black text-[11px] uppercase tracking-widest px-8 h-11 shadow-lg shadow-primary/20 flex gap-2"
          >
            {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Run
          </Button>
        </div>
      </div>

      {/* Main Content: Left Big Panel & Right Small Panels */}
      <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden">
        
        {/* Left: Code Editor (70%) */}
        <div className="lg:flex-[2.5] flex flex-col rounded-[2.5rem] bg-[#020408] border border-white/10 overflow-hidden shadow-2xl relative">
          <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-error/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              </div>
              <div className="h-4 w-[1px] bg-white/10 mx-2" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black">main.py</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex items-center bg-white/5 rounded-lg border border-white/5 p-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                  className="h-7 w-7 p-0 rounded text-white/30 hover:text-white"
                >
                  -
                </Button>
                <span className="w-8 text-center text-[10px] font-mono text-white/40">{fontSize}px</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                  className="h-7 w-7 p-0 rounded text-white/30 hover:text-white"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-grow relative w-full h-full min-h-0">
            <Editor
              height="100%"
              width="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                fontSize: fontSize,
                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                minimap: { enabled: false },
                padding: { top: 24, bottom: 24 },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                lineHeight: 1.6,
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
                wordWrap: 'on',
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                }
              }}
            />
          </div>
        </div>

        {/* Right: Input & Output (30%) */}
        <div className="lg:flex-1 flex flex-col gap-6">
          
          {/* Input Panel (Top) */}
          <div className="flex-1 glass border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2 shrink-0">
              <Maximize2 className="w-4 h-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Standard Input</h3>
            </div>
            <div className="flex-grow p-1">
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter inputs here..."
                className="w-full h-full bg-transparent border-none rounded-2xl p-5 text-sm font-mono text-white/80 placeholder:text-white/10 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Output Panel (Bottom) */}
          <div className="flex-1 glass-darker border border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-success" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Execution Output</h3>
              </div>
              {output && (
                <button onClick={() => setOutput(null)} className="text-[9px] uppercase font-black text-white/20 hover:text-white transition-colors">Clear</button>
              )}
            </div>
            <div className="flex-grow p-6 overflow-y-auto font-mono text-sm leading-relaxed bg-black/40">
              {output ? (
                <pre className={cn(
                  "whitespace-pre-wrap break-words",
                  output.startsWith("Error:") ? "text-error/80" : "text-success/90"
                )}>
                  {output}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-white/5">
                  <Terminal className="w-10 h-10" />
                  <p className="text-[9px] uppercase font-black tracking-widest">No Output Yet</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
