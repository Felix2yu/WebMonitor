# WebMonitor —— 目标约定见 Felix2yu/.github/docs/makefile.md
#
# 七个必备目标：build / dev / test / lint / fmt / docker / clean
# 其余目标按仓库自身需要添加。
.PHONY: build dev test lint lint-strict fmt docker clean

PNPM := pnpm

## 前端静态产物构建到 frontend/dist
build:
	cd frontend && $(PNPM) install --frozen-lockfile && $(PNPM) run build

dev:
	cd frontend && $(PNPM) run dev

## 后端目前没有单测；前端也没有测试运行器，故只做构建校验
test: build
	@echo "无自动化测试：前端只有构建校验，后端无测试用例"

lint:
	@echo "未配置 eslint / 后端 linter"

fmt:
	@echo "未配置格式化工具"

## 单镜像：node 构建前端 + python 运行后端，见 Dockerfile.slim
docker:
	docker build -f Dockerfile.slim -t webmonitor:slim .

clean:
	rm -rf frontend/dist frontend/node_modules
