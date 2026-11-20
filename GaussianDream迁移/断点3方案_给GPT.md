# LingBot-VLA 2.0 接入 GaussianDream 3D 表征：断点 3 方案

> **目标**：用 RoboTwin 2.0 做后训练，让一组专用 3D token 作为 prefix 流入 VLM，训练期用渲染 loss 逼它编码 3D，推理时丢解码头、留 prefix。
> **注意**：断点 1（相机参数）、断点 2（RGB render loss）已单独成文（`任务书_断点1和2_给GPT.md`），本文件**只讲断点 3**。

代码根：`c:/Users/Easy/Desktop/LingBot/LingBot/`
参考：`c:/Users/Easy/Desktop/LingBot/Papers/GaussianDream/code/`

---

## 前提（所有方案通用）

**N_q=256**：256=16²。Decoder 的 `_normalize_tokens_to_canonical_grid`（decoder.py:429-452）会用可微插值把 16²/32² 都归一到 canonical 32²——直接把 `h_3d [B,256,2560]` 送 Decoder 入口即可，不用自己对齐网格。

**不要 detach**：`h_3d → Decoder → L_render` 这条链上不加 `detach()` / `no_grad()`，让梯度能从 loss 回到 3D token 和 VLM。

---

# 方案一（选定）：新增独立 3D token segment + 改 prefix 5 处

## 做法
独立 256 个 3D token 作为新 segment 注入 prefix，VLM 加入训练（不冻结），两阶段都让 VLM 参与。

## prefix 的 5 处兼容点（都在 `embed_prefix` modeling_lingbot_vla_v2.py:499-739 与 utils.py:98-201）

prefix 结构 = 1 条内容数组 + 3 条等长标签数组 + 1 套现算位置号。新增 256 格必须让配套东西同步，否则错位。

1. **插格子时用 `_append`，4 条数组一起加**（:617-628）。只加内容不加标签 → cat 后长度对不上、报 shape 错。
2. **标签3（input_ids，哪来的）填"非图片"标记**（如 eos id，:684-690）。填"图片"会让位置编码去查不存在的照片行列坐标 → 编号错/崩。
3. **标签4（visual_mask，是不是图片块）填 0**。用 `_append` 且省略该参数会自动填 0（:626-628），**这处基本不用动手**；填 1 会把图片细节灌错位置。
4. **插入位置放在 `future_depth` 之前**。队尾遮挡功能 `block_suffix_to_fv_`（utils.py:172-201）用 `prefix_len - fv_len` 从尾部倒推，默认 future_depth 在最后；放它后面会让遮挡遮错、泄露未来信息。
5. **名单 `prefix_query_segments` / `prefix_query_token_spans`（utils.py:98-159）登记 `"gs_3d": 256`**。不登记：循环不会 append 这批 token，且之后算不出 span、切不出 hidden 送 Decoder。

**切 hidden**：`prefix_query_token_spans(...)["gs_3d"]` → `prefix_out[:, s:e, :]` 得 `[B,256,2560]` 送 Decoder（仿 `_current_depth_task_tokens`，:749-765）。

## 方案一的训练算力 / batch：8×A100 80GB 能跑，但要接受总 batch 变小

官方配置（robotwin.yaml:70-71）：`micro_batch_size=32`、`global_batch_size=1024`，注释明写 **32 GPUs**（32×32=1024）。官方在 32 卡上、每卡 micro_batch 32。

硬件 **8×A100 80GB**，只训 VLM(4B) + 3D 分支、冻结 action expert（~2B）。

- 参数量：4B bf16 ≈ 8GB，梯度 8GB，优化器状态（fp32）≈32GB，全套 ~48GB，FSDP 均摊 8 卡 ≈ 6GB/卡。冻结的 action expert 只占前向激活、不占梯度/优化器。80GB 单卡余量充足。
- **每卡 micro_batch=32 大概率塞得下**（80GB 比 40GB 宽裕得多）；仍建议开 `enable_gradient_checkpointing: true` 留余量（robotwin.yaml:32，官方默认 false），rasterizer 256² 可试、OOM 则降 128²。
- 8 卡 × micro 32 = **global 256**（官方 1024 的 1/4）。想凑 1024 用 **4× 梯度累积**（慢，但和基线公平）；不凑则训练快，但要接受小 batch 带来的对比口径差异。
- **结论**：8×A100 80GB 跑方案一——**8 张吃满、micro_batch 可保持官方 32**，唯一妥协是总卡数只有官方 1/4，global batch 靠梯度累积凑或接受 256。显存风险低。
- （注：若退到 8×A100 40GB，则必须降 micro 到 8~16 + 强制梯度检查点 + rasterizer 128²，batch 跑不满。）

**时长估算**（锚点：官方 README:160-165，H20 单节点 8 卡 Muon **5.93 s/it**，`max_steps=50000` → 官方满训 ≈ 82h ≈ 3.4 天）：
- A100 80GB 算力约为 H20 的 2 倍，但显存带宽较低、且你多了 3D 分支（Gaussian Decoder + rasterizer 渲染）开销，两者抵消 → 每步约 **4~6 s/it**。
- **跑满 50000 步 ≈ 3~4 天**（8×A100 80GB）。若 4× 梯度累积凑 global 1024，每步变 4 倍但优化步数可少算，净时长相近、收敛口径更接近基线。
- 影响变量：步数（post-training 做消融可能 1~2 万步够）、rasterizer 分辨率（128² 比 256² 快很多）、梯度检查点（开则慢约 30%）。

## 训练与工程注意（方案一）
- VLM 加入训练：3D token 是 VLM 没见过的新输入，必须让 VLM 参与训练才能学会读它们。为稳可用 LoRA / 小学习率，但不冻结、不 detach。
- 先用 `L_render` 让 3D token 学到 3D 编码，再和 `L_action` 联合训（可两阶段，VLM 都参与）。
- loss 汇聚：`modeling_lingbot_vla_v2.py:847-918` 算 loss，wrapper `:1305-1312` 求和；训练端 `train_lingbotvla.py:802-818` 只收固定 tuple（6/8/10/11 项）——**不改 tuple 长度**，把 `L_render` 塞进 loss_dict / 在 wrapper 相加。
- teacher 全 frozen（MoGe / LingBot-Depth / DINO-Video）——frozen 的是 teacher，不是 VLM。
- 推理：Decoder / Rasterizer / render loss 丢弃；3D encoder 与 3D token 保留（需在线生成 prefix）。论文如实写"省掉高斯解码与渲染，但 3D encoder 仍跑"，不是零开销。

---

# 其他方案（简述，未选定）

- **方案二：复用现有 E 库 token 做 3D 调制**。不新增 segment，把 3D 特征投影后加到现有 depth/video 任务 token 上。改动 1 处、收敛快、显存省；但只有 8 个 token、语义混杂，**不是纯 3D 表征通道**，论文创新说服力弱。之前作为快速验证方案，已否决。
- **方案三：新增 3D token + α warmup（一次训练）**。代码和方案一完全相同（5 处），只是训练不严格分两阶段，用调制系数 α 从 0 渐增来稳定。省训练流程，但"学 3D 编码"和"学用 3D"混在一起，可能不如两阶段稳。
- **方案四：VLM 上 LoRA（40GB 估算）**。VLM 主干冻结（只存权重 ~8GB、无梯度/优化器），只训低秩补丁（LoRA r=4~16，几十万~几百万参数）+ 3D 分支。单卡 40GB 装得下（8GB 权重 + 前向激活 + teacher），`micro_batch` 需降到 8~16。**卡数：4×A100 40GB 够用**（global 64~128，或梯度累积到 256）；8×40GB 更宽裕、可用 micro 32。**验证状态**：VLA+LoRA 已有文献走通（arXiv 2512.11921 真机 SO-101；arXiv 2509.22195 VLM2VLA 用 LoRA 防灾难性遗忘），LingBot 自带 `lingbotvla/utils/lora_utils.py`（基于 peft）。但"LoRA 学读全新 3D token"无直接验证——**值得作为认真方案，但需加 LoRA vs 全量的消融**。代价：学读新 token 能力可能弱于全量；framing 成"参数高效后训练"。**时长估算**：官方 H20 单节点 5.93 s/it；LoRA 省主干反向、单步更快，但 4 卡 + 小 micro_batch/梯度累积抵消一部分 → 4×A100 40GB 约 **6~10 s/it**，跑满 50000 步约 **8~14 天**；但 LoRA 通常 1~2 万步收敛 → **3~6 天**。若用 8×A100 40GB 时长减半（约 4~7 天）。
