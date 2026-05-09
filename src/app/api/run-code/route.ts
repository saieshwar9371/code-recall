import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

type PythonExec = {
  command: string;
  args: string[];
};

const PYTHON_CANDIDATES: PythonExec[] =
  process.platform === 'win32'
    ? [
        { command: 'python', args: [] },
        { command: 'py', args: ['-3'] },
        { command: 'py', args: [] },
      ]
    : [{ command: 'python3', args: [] }, { command: 'python', args: [] }];

function executePython(
  executable: PythonExec,
  filePath: string,
  stdin: string | undefined
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    const child = spawn(executable.command, [...executable.args, filePath]);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    child.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, exitCode: null });
    });

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

export async function POST(req: Request) {
  try {
    const { language, files, stdin } = await req.json();

    if (language !== 'python') {
      return NextResponse.json({ error: 'Only python is supported locally' }, { status: 400 });
    }

    const code = files[0]?.content || '';
    
    // Create temporary file
    const tempDir = os.tmpdir();
    const fileId = Date.now().toString() + Math.random().toString(36).substring(7);
    const filePath = path.join(tempDir, `script-${fileId}.py`);
    await fs.writeFile(filePath, code);

    let runResult = { stdout: '', stderr: 'Python runtime not found on this machine.', exitCode: null as number | null };
    for (const executable of PYTHON_CANDIDATES) {
      const result = await executePython(executable, filePath, stdin);
      const commandNotFound =
        /ENOENT|not recognized as an internal or external command|No such file or directory|Python was not found|Install it from the Microsoft Store|App execution aliases/i.test(
          result.stderr
        ) ||
        (result.stdout.trim().length === 0 && result.exitCode === 9009);

      if (!commandNotFound) {
        runResult = result;
        break;
      }
    }

    // Cleanup
    await fs.unlink(filePath).catch(() => {});

    // Mimic Piston API response format so the frontend doesn't need structural changes
    return NextResponse.json({
      run: {
        output: runResult.stderr ? runResult.stderr : runResult.stdout,
        stdout: runResult.stdout,
        stderr: runResult.stderr
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Local Execution Error:', err);
    return NextResponse.json(
      { error: 'Failed to execute code locally', details: message },
      { status: 500 }
    );
  }
}
