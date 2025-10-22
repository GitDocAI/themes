// Suppress ENOENT errors for dict directory
const originalEmit = process.emit;

process.emit = function (event, error) {
  if (
    event === 'warning' &&
    error &&
    error.message &&
    error.message.includes('ENOENT') &&
    error.message.includes('/dict')
  ) {
    // Suppress this specific error
    return false;
  }
  return originalEmit.apply(this, arguments);
};

// Suppress console.log
const originalConsoleLog = console.log;
console.log = function (...args) {
  const logString = args.join(' ');
  if (logString.includes('ENOENT') && logString.includes('/dict')) {
    // Suppress this specific error
    return;
  }
  if (logString.includes('[nextra]') && logString.includes('Init git repository failed')) {
    // Suppress nextra git warning
    return;
  }
  originalConsoleLog.apply(console, args);
};

// Suppress console.error
const originalConsoleError = console.error;
console.error = function (...args) {
  const errorString = args.join(' ');
  if (errorString.includes('ENOENT') && errorString.includes('/dict')) {
    // Suppress this specific error
    return;
  }
  originalConsoleError.apply(console, args);
};

// Suppress console.warn
const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  const warnString = args.join(' ');
  if (warnString.includes('ENOENT') && warnString.includes('/dict')) {
    // Suppress this specific error
    return;
  }
  if (warnString.includes('nextra') && warnString.includes('git')) {
    // Suppress all nextra git warnings
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Suppress stdout writes
const originalStdoutWrite = process.stdout.write;
process.stdout.write = function (chunk, encoding, callback) {
  const output = chunk.toString();
  if (output.includes('ENOENT') && output.includes('/dict')) {
    // Suppress this specific error
    if (typeof encoding === 'function') {
      encoding();
    } else if (callback) {
      callback();
    }
    return true;
  }
  return originalStdoutWrite.apply(process.stdout, arguments);
};

// Suppress stderr writes
const originalStderrWrite = process.stderr.write;
process.stderr.write = function (chunk, encoding, callback) {
  const output = chunk.toString();
  if (output.includes('ENOENT') && output.includes('/dict')) {
    // Suppress this specific error
    if (typeof encoding === 'function') {
      encoding();
    } else if (callback) {
      callback();
    }
    return true;
  }
  if (output.includes('nextra') && output.includes('git')) {
    // Suppress all nextra git warnings
    if (typeof encoding === 'function') {
      encoding();
    } else if (callback) {
      callback();
    }
    return true;
  }
  return originalStderrWrite.apply(process.stderr, arguments);
};
