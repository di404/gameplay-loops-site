# 经典玩法循环库（GitHub Pages）

从远古桌游到街机、主机与现代经典，按「问题 / 对手 / 失败 / 取舍」浏览可借鉴的玩法循环。

## 本地预览

```bash
cd gameplay-loops-site
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 发布到 GitHub Pages

1. 新建公开仓库（例如 `gameplay-loops-site`）
2. 把本目录推到 `main`
3. Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`
4. 站点地址：`https://<user>.github.io/gameplay-loops-site/`

若使用用户主页仓库 `<user>.github.io`，把文件放在仓库根目录即可。

## 数据

- `data/games.json` — 条目
- `data/meta.json` — 统计

欢迎 Issue / PR 修补循环字段。
