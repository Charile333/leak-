// 检查浏览器控制台日志的脚本
console.log('检查浏览器控制台日志...');

// 监听并捕获所有控制台日志
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

const logs = [];

console.log = (...args) => {
  logs.push({ type: 'log', args });
  originalLog.apply(console, args);
};

console.error = (...args) => {
  logs.push({ type: 'error', args });
  originalError.apply(console, args);
};

console.warn = (...args) => {
  logs.push({ type: 'warn', args });
  originalWarn.apply(console, args);
};

console.info = (...args) => {
  logs.push({ type: 'info', args });
  originalInfo.apply(console, args);
};

// 定期输出捕获的日志
setInterval(() => {
  if (logs.length > 0) {
    console.log(`捕获到 ${logs.length} 条日志:`);
    logs.forEach((log, index) => {
      console.log(`[${index}] ${log.type}:`, ...log.args);
    });
    logs.length = 0; // 清空日志
  }
}, 5000);

console.log('日志监听器已启动...');
console.log('请刷新页面或执行操作，查看是否有 trae-preview 相关日志');
