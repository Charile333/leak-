# TrendRadar 部署指南 (AWS EC2)

## 1. 准备工作
1. 登录 AWS EC2，确保安装了 `docker` 和 `docker-compose`。
2. 确保 AWS 安全组 (Security Group) 开放了 **8000** 端口 (入站规则)。

## 2. 上传文件
将 `deploy-trendradar` 文件夹上传到服务器：
```bash
scp -r deploy-trendradar user@<your-ec2-ip>:~/
```

## 3. 启动服务
进入目录，先克隆 TrendRadar 源码：
```bash
cd ~/deploy-trendradar

# 克隆源码到本地目录
git clone https://github.com/sansan0/TrendRadar.git

# 设置 API Key (如果需要 AI 分析)
export OPENAI_API_KEY="sk-xxxx"

# 启动
docker-compose up -d --build
```

## 4. 验证
访问 `http://<your-ec2-ip>:8000/`，如果看到 `{"status": "online"}` 说明接口已就绪。
访问 `http://<your-ec2-ip>:8000/api/trends` 查看数据。

## 5. 配置前端
在本地开发环境的 `.env` 中添加：
```
VITE_TREND_API_URL=http://<your-ec2-ip>:8000
```
