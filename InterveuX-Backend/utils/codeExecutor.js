import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export const executeCode = async (code, language, input = '') => {
  return new Promise((resolve) => {
    try {
      let result = {
        output: '',
        error: null,
        executionTime: 0
      }

      const startTime = Date.now()

      // Basic code validation
      if (!code || code.trim().length === 0) {
        result.error = 'Code cannot be empty'
        return resolve(result)
      }

      // Language-specific execution
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          executeJavaScript(code, input, resolve, startTime)
          break
        case 'python':
        case 'py':
          executePython(code, input, resolve, startTime)
          break
        case 'java':
          executeJava(code, input, resolve, startTime)
          break
        case 'cpp':
        case 'c++':
          executeCpp(code, input, resolve, startTime)
          break
        case 'c':
          executeC(code, input, resolve, startTime)
          break
        default:
          result.error = `Language ${language} not supported`
          resolve(result)
      }
    } catch (error) {
      resolve({
        output: '',
        error: error.message,
        executionTime: 0
      })
    }
  })
}

const executeJavaScript = (code, input, resolve, startTime) => {
  try {
    // Simple JavaScript execution using eval (for demo purposes)
    const originalLog = console.log
    let output = ''
    
    console.log = (...args) => {
      output += args.join(' ') + '\n'
    }
    
    // Add input handling
    const mockInput = input ? input.split('\n') : []
    let inputIndex = 0
    global.readline = () => mockInput[inputIndex++] || ''
    
    // Set timeout for execution
    const timeoutId = setTimeout(() => {
      console.log = originalLog
      resolve({
        output: '',
        error: 'Code execution timeout (5 seconds)',
        executionTime: 5000
      })
    }, 5000)
    
    // Execute code
    eval(code)
    
    clearTimeout(timeoutId)
    console.log = originalLog
    
    resolve({
      output: output.trim(),
      error: null,
      executionTime: Date.now() - startTime
    })
  } catch (error) {
    console.log = console.log // Restore original console.log
    resolve({
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime
    })
  }
}

const executePython = (code, input, resolve, startTime) => {
  const tempFile = path.join(process.cwd(), 'temp_python.py')
  
  try {
    fs.writeFileSync(tempFile, code)
    
    // Try python3 first, then python
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const python = spawn(pythonCmd, [tempFile], { shell: true })
    let output = ''
    let error = ''
    let timeoutId
    
    if (input) {
      python.stdin.write(input)
      python.stdin.end()
    }
    
    python.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    python.stderr.on('data', (data) => {
      error += data.toString()
    })
    
    python.on('close', (exitCode) => {
      clearTimeout(timeoutId)
      try { fs.unlinkSync(tempFile) } catch {}
      resolve({
        output: output.trim(),
        error: error.trim() || null,
        executionTime: Date.now() - startTime
      })
    })
    
    python.on('error', (err) => {
      clearTimeout(timeoutId)
      try { fs.unlinkSync(tempFile) } catch {}
      resolve({
        output: '',
        error: `Python not found: ${err.message}`,
        executionTime: Date.now() - startTime
      })
    })
    
    // Timeout after 5 seconds
    timeoutId = setTimeout(() => {
      python.kill()
      try { fs.unlinkSync(tempFile) } catch {}
      resolve({
        output: '',
        error: 'Execution timeout (5 seconds)',
        executionTime: 5000
      })
    }, 5000)
    
  } catch (err) {
    resolve({
      output: '',
      error: err.message,
      executionTime: Date.now() - startTime
    })
  }
}

const executeJava = (code, input, resolve, startTime) => {
  const tempDir = path.join(process.cwd(), 'temp_java')
  const className = 'Main'
  const javaFile = path.join(tempDir, `${className}.java`)
  const classFile = path.join(tempDir, `${className}.class`)
  
  try {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }
    
    // Wrap code in Main class if not already wrapped
    let finalCode = code
    if (!code.includes('class Main') && !code.includes('public class')) {
      finalCode = `public class Main {
    public static void main(String[] args) {
        ${code}
    }
}`
    }
    
    fs.writeFileSync(javaFile, finalCode)
    
    // Compile Java code
    const javac = spawn('javac', [javaFile], { shell: true })
    let compileError = ''
    
    javac.stderr.on('data', (data) => {
      compileError += data.toString()
    })
    
    javac.on('close', (exitCode) => {
      if (exitCode !== 0) {
        cleanup()
        resolve({
          output: '',
          error: `Compilation error: ${compileError}`,
          executionTime: Date.now() - startTime
        })
        return
      }
      
      // Run compiled Java code
      const java = spawn('java', ['-cp', tempDir, className], { shell: true })
      let output = ''
      let error = ''
      let timeoutId
      
      if (input) {
        java.stdin.write(input)
        java.stdin.end()
      }
      
      java.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      java.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      java.on('close', () => {
        clearTimeout(timeoutId)
        cleanup()
        resolve({
          output: output.trim(),
          error: error.trim() || null,
          executionTime: Date.now() - startTime
        })
      })
      
      java.on('error', (err) => {
        clearTimeout(timeoutId)
        cleanup()
        resolve({
          output: '',
          error: `Java not found: ${err.message}`,
          executionTime: Date.now() - startTime
        })
      })
      
      timeoutId = setTimeout(() => {
        java.kill()
        cleanup()
        resolve({
          output: '',
          error: 'Execution timeout (5 seconds)',
          executionTime: 5000
        })
      }, 5000)
    })
    
    javac.on('error', (err) => {
      cleanup()
      resolve({
        output: '',
        error: `Java compiler not found: ${err.message}`,
        executionTime: Date.now() - startTime
      })
    })
    
    function cleanup() {
      try {
        if (fs.existsSync(javaFile)) fs.unlinkSync(javaFile)
        if (fs.existsSync(classFile)) fs.unlinkSync(classFile)
        if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir)
      } catch {}
    }
    
  } catch (err) {
    resolve({
      output: '',
      error: err.message,
      executionTime: Date.now() - startTime
    })
  }
}

const executeCpp = (code, input, resolve, startTime) => {
  const tempFile = path.join(process.cwd(), 'temp_cpp.cpp')
  const exeFile = path.join(process.cwd(), 'temp_cpp.exe')
  
  try {
    // Add main function if not present
    let finalCode = code
    if (!code.includes('int main') && !code.includes('void main')) {
      finalCode = `#include <iostream>
using namespace std;

int main() {
    ${code}
    return 0;
}`
    }
    
    fs.writeFileSync(tempFile, finalCode)
    
    // Compile C++ code
    const gpp = spawn('g++', [tempFile, '-o', exeFile], { shell: true })
    let compileError = ''
    
    gpp.stderr.on('data', (data) => {
      compileError += data.toString()
    })
    
    gpp.on('close', (exitCode) => {
      if (exitCode !== 0) {
        cleanup()
        resolve({
          output: '',
          error: `Compilation error: ${compileError}`,
          executionTime: Date.now() - startTime
        })
        return
      }
      
      // Run compiled executable
      const exe = spawn(exeFile, [], { shell: true })
      let output = ''
      let error = ''
      let timeoutId
      
      if (input) {
        exe.stdin.write(input)
        exe.stdin.end()
      }
      
      exe.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      exe.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      exe.on('close', () => {
        clearTimeout(timeoutId)
        cleanup()
        resolve({
          output: output.trim(),
          error: error.trim() || null,
          executionTime: Date.now() - startTime
        })
      })
      
      exe.on('error', (err) => {
        clearTimeout(timeoutId)
        cleanup()
        resolve({
          output: '',
          error: `Execution error: ${err.message}`,
          executionTime: Date.now() - startTime
        })
      })
      
      timeoutId = setTimeout(() => {
        exe.kill()
        cleanup()
        resolve({
          output: '',
          error: 'Execution timeout (5 seconds)',
          executionTime: 5000
        })
      }, 5000)
    })
    
    gpp.on('error', (err) => {
      cleanup()
      resolve({
        output: '',
        error: `C++ compiler not found: ${err.message}`,
        executionTime: Date.now() - startTime
      })
    })
    
    function cleanup() {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
        if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile)
      } catch {}
    }
    
  } catch (err) {
    resolve({
      output: '',
      error: err.message,
      executionTime: Date.now() - startTime
    })
  }
}

const executeC = (code, input, resolve, startTime) => {
  const tempFile = path.join(process.cwd(), 'temp_c.c')
  const exeFile = path.join(process.cwd(), 'temp_c.exe')
  
  try {
    // Add main function if not present
    let finalCode = code
    if (!code.includes('int main') && !code.includes('void main')) {
      finalCode = `#include <stdio.h>\n\nint main() {\n    ${code}\n    return 0;\n}`
    }
    
    fs.writeFileSync(tempFile, finalCode)
    
    // Compile C code
    const gcc = spawn('gcc', [tempFile, '-o', exeFile], { shell: true })
    let compileError = ''
    
    gcc.stderr.on('data', (data) => {
      compileError += data.toString()
    })
    
    gcc.on('close', (exitCode) => {
      if (exitCode !== 0) {
        cleanup()
        resolve({
          output: '',
          error: `Compilation error: ${compileError}`,
          executionTime: Date.now() - startTime
        })
        return
      }
      
      // Run compiled executable
      const exe = spawn(exeFile, [], { shell: true })
      let output = ''
      let error = ''
      let timeoutId
      
      if (input) {
        exe.stdin.write(input)
        exe.stdin.end()
      }
      
      exe.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      exe.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      exe.on('close', () => {
        clearTimeout(timeoutId)
        cleanup()
        resolve({
          output: output.trim(),
          error: error.trim() || null,
          executionTime: Date.now() - startTime
        })
      })
      
      exe.on('error', (err) => {
        clearTimeout(timeoutId)
        cleanup()
        resolve({
          output: '',
          error: `Execution error: ${err.message}`,
          executionTime: Date.now() - startTime
        })
      })
      
      timeoutId = setTimeout(() => {
        exe.kill()
        cleanup()
        resolve({
          output: '',
          error: 'Execution timeout (5 seconds)',
          executionTime: 5000
        })
      }, 5000)
    })
    
    gcc.on('error', (err) => {
      cleanup()
      resolve({
        output: '',
        error: `C compiler not found: ${err.message}`,
        executionTime: Date.now() - startTime
      })
    })
    
    function cleanup() {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
        if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile)
      } catch {}
    }
    
  } catch (err) {
    resolve({
      output: '',
      error: err.message,
      executionTime: Date.now() - startTime
    })
  }
}