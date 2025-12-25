import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  History, 
  Trash2, 
  Download, 
  Maximize2, 
  X, 
  AlertTriangle,
  Clock,
  Globe,
  Monitor,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';

interface ScreenshotRecord {
  id: string;
  timestamp: string;
  url: string;
  image: string;
  isErrorTriggered: boolean;
}

const PageMonitor = () => {
  const [history, setHistory] = useState<ScreenshotRecord[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ScreenshotRecord | null>(null);
  const [zoom, setZoom] = useState(1);
  const [storageType, setStorageType] = useState<'local' | 'cloud'>('local');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('screenshot_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('screenshot_history', JSON.stringify(history));
  }, [history]);

  // Error monitoring
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.log('Error captured by monitor:', event.message);
      captureScreenshot(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const captureScreenshot = async (isError = false) => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      // Find the main content area to capture, or capture the whole body
      const element = document.body;
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: window.devicePixelRatio,
        logging: false,
        backgroundColor: '#0a0a0c'
      });

      // Add Annotation to Canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const timestamp = new Date().toLocaleString();
        const url = window.location.href;
        
        ctx.save();
        ctx.font = 'bold 24px Inter, system-ui, sans-serif';
        const textWidth = Math.max(ctx.measureText(timestamp).width, ctx.measureText(url).width);
        
        // Background for text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - textWidth - 60, canvas.height - 100, textWidth + 40, 80);
        
        // Text
        ctx.fillStyle = '#a855f7'; // accent color
        ctx.textAlign = 'right';
        ctx.fillText('LeakRadar Monitor', canvas.width - 40, canvas.height - 70);
        
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(timestamp, canvas.width - 40, canvas.height - 45);
        
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(url, canvas.width - 40, canvas.height - 25);
        ctx.restore();
      }

      const base64Image = canvas.toDataURL('image/png');
      const newRecord: ScreenshotRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        url: window.location.href,
        image: base64Image,
        isErrorTriggered: isError
      };

      setHistory(prev => [newRecord, ...prev].slice(0, 20)); // Keep last 20 records
    } catch (error) {
      console.error('Screenshot failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const deleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const downloadImage = (record: ScreenshotRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.download = `screenshot-${record.id}.png`;
    link.href = record.image;
    link.click();
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Monitor className="text-accent w-8 h-8" />
            页面监测系统
          </h1>
          <p className="text-gray-500 mt-1">实时捕获页面状态，记录异常波动与视觉快照</p>
        </div>
        <div className="flex items-center gap-4 bg-[#0f0f12]/30 border border-[#4f46e5]/20 p-1.5 rounded-xl">
          <button 
            onClick={() => setStorageType('local')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              storageType === 'local' ? 'bg-[#4f46e5] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            本地存储
          </button>
          <button 
            onClick={() => setStorageType('cloud')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              storageType === 'cloud' ? 'bg-accent text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            云端存储
          </button>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              // Trigger a fake error to test the monitor
              const error = new Error('模拟系统异常：数据源同步失败');
              window.dispatchEvent(new ErrorEvent('error', {
                error: error,
                message: error.message
              }));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            模拟异常
          </button>
          <button 
            onClick={() => captureScreenshot(false)}
            disabled={isCapturing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              isCapturing 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-accent hover:bg-accent/80 text-white purple-glow'
            }`}
          >
            <Camera className={`w-5 h-5 ${isCapturing ? 'animate-pulse' : ''}`} />
            {isCapturing ? '正在捕获...' : '立即截图'}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-[#4f46e5]/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#4f46e5]/10 rounded-xl">
              <History className="w-6 h-6 text-[#a855f7]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">历史快照</p>
              <p className="text-2xl font-bold">{history.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-brand/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">异常触发</p>
              <p className="text-2xl font-bold">{history.filter(h => h.isErrorTriggered).length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-brand/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-gray-500">最近监测</p>
              <p className="text-sm font-medium">{history[0]?.timestamp || '无记录'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            截图历史
          </h2>
          {history.length > 0 && (
            <button 
              onClick={() => {
                if (window.confirm('确定要清空所有历史记录吗？')) {
                  setHistory([]);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空历史
            </button>
          )}
        </div>
        
        {history.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-brand/30">
            <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">暂无监测快照，点击上方按钮开始捕获</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {history.map((record) => (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative glass-card overflow-hidden border-brand/20 hover:border-accent/50 transition-all cursor-pointer"
                  onClick={() => setSelectedImage(record)}
                >
                  {/* Image Preview */}
                  <div className="aspect-video overflow-hidden bg-black/40">
                    <img 
                      src={record.image} 
                      alt="Screenshot" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  
                  {/* Info Overlay */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        record.isErrorTriggered ? 'bg-red-500 text-white' : 'bg-brand/20 text-brand'
                      }`}>
                        {record.isErrorTriggered ? '异常触发' : '手动捕获'}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => downloadImage(record, e)}
                          className="p-1.5 bg-brand-dark/80 rounded-lg hover:text-accent"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => deleteRecord(record.id, e)}
                          className="p-1.5 bg-brand-dark/80 rounded-lg hover:text-red-500"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {record.timestamp}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                        <Globe className="w-3 h-3 shrink-0" />
                        {record.url}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Image Detail Modal with Zoom/Drag */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4 text-white">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold">快照详情</h3>
                  <span className="text-sm text-gray-400">{selectedImage.timestamp}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-brand-dark/50 border border-brand/20 rounded-lg p-1 mr-4">
                    <button 
                      onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                      className="p-2 hover:text-accent transition-colors"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-mono w-12 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button 
                      onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                      className="p-2 hover:text-accent transition-colors"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <div className="w-px h-4 bg-brand/20 mx-1" />
                    <button 
                      onClick={() => setZoom(1)}
                      className="p-2 hover:text-accent transition-colors"
                      title="重置缩放"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-2 bg-white/10 rounded-full hover:bg-red-500 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Zoomable/Draggable Area */}
              <div 
                ref={containerRef}
                className="flex-1 relative overflow-hidden bg-brand-dark/30 rounded-2xl border border-brand/20 cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  drag
                  dragConstraints={containerRef}
                  style={{ scale: zoom }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <img 
                    src={selectedImage.image} 
                    alt="Full Snapshot" 
                    className="max-w-none shadow-2xl pointer-events-none"
                    style={{ 
                      width: '100%',
                      height: 'auto'
                    }}
                  />
                  
                  {/* Annotation Watermark */}
                  <div className="absolute bottom-10 right-10 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-right pointer-events-none">
                    <p className="text-accent font-bold text-lg">LeakRadar Monitor</p>
                    <p className="text-white/80 text-sm">{selectedImage.timestamp}</p>
                    <p className="text-white/40 text-xs mt-1">{selectedImage.url}</p>
                  </div>
                </motion.div>

                {/* Interaction Hint */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] text-gray-400 border border-white/5 pointer-events-none">
                  <Move className="w-3 h-3" />
                  按住拖动 · 滚轮或上方按钮缩放
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PageMonitor;
