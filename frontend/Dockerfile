# 使用官方镜像
# node 大版本与仓库根 .nvmrc 一致；pnpm 版本从 package.json 的 packageManager 解析
FROM node:26-alpine

# 安装nginx用于反向代理
RUN apk add --no-cache nginx

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    PNPM=$(node -p "require('./package.json').packageManager.slice(5)") \
 && npm i -g pnpm@$PNPM \
 && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 3000

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]