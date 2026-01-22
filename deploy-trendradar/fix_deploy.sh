#!/bin/bash

# TrendRadar 部署修复脚本
# 用于解决 Docker 挂载权限、数据目录缺失等问题

echo "=== 开始修复 TrendRadar 部署 ==="

# 1. 停止现有服务
echo "[1/6] 停止服务..."
docker-compose down

# 2. 清理并重建数据目录 (解决权限问题)
echo "[2/6] 重置数据目录..."
# 如果是 root 运行的，可能需要 sudo
if [ -d "data" ]; then
    sudo rm -rf data
fi

mkdir -p data/news
# 赋予最高权限，确保容器内非 root 用户也能写入
chmod -R 777 data
echo "数据目录已重建: data/news (权限 777)"

# 3. 检查配置文件
echo "[3/6] 检查配置文件..."
if [ ! -f "TrendRadar/config/config.yaml" ]; then
    echo "警告: TrendRadar/config/config.yaml 不存在！"
    echo "尝试从 example 复制..."
    if [ -f "TrendRadar/config/config.yaml.example" ]; then
        cp TrendRadar/config/config.yaml.example TrendRadar/config/config.yaml
        echo "配置文件已创建。"
    else
        echo "错误: 找不到 config.yaml.example，请检查源码是否完整。"
        exit 1
    fi
fi

# 4. 启动服务
echo "[4/6] 启动 Docker 容器..."
docker-compose up -d --build

echo "等待 10 秒让服务初始化..."
sleep 10

# 5. 手动触发一次爬虫
echo "[5/6] 手动触发爬虫任务..."
docker exec trend-radar python manage.py run

# 6. 验证数据
echo "[6/6] 验证数据生成..."
if ls data/news/*.db 1> /dev/null 2>&1; then
    echo "✅ 成功！检测到数据库文件："
    ls -l data/news/*.db
    echo "API 应该可以正常读取数据了。"
else
    echo "⚠️ 警告: 尚未检测到数据库文件。"
    echo "请检查 'docker logs trend-radar' 查看爬虫日志。"
fi

echo "=== 修复完成 ==="
