// 调试日志脚本，用于捕获和分析浏览器控制台日志
console.log('=== 调试日志捕获开始 ===');

// 重写控制台方法，捕获所有日志
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace
};

// 日志存储
const logs = [];

// 重写控制台方法
console.log = function(...args) {
  logs.push({ type: 'log', timestamp: new Date(), args });
  originalConsole.log.apply(console, args);
};

console.error = function(...args) {
  logs.push({ type: 'error', timestamp: new Date(), args });
  originalConsole.error.apply(console, args);
};

console.warn = function(...args) {
  logs.push({ type: 'warn', timestamp: new Date(), args });
  originalConsole.warn.apply(console, args);
};

console.info = function(...args) {
  logs.push({ type: 'info', timestamp: new Date(), args });
  originalConsole.info.apply(console, args);
};

console.debug = function(...args) {
  logs.push({ type: 'debug', timestamp: new Date(), args });
  originalConsole.debug.apply(console, args);
};

console.trace = function(...args) {
  logs.push({ type: 'trace', timestamp: new Date(), args });
  originalConsole.trace.apply(console, args);
};

// 定期输出日志摘要
setInterval(() => {
  if (logs.length > 0) {
    console.log(`\n=== 日志摘要 (${new Date().toLocaleString()}) ===`);
    console.log(`总日志数: ${logs.length}`);
    
    // 分类统计
    const logTypes = logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});
    console.log('日志类型统计:', logTypes);
    
    // 查找包含十六进制值的日志
    const hexLogs = logs.filter(log => 
      log.args.some(arg => 
        typeof arg === 'string' && /0x[0-9a-fA-F]+/.test(arg) ||
        Array.isArray(arg) && arg.some(item => typeof item === 'string' && /0x[0-9a-fA-F]+/.test(item))
      )
    );
    
    if (hexLogs.length > 0) {
      console.log(`\n=== 包含十六进制值的日志 (${hexLogs.length}条) ===`);
      hexLogs.forEach((log, index) => {
        console.log(`[${index + 1}] ${log.type.toUpperCase()}:`, log.args);
      });
    }
    
    // 清空日志
    logs.length = 0;
  }
}, 5000);

console.log('调试日志捕获已启动，每5秒输出一次摘要');
console.log('=== 调试日志捕获设置完成 ===');
