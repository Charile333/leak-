# TrendRadar 部署指南（方案B）

## 1. 部署架构概述

本方案将 TrendRadar 和中间层 API 一起部署在 AWS EC2 实例上，使用 Docker Compose 管理服务。

### 服务组成

| 服务名称 | 容器名称 | 端口映射 | 说明 |
|---------|---------|---------|------|
| backend-api | backend-api | 3001:3001 | 中间层 API，作为前端和 TrendRadar 的代理 |
| trendradar | trendradar | 8080:8080 | TrendRadar 舆情分析服务 |

## 2. 环境准备

### 2.1 AWS EC2 实例要求

- **操作系统**：Amazon Linux 2 或 Ubuntu 20.04+
- **实例类型**：至少 t2.medium（2核4G内存）
- **安全组**：
  - 入站规则：允许 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API), 8080 (TrendRadar)
  - 出站规则：允许所有流量

### 2.2 安装必要软件

在 EC2 实例上执行以下命令：

```bash
# 更新系统包
sudo yum update -y

# 安装 Docker
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# 安装 Docker Compose
wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)
sudo mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

## 3. 项目部署

### 3.1 克隆项目代码

```bash
# 登录到 EC2 实例
ssh -i "key.pem" ec2-user@13.236.132.48

# 克隆项目（或上传本地代码）
git clone <your-repository-url> leakradar
cd leakradar
```

### 3.2 配置环境变量

复制环境变量示例文件并根据实际情况修改：

```bash
cp .env.example .env
# 使用 vim 或 nano 编辑 .env 文件
vim .env
```

需要配置的关键环境变量：

```env
# AI分析配置（必填）
AI_API_KEY=your-ai-api-key
AI_MODEL=deepseek/deepseek-chat
AI_API_BASE=https://api.deepseek.com/v1

# API密钥（必填）
VITE_LEAKRADAR_API_KEY=your-leakradar-api-key
VITE_OTX_API_KEY=your-otx-api-key

# JWT配置（必填）
JWT_SECRET=your-jwt-secret-key-change-in-production

# 前端配置（根据实际情况修改）
VITE_BACKEND_URL=http://13.236.132.48:3001
VITE_TRENDRADAR_DASHBOARD_URL=http://13.236.132.48:8080/html/latest/current.html
```

### 3.3 启动服务

使用 Docker Compose 启动所有服务：

```bash
# 启动服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3.4 验证服务

1. **检查服务运行状态**：
   ```bash
   docker-compose ps
   ```
   确保两个服务的状态都是 `Up`

2. **检查 API 健康状态**：
   ```bash
   curl http://localhost:3001/health
   ```
   预期返回：`{"status":"ok","message":"Server is running"}`

3. **访问 TrendRadar 仪表板**：
   ```
   http://13.236.132.48:8080/html/latest/current.html
   ```

## 4. 前端部署

### 4.1 构建前端项目

在本地开发环境中执行：

```bash
# 安装依赖
npm install

# 构建前端项目
npm run build
```

### 4.2 部署前端到 AWS

可以选择以下方式之一部署前端：

#### 方式1：部署到 AWS S3 + CloudFront

1. 创建 S3 存储桶并启用静态网站托管
2. 将 `dist` 目录下的文件上传到 S3 存储桶
3. 配置 CloudFront 分发指向 S3 存储桶
4. 更新 CloudFront 域名到前端配置

#### 方式2：部署到 Vercel 或 Netlify

1. 将前端代码推送到 GitHub/GitLab
2. 在 Vercel/Netlify 上创建新项目
3. 配置环境变量 `VITE_BACKEND_URL` 为 `http://13.236.132.48:3001`
4. 部署项目

## 5. 服务管理

### 5.1 启动/停止服务

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

### 5.2 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend-api
docker-compose logs -f trendradar
```

### 5.3 更新服务

```bash
# 拉取最新代码
git pull

# 重新构建并启动服务
docker-compose up -d --build
```

## 6. 常见问题排查

### 6.1 服务无法启动

1. 检查环境变量配置：
   ```bash
   docker-compose logs backend-api
   ```
   查看是否有环境变量缺失或错误

2. 检查端口占用：
   ```bash
   sudo lsof -i :3001
   sudo lsof -i :8080
   ```

3. 检查 Docker 网络：
   ```bash
   docker network inspect trendradar-network
   ```

### 6.2 前端无法连接到后端

1. 检查 CORS 配置：
   - 确保 `server.js` 中的 CORS 配置包含前端域名
   - 示例：`origin: ['http://localhost:5174', 'http://your-frontend-domain.com']`

2. 检查安全组配置：
   - 确保 EC2 安全组允许 3001 端口的入站流量

### 6.3 TrendRadar 无法分析数据

1. 检查 AI API 配置：
   ```bash
   docker-compose logs trendradar
   ```
   查看是否有 AI API 调用错误

2. 检查 AI API 密钥是否有效

## 7. 监控与维护

### 7.1 监控服务状态

建议使用 AWS CloudWatch 监控 EC2 实例和服务日志，或安装 Prometheus + Grafana 进行更详细的监控。

### 7.2 定期更新

定期更新 Docker 镜像和项目代码：

```bash
# 更新 Docker 镜像
docker-compose pull

docker-compose up -d --build
```

## 8. 部署完成

部署完成后，你可以通过以下方式访问服务：

- **前端应用**：根据你选择的前端部署方式访问（如 S3 域名、Vercel 域名等）
- **中间层 API**：`http://13.236.132.48:3001`
- **TrendRadar 仪表板**：`http://13.236.132.48:8080/html/latest/current.html`

---

**部署完成！** 现在你已经成功部署了 TrendRadar 和中间层 API，可以开始使用舆情分析功能了。