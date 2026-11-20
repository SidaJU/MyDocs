# 任务书：LingBot-VLA 2.0 接入 GaussianDream 3D 表征 —— 先做断点 1 和 2

> 只做断点 1、2。断点 3（3D token 注入 prefix）方案未定，**本轮不要动 prefix / embed_prefix / utils.py 的 segment**。
> 目标：为后续 3D 分支准备好「相机参数」和「渲染损失 target」这两个基础设施。

代码根：`c:/Users/Easy/Desktop/LingBot/LingBot/`
参考：`c:/Users/Easy/Desktop/LingBot/Papers/GaussianDream/code/`

---

## 断点 1：补上相机参数（静态配置，不占显存）

**现状**：LingBot 全链路没有相机内外参——`modeling_lingbot_vla_v2.py:767-784` 的 forward 参数、batch_dict（`data/vla_data/utils.py:613-623`）、`robotwin.yaml` 都只有相机名字。没有 K/T，后续 Gaussian 无法投影回图像、算不出 `RGB_hat`。

**要做**：
1. 从你 pin 的 RoboTwin 版本 `13c3c47ff4312dd62484bcd51be034af55c062d1` 的 `envs/camera/camera.py` 与 `envs/_GLOBAL_CONFIGS.py`，提取三个相机（cam_high / 左腕 / 右腕）的：
   - 内参 K：fx, fy, cx, cy，以及对应深度图分辨率
   - 外参 T_cam：相机相对世界/基座的位置与朝向
   - **必须用对 commit**：RoboTwin 有过重新渲染导致 FOV 从 37° 变 43° 的先例，错版本会让投影全错。
2. 存成 `configs/robot_configs/robotwin_camera.json`，按 view_name 组织三套 K/T。
3. 写一个工具函数 `get_camera_params_for_view(view_name, device, batch_size)`：
   - 仿 GaussianDream `policy.py:2242-2316` 的 `_get_camera_params_for_view`
   - 从静态配置查表，构造 `viewmatrix / projmatrix / tanfov / campos`
   - 第一版全样本共用常量即可，不做逐样本输入
   - 注意分辨率对齐：RoboTwin RGB 320×240，VLM 输入 224²，Gaussian latent 16²→渲染分辨率，插值要一致

**验收**：给定 view_name 能拿到合法的 4×4 投影矩阵和 3×3 内参；后续 Gaussian rasterizer 能用它把点投到图像平面。

---

## 断点 2：渲染监督只用 RGB，砍掉 depth loss

**现状**：`get_depth_target()`（`lingbotvla/models/vla/vision_models/module_utils.py:426-447`）返回的是 `[B,256,1024]` 的 MoRGBD 深度**特征**，原始 MoGe depth `[B,H,W]` 只是中间量 `depth_pred`（:435）随后被丢弃。因此 Gaussian 深度图 `D_hat` 想要的 `[B,1,256,256]` L1 target 在现有代码里不存在。

**要做**：
1. 后续 3D 分支的辅助 loss **只保留 `L_render(RGB_hat, I_t)`**：RGB 重建 loss = SSIM + L1（可选 LPIPS），**不要实现 Gaussian depth L1**。
2. 若代码里已有引用 `D_hat` / depth target 的地方，本轮先移除/注释掉，不要为它去改 `get_depth_target()`（不动 frozen teacher 管线）。
3. **`L_render` 是新写的图像空间 loss**，输入 `[B,3,H,W]`，现有 `_emb_loss`（`modeling_lingbot_vla.py:1604-1606`）是 `[B,256,1024]` 特征空间，**不能复用**。
4. 注意：RGB render loss 依赖断点 1 的相机参数（要把 Gaussian 投影成 RGB_hat），所以断点 1 必做。

**验收**：有可调用的 RGB 渲染 loss 函数，输入渲染图与当前帧图像，输出标量；不依赖任何 depth target。

---

## 本轮明确不做（避免改错）
- ❌ 不动 `embed_prefix` / `prefix_query_segments` / `prefix_query_token_spans` / 那张"名单"——断点 3 未定
- ❌ 不新增 3D token、不改 prefix 结构、不改 attention mask / position_ids
- ❌ 不改 forward 的 tuple 返回值形态
- ❌ 不动 teacher 权重

这两个断点做完，3D 分支的基础设施（相机 + 渲染 target）就位，断点 3 方案定了之后可以直接接上。
