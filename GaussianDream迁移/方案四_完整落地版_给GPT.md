# 方案四（最终选定）：VLM LoRA + 3D token prefix —— 完整落地规格

> **这是最终选定方案。** 硬件 4×A100 40GB。
> 目标：RoboTwin 2.0 后训练，3D token 作为 prefix 流入 VLM，VLM 用 LoRA 学读它们，训练期 render loss 逼 3D 编码，推理丢解码头留 prefix。
> 断点 1（相机参数）、断点 2（RGB render loss）见 `任务书_断点1和2_给GPT.md`，本文件假设那两个已完成，专注断点 3 的 LoRA 版实现。

代码根：`c:/Users/Easy/Desktop/LingBot/LingBot/`
参考：`c:/Users/Easy/Desktop/LingBot/Papers/GaussianDream/code/`

---

## 0. 方案核心（一句话）
不新增 segment、不改 prefix 结构，而是**复用方案一的 5 处兼容点把 256 个 3D token 塞进 prefix**；VLM 主干冻结、挂 LoRA 让 VLM 学会读这 256 个新 token；3D 分支 + LoRA 参与训练，其余冻结。

**与方案一唯一区别**：VLM 从"全量训"改成"冻结主干 + LoRA"。prefix 的 5 处兼容改动**完全一样**（见第 2 节）。

---

## 1. 硬件与训练设置
- **4×A100 40GB**（全用）
- VLM 主干冻结（只存权重 ~8GB，无梯度/优化器）；LoRA r=4~16 + 3D 分支可训
- `micro_batch_size`：8~16（40GB 装不下 32）；global 64~128，必要时梯度累积到 256
- `enable_gradient_checkpointing: true`
- rasterizer 128² 起步（OOM 则再降）
- Muon 或 AdamW 均可；LoRA 学习率通常比全量大（约 1e-4 量级起步）
- **时长**：约 6~10 s/it，1~2 万步收敛 → **3~6 天**（8×40GB 减半）

---

## 2. 断点 3：prefix 的 5 处兼容点（和方案一相同，必改）

prefix 结构 = 1 条内容数组 + 3 条等长属性数组（`pad_masks` / `input_ids` / `visual_masks`）+ 1 套现算位置号。新增 256 格必须同步，否则错位。都在 `modeling_lingbot_vla_v2.py:499-739` 与 `utils.py:98-201`。

1. **插 token 时用 `_append`，4 条数组一起加**（:617-628）。只加内容不加属性 → cat 后长度对不上、报错。
2. **`input_ids` 填非图片 id**（如 eos，:684-690）。填"图片"会让位置编码去查不存在的照片行列 → 崩。
3. **`visual_masks` 填 0**。`_append` 省略第 4 参数会自动填 0（:626-628），**这处基本不用动手**。
4. **插入位置在 `future_depth` 之前**。队尾遮挡 `block_suffix_to_fv_`（utils.py:172-201）从尾部倒推，默认 future_depth 在最后；放它后面会遮错、泄露未来信息。
5. **名单 `prefix_query_segments` / `prefix_query_token_spans`（utils.py:98-159）登记 `"gs_3d": 256`**。不登记 → 循环不 append、且切不出 hidden。

**切 hidden**：`prefix_query_token_spans(...)["gs_3d"]` → `prefix_out[:, s:e, :]` = `[B,256,2560]` 送 Gaussian Decoder（仿 `_current_depth_task_tokens`，:749-765）。

**N_q=256**：Decoder 的 `_normalize_tokens_to_canonical_grid`（decoder.py:429-452）会用可微插值把 16² 归一到 32²，直接送 `[B,256,2560]` 即可。

---

## 3. VLM 上 LoRA（本方案核心）

用 LingBot 自带的 `lingbotvla/utils/lora_utils.py`（基于 peft 的 `inject_adapter_in_model`）：
- `add_lora_to_model(model, lora_rank=8~16, lora_alpha=2×rank, lora_target_modules="q,k,v,o,ffn.0,ffn.2")`
- 它内部先 `freeze_parameters`（:21-26）把主干 `requires_grad_(False)`，再注入 LoRA
- LoRA 参数 fp32（:54-60）

**注意**：确保 LoRA 注入作用在 **VLM 主干（qwenvl）** 上，而不是 action expert（我们要冻结 action expert）。
**不要 detach** 这条链：`h_3d → prefix → VLM(LoRA) → prefix_out → Decoder → L_render`，梯度要从 loss 回到 LoRA 和 3D token。

---

## 4. 3D 分支与 loss
- 3D encoder（VGGT 风格）冻结主干，只训适配层 → 从三视角 RGB 出 3D 特征 → 投影到 2560 进 3D token
- Gaussian Decoder 读 `h_3d`，出 G_t；Rasterizer 用断点 1 的静态 K/T 渲染 RGB_hat（断点 2：只 RGB，无 depth）
- loss：`L_total = L_action + λ₁·L_render + 原有蒸馏loss`（原有蒸馏 loss 保持不变）
- 汇聚位置：`modeling_lingbot_vla_v2.py:847-918` 算，wrapper `:1305-1312` 求和；训练端 `train_lingbotvla.py:802-818` 只收固定 tuple（6/8/10/11 项）——**不改 tuple 长度**，把 `L_render` 塞进 loss_dict / 在 wrapper 相加

---

## 5. 必须做的消融（论文需要）
因为"LoRA 学读全新 3D token"没有直接文献验证，论文必须证明 LoRA 没打折：
- 在小数据子集上跑 **LoRA vs 全量 VLM** 对比
- 若成功率差 <1~2 点 → framing 成"参数高效 3D 后训练，效果等价全量"（加分项）
- 若差距大 → 把全量作为主方案，LoRA 作为 efficiency 讨论
- 同时做 **有无 3D 分支** 的消融（证明涨点来自 3D，不是 LoRA 本身）

---

## 6. 推理路径
Decoder / Rasterizer / render loss / 3D encoder 主干丢弃；**LoRA 权重 + 3D token + 3D 适配层保留**（在线生成 prefix）。论文如实写"省掉高斯解码与渲染，3D encoder 适配层仍跑"。

---

## 7. 验收清单
- [ ] 5 处 prefix 兼容点全改，能 forward 不报错
- [ ] LoRA 注入在 VLM 主干、action expert 确实冻结
- [ ] `h_3d` 能正确切出 `[B,256,2560]` 送 Decoder
- [ ] `L_render` 是图像空间 loss，梯度通到 LoRA 和 3D token（无 detach）
- [ ] 4×A100 40GB 上 micro_batch 8~16 不 OOM
- [ ] 消融实验：有/无 3D、LoRA/全量 两组对比跑通
