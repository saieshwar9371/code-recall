'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, XCircle, Sparkles, Terminal, RefreshCw, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { difficultyBand, difficultyTone } from '@/lib/difficulty';
import { cn } from '@/lib/utils';

interface Test {
  input: string;
  output?: string;
  expected?: string;
}

interface CodingViewProps {
  title: string;
  description: string;
  initialCode: string;
  tests: Test[];
  onCorrect: () => void;
  difficulty?: number;
  hints?: string[];
  exampleInput?: string | null;
  exampleOutput?: string | null;
}

const toneStyles = {
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  orange: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  fuchsia: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-400',
};

const decodeEscapes = (value: string) =>
  value
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');

export default function CodingView({
  title,
  description,
  initialCode,
  tests,
  onCorrect,
  difficulty = 1,
  hints = [],
  exampleInput,
  exampleOutput,
}: CodingViewProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean, actual: string | null }[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  useEffect(() => {
    setCode(initialCode);
    setTestResults([]);
    setStatusMsg(null);
    setOutput(null);
  }, [initialCode]);

  const runCode = async (submit: boolean = false) => {
    setIsExecuting(true);
    setStatusMsg({ type: 'info', text: 'Compiling and running...' });
    
    try {
      // Run for all tests
      const results = await Promise.all(tests.map(async (test) => {
        const response = await fetch('/api/run-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: 'python',
            version: '3.10.0',
            files: [{ content: code }],
            stdin: test.input || "",
          }),
        });

        if (!response.ok) {
          throw new Error(`Code execution failed with status ${response.status}`);
        }

        const data = await response.json();
        const stdout = data.run?.stdout || "";
        const stderr = data.run?.stderr || "";
        const expectedOutput = decodeEscapes(test.output || test.expected || "");
        
        // Normalize line endings and trim before comparing
        const normalizedActual = stdout.replace(/\r\n/g, '\n').trim();
        const normalizedExpected = expectedOutput.replace(/\r\n/g, '\n').trim();
        const passed = normalizedActual === normalizedExpected;
        
        return { passed, actual: stdout, stderr };
      }));

      setTestResults(results);
      const firstStderr = results.find((r) => r.stderr)?.stderr;
      setOutput(firstStderr || results[0].actual); // Show a useful output in console panel

      const allPassed = results.every(r => r.passed);
      const hasError = results.some(r => r.stderr);

      if (hasError) {
        setStatusMsg({ type: 'error', text: 'Runtime Error: Check your syntax and logic.' });
      } else if (allPassed) {
        setStatusMsg({ type: 'success', text: 'All tests passed — concept understood.' });
        if (submit) {
          setTimeout(() => onCorrect(), 1200);
        }
      } else {
        setStatusMsg({ type: 'error', text: 'Some test cases failed. Review your logic.' });
      }
    } catch (err) {
      console.error("Execution Error:", err);
      setStatusMsg({ type: 'error', text: 'Connection failed or logic error. Check console.' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full max-h-[calc(100vh-250px)]">
      {/* Left Panel: Instructions & Tests */}
      <div className="flex flex-col gap-6 overflow-hidden">
        <div className="p-8 rounded-[2.5rem] glass border border-white/5 space-y-6 overflow-y-auto grow shadow-xl">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] bg-accent/10 text-accent px-3 py-1 rounded-full font-black tracking-[0.2em] uppercase">
              Python Lab
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase border',
                  toneStyles[difficultyTone(difficulty)],
                )}
              >
                {difficultyBand(difficulty)}
              </span>
              <span className="text-[10px] text-white/35 font-bold tracking-widest uppercase">
                Problem {difficulty} · Session
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">{title}</h1>
          <p className="text-muted-foreground leading-relaxed text-base">{description}</p>

          {(exampleInput != null && exampleInput !== '') || (exampleOutput != null && exampleOutput !== '') ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/90">Example</p>
              {exampleInput != null && exampleInput !== '' && (
                <p className="text-xs text-white/70">
                  <span className="text-white/40 font-bold uppercase tracking-wider">In · </span>
                  <code className="text-emerald-400/90 whitespace-pre-wrap font-mono">{exampleInput}</code>
                </p>
              )}
              {exampleOutput != null && exampleOutput !== '' && (
                <p className="text-xs text-white/70">
                  <span className="text-white/40 font-bold uppercase tracking-wider">Out · </span>
                  <code className="text-sky-300/90 whitespace-pre-wrap font-mono">{exampleOutput}</code>
                </p>
              )}
            </div>
          ) : null}

          {hints.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                <Lightbulb className="w-3.5 h-3.5" />
                Hints
              </div>
              <ul className="text-sm text-white/70 space-y-1.5 list-disc list-inside">
                {hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Test Cases List */}
          <div className="space-y-4 pt-4 border-t border-white/5">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> Test Scenarios
            </h4>
            <div className="space-y-3">
              {tests.map((test, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-all duration-500 ${
                  testResults[i] 
                    ? testResults[i].passed ? 'bg-success/5 border-success/30' : 'bg-error/5 border-error/30'
                    : 'bg-white/5 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Case {i + 1}</span>
                    {testResults[i] && (
                      testResults[i].passed 
                        ? <CheckCircle2 className="w-4 h-4 text-success" />
                        : <XCircle className="w-4 h-4 text-error" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-[9px] text-white/20 uppercase mb-1 font-bold">Input</div>
                      <code className="text-white/60 font-mono">{test.input || 'None'}</code>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/20 uppercase mb-1 font-bold">Expected</div>
                      <code className="text-white/60 font-mono">{test.output || test.expected || 'None'}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Alert */}
        <AnimatePresence>
          {statusMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-[2rem] border flex gap-4 items-center shrink-0 ${
                statusMsg.type === 'success' ? 'bg-success/10 border-success/30' : 
                statusMsg.type === 'error' ? 'bg-error/10 border-error/30' : 'bg-primary/10 border-primary/30'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
              ) : statusMsg.type === 'error' ? (
                <XCircle className="w-6 h-6 text-error shrink-0" />
              ) : (
                <RefreshCw className="w-6 h-6 text-primary shrink-0 animate-spin" />
              )}
              <div>
                <p className="text-sm font-bold text-white">{statusMsg.text}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Panel: Editor & Console */}
      <div className="rounded-[2.5rem] bg-[#020408] border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
        <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-error/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary fill-current" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black">main.py</span>
          </div>
        </div>

        <div className="flex-grow relative">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              fontSize: 15,
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              minimap: { enabled: false },
              padding: { top: 24 },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Output Console (Collapsible) */}
        {output !== null && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            className="border-t border-white/10 bg-black/80 backdrop-blur-2xl p-6"
          >
            <div className="text-[10px] uppercase font-black tracking-widest text-white/20 mb-3 flex justify-between items-center">
              <span>Standard Output</span>
              <button onClick={() => setOutput(null)} className="hover:text-white transition-colors">Close</button>
            </div>
            <pre className={`font-mono text-sm whitespace-pre-wrap leading-relaxed ${statusMsg?.type === 'error' ? 'text-error/80' : 'text-success/90'}`}>
              {output || 'No output captured.'}
            </pre>
          </motion.div>
        )}

        {/* Action Bar */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2 text-[9px] text-white/20 font-black uppercase tracking-widest">
            <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
            Python 3.10 runtime
          </div>
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              onClick={() => runCode(false)}
              disabled={isExecuting}
              className="rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5 flex gap-2 h-12 px-6"
            >
              {isExecuting ? 'Running...' : <><Play className="w-3 h-3 fill-current" /> Run Tests</>}
            </Button>
            <Button 
              onClick={() => runCode(true)}
              className="bg-primary text-white hover:bg-primary/90 rounded-2xl font-black text-[10px] uppercase tracking-widest px-10 h-12 shadow-xl shadow-primary/20"
            >
              Submit <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
